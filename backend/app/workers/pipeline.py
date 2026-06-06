"""
app/workers/pipeline.py
Phase 5 — Background processing pipeline.

This module runs the entire AI pipeline as a background task.
FastAPI receives the upload, creates the session, then fires this off
with asyncio's background tasks. The endpoint returns immediately.

The pipeline:
1. Updates DB status at each stage
2. Runs all AI generation in parallel after transcription
3. Records timing for every stage
4. Updates DB with final results
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from app.core.logging import logger
from app.core.timing import Timer, log_summary, init_timing
from app.core.status import ProcessingStatus
from app.core.errors import StudyLensError

from app.services.audio_service       import extract_audio
from app.services.transcription_service import transcribe_audio
from app.services.embedding_service   import store_segments
from app.services.summary_service     import generate_summary
from app.services.notes_service       import generate_notes
from app.services.quiz_service        import generate_quiz
from app.services.flashcard_service   import generate_flashcards
from app.utils.file_utils             import cleanup_files

# Shared thread pool for all blocking AI calls
_executor = ThreadPoolExecutor(max_workers=4)


async def _run(fn, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, fn, *args)


# ── Status updater — calls the Next.js API route ──────────────────────────────
import httpx
import os

_NEXTJS_URL    = os.getenv("NEXTJS_URL", "http://localhost:3000")
_INTERNAL_KEY  = os.getenv("INTERNAL_API_KEY", "")   # shared secret


async def _update_status(
    session_id: str,
    user_id:    str,
    status:     ProcessingStatus,
    extra:      Optional[dict] = None,
) -> None:
    """
    Push status update to Next.js API route which writes to DB.
    Fire-and-forget — errors are logged but don't stop the pipeline.
    """
    payload = {
        "status":  status.value,
        "_userId": user_id,
        **(extra or {}),
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.patch(
                f"{_NEXTJS_URL}/api/sessions/{session_id}",
                json=payload,
                headers={"x-internal-key": _INTERNAL_KEY},
            )
    except Exception as e:
        logger.warning(f"Status update failed for {session_id}: {e}")


# ── Main pipeline ─────────────────────────────────────────────────────────────

async def run_upload_pipeline(
    session_id: str,
    user_id:    str,
    video_path: str,
    filename:   str,
    video_url:  str,
) -> None:
    """
    Full AI pipeline for an uploaded video.
    Runs in the background after the upload endpoint returns.
    """
    init_timing(session_id)
    audio_path: Optional[str] = None

    try:
        # ── Stage 1: Extract audio ─────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.EXTRACTING_AUDIO)
        with Timer(session_id, "audio_extraction"):
            audio_path = await _run(extract_audio, video_path)

        # ── Stage 2: Transcribe ────────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.TRANSCRIBING)
        with Timer(session_id, "transcription"):
            transcript_data = await _run(transcribe_audio, audio_path)

        segments = transcript_data["segments"]
        if not segments:
            raise ValueError("No speech detected in video.")

        # ── Stage 3: Embeddings ────────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.GENERATING_EMBEDDINGS)
        with Timer(session_id, "embeddings"):
            await _run(store_segments, segments, session_id)

        # ── Stage 4: Parallel AI generation ───────────────────────────────
        # Update to first stage — all four run simultaneously
        await _update_status(session_id, user_id, ProcessingStatus.GENERATING_SUMMARY)

        logger.info(f"[{session_id}] Starting parallel AI generation")
        with Timer(session_id, "parallel_ai_generation"):
            summary, notes, quiz, flashcards = await asyncio.gather(
                _run(generate_summary,    segments),
                _run(generate_notes,      segments),
                _run(generate_quiz,       segments),
                _run(generate_flashcards, segments),
            )

        # ── Stage 5: Save results to DB ────────────────────────────────────
        with Timer(session_id, "db_update"):
            await _update_status(
                session_id,
                user_id,
                ProcessingStatus.READY,
                extra={
                    "videoUrl":   video_url,
                    "videoId":    session_id,
                    "title":      filename,
                    "duration":   segments[-1]["end"] if segments else None,
                    "transcript": transcript_data["text"],
                    "summary":    summary,
                    "notes":      notes,
                    "quiz":       quiz,
                    "flashcards": flashcards,
                    "segments":   segments,
                },
            )

        log_summary(session_id)
        logger.info(f"[{session_id}] Pipeline complete ✓")

    except Exception as exc:
        logger.error(f"[{session_id}] Pipeline failed: {exc}", exc_info=True)
        await _update_status(
            session_id,
            user_id,
            ProcessingStatus.ERROR,
            extra={"errorMessage": str(exc)},
        )

    finally:
        if audio_path:
            cleanup_files(audio_path)


async def run_youtube_pipeline(
    session_id: str,
    user_id:    str,
    url:        str,
) -> None:
    """
    Full AI pipeline for a YouTube URL.
    Download is included inside the background task.
    """
    from app.services.youtube_service import download_youtube_video
    import os

    init_timing(session_id)
    audio_path:  Optional[str] = None
    video_path:  Optional[str] = None

    try:
        # ── Stage 1: Download ──────────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.DOWNLOADING)
        with Timer(session_id, "youtube_download"):
            yt_info    = await _run(download_youtube_video, url)
            video_path = yt_info["file_path"]
            title      = yt_info["title"]
            video_url  = f"http://127.0.0.1:8000/{video_path}"

        # Update title now that we know it
        await _update_status(
            session_id, user_id,
            ProcessingStatus.EXTRACTING_AUDIO,
            extra={"title": title},
        )

        # ── Stage 2: Extract audio ─────────────────────────────────────────
        with Timer(session_id, "audio_extraction"):
            audio_path = await _run(extract_audio, video_path)

        # ── Stage 3: Transcribe ────────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.TRANSCRIBING)
        with Timer(session_id, "transcription"):
            transcript_data = await _run(transcribe_audio, audio_path)

        segments = transcript_data["segments"]
        if not segments:
            raise ValueError("No speech detected in video.")

        # ── Stage 4: Embeddings ────────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.GENERATING_EMBEDDINGS)
        with Timer(session_id, "embeddings"):
            await _run(store_segments, segments, session_id)

        # ── Stage 5: Parallel AI generation ───────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.GENERATING_SUMMARY)

        logger.info(f"[{session_id}] Starting parallel AI generation")
        with Timer(session_id, "parallel_ai_generation"):
            summary, notes, quiz, flashcards = await asyncio.gather(
                _run(generate_summary,    segments),
                _run(generate_notes,      segments),
                _run(generate_quiz,       segments),
                _run(generate_flashcards, segments),
            )

        # ── Stage 6: Save to DB ────────────────────────────────────────────
        with Timer(session_id, "db_update"):
            await _update_status(
                session_id,
                user_id,
                ProcessingStatus.READY,
                extra={
                    "videoUrl":   video_url,
                    "videoId":    session_id,
                    "title":      title,
                    "duration":   segments[-1]["end"] if segments else None,
                    "transcript": transcript_data["text"],
                    "summary":    summary,
                    "notes":      notes,
                    "quiz":       quiz,
                    "flashcards": flashcards,
                    "segments":   segments,
                },
            )

        log_summary(session_id)
        logger.info(f"[{session_id}] YouTube pipeline complete ✓")

    except Exception as exc:
        logger.error(f"[{session_id}] YouTube pipeline failed: {exc}", exc_info=True)
        await _update_status(
            session_id,
            user_id,
            ProcessingStatus.ERROR,
            extra={"errorMessage": str(exc)},
        )

    finally:
        if audio_path:
            cleanup_files(audio_path)