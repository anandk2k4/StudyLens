"""
Upload endpoint — production-grade:
- File validation (type, size, safe path)
- Structured error responses per pipeline stage
- Parallel AI generation (summary + notes + quiz run concurrently)
- Audio file cleaned up after processing
"""
import asyncio
import shutil
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.core.config import settings
from app.core.errors import StudyLensError
from app.core.logging import logger
from app.schemas.video import UploadResponse
from app.utils.file_utils import (
    validate_video_file,
    safe_filename,
    ensure_upload_dir,
    cleanup_files,
)
from app.services.audio_service import extract_audio
from app.services.transcription_service import transcribe_audio
from app.services.embedding_service import store_segments
from app.services.summary_service import generate_summary
from app.services.notes_service import generate_notes
from app.services.quiz_service import generate_quiz
from app.services.flashcard_service import generate_flashcards

router = APIRouter(prefix="/upload", tags=["Upload"])

# Shared thread pool for blocking AI calls
_executor = ThreadPoolExecutor(max_workers=3)


async def _run_in_thread(fn, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, fn, *args)


@router.post("/", response_model=UploadResponse)
async def upload_video(file: UploadFile = File(...)):
    ensure_upload_dir()

    # ── 1. Validate ───────────────────────────────────────────────────────────
    content = await file.read()
    try:
        validate_video_file(
            filename=file.filename or "upload",
            content_type=file.content_type or "",
            size=len(content),
        )
    except StudyLensError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"stage": exc.stage, "message": exc.message})

    # ── 2. Save with UUID-based filename (never use client filename as path) ──
    video_id, video_path = safe_filename(file.filename or "upload")
    with open(video_path, "wb") as f:
        f.write(content)
    logger.info(f"Saved upload: {video_path} ({len(content) // 1024} KB)")

    audio_path = None
    try:
        # ── 3. Extract audio ──────────────────────────────────────────────────
        audio_path = await _run_in_thread(extract_audio, video_path)

        # ── 4. Transcribe ─────────────────────────────────────────────────────
        transcript_data = await _run_in_thread(transcribe_audio, audio_path)
        segments = transcript_data["segments"]

        if not segments:
            raise HTTPException(status_code=422, detail={
                "stage": "transcription",
                "message": "No speech detected in the video."
            })

        # ── 5. Store embeddings ───────────────────────────────────────────────
        await _run_in_thread(store_segments, segments, video_id)

        # ── 6. Generate summary + notes + quiz IN PARALLEL ───────────────────
        logger.info("Running parallel AI generation (summary / notes / quiz / flashcards)")
        summary, notes, quiz, flashcards = await asyncio.gather(
            _run_in_thread(generate_summary,    segments),
            _run_in_thread(generate_notes,      segments),
            _run_in_thread(generate_quiz,       segments),
            _run_in_thread(generate_flashcards, segments),   # ← new
        )
        logger.info("AI generation complete")

    except HTTPException:
        raise
    except StudyLensError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"stage": exc.stage, "message": exc.message})
    except Exception as exc:
        logger.error(f"Unexpected error in upload pipeline: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail={"stage": "pipeline", "message": str(exc)})
    finally:
        # Always clean up the intermediate audio file
        if audio_path:
            cleanup_files(audio_path)

    return UploadResponse(
        video_id=video_id,
        filename=file.filename or "upload",
        video_url=f"http://127.0.0.1:{8000}/{video_path}",
        transcript=transcript_data["text"],
        segments=segments,
        summary=summary,
        notes=notes,
        quiz=quiz,
        flashcards=flashcards, 
    )