"""
YouTube endpoint — POST /youtube/

Accepts a YouTube URL, downloads the video, then runs it through
the exact same pipeline as a file upload (transcription → embeddings
→ parallel AI generation).
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.errors import StudyLensError, UploadError
from app.core.logging import logger
from app.schemas.video import UploadResponse
from app.services.youtube_service import download_youtube_video
from app.services.audio_service import extract_audio
from app.services.transcription_service import transcribe_audio
from app.services.embedding_service import store_segments
from app.services.summary_service import generate_summary
from app.services.notes_service import generate_notes
from app.services.quiz_service import generate_quiz
from app.utils.file_utils import cleanup_files

router = APIRouter(prefix="/youtube", tags=["YouTube"])

_executor = ThreadPoolExecutor(max_workers=3)


async def _run(fn, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, fn, *args)


class YouTubeRequest(BaseModel):
    url: str


@router.post("/", response_model=UploadResponse)
async def download_and_analyse(data: YouTubeRequest):
    audio_path = None

    try:
        # ── 1. Download ───────────────────────────────────────────────────────
        logger.info(f"YouTube request: {data.url}")
        yt_info = await _run(download_youtube_video, data.url)

        video_path  = yt_info["file_path"]
        video_id    = yt_info["video_id"]
        title       = yt_info["title"]

        # ── 2. Extract audio ──────────────────────────────────────────────────
        audio_path = await _run(extract_audio, video_path)

        # ── 3. Transcribe ─────────────────────────────────────────────────────
        transcript_data = await _run(transcribe_audio, audio_path)
        segments = transcript_data["segments"]

        if not segments:
            raise HTTPException(status_code=422, detail={
                "stage": "transcription",
                "message": "No speech detected in the video."
            })

        # ── 4. Store embeddings ───────────────────────────────────────────────
        await _run(store_segments, segments, video_id)

        # ── 5. Parallel AI generation ─────────────────────────────────────────
        logger.info("Running parallel AI generation for YouTube video")
        summary, notes, quiz = await asyncio.gather(
            _run(generate_summary, segments),
            _run(generate_notes, segments),
            _run(generate_quiz, segments),
        )

    except HTTPException:
        raise
    except StudyLensError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"stage": exc.stage, "message": exc.message}
        )
    except Exception as exc:
        logger.error(f"YouTube pipeline error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail={
            "stage": "pipeline",
            "message": str(exc)
        })
    finally:
        if audio_path:
            cleanup_files(audio_path)

    return UploadResponse(
        video_id=video_id,
        filename=title,
        video_url=f"http://127.0.0.1:8000/{video_path}",
        transcript=transcript_data["text"],
        segments=segments,
        summary=summary,
        notes=notes,
        quiz=quiz,
    )