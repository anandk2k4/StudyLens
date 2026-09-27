"""
app/workers/pipeline.py

Production Knowledge Base Pipeline for StudyLens AI.

Architecture:
  Video / YouTube
  ↓
  Audio Extraction
  ↓
  Whisper Transcription
  ↓
  Transcript Cleaning
  ↓
  Semantic Chunking
  ↓
  Knowledge Extraction (Single Pass Intelligence Layer)
  ↓
  Embeddings (Stored from semantic chunks)
  ↓
  Knowledge Base Created & Persisted
  ↓
  Parallel Feature Generation (Summary, Notes, Quiz, Flashcards, Chapters)
  ↓
  Session Ready
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Dict, Any

from app.core.logging import logger
from app.core.timing import Timer, log_summary, init_timing
from app.core.status import ProcessingStatus

from app.services.audio_service import extract_audio
from app.services.transcription_service import transcribe_audio
from app.services.chunking_service import create_semantic_chunks
from app.services.knowledge_extraction_service import extract_knowledge
from app.services.embedding_service import store_chunks, store_segments
from app.services.kb_feature_services import (
    generate_summary_from_kb,
    generate_notes_from_kb,
    generate_quiz_from_kb,
    generate_flashcards_from_kb,
)
from app.utils.file_utils import cleanup_files

import httpx, os

_executor = ThreadPoolExecutor(max_workers=5)
_NEXTJS_URL = os.getenv("NEXTJS_URL", "http://localhost:3000")
_INTERNAL_KEY = os.getenv("INTERNAL_API_KEY", "")


async def _run(fn, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, fn, *args)


async def _update_status(session_id: str, user_id: str, status: ProcessingStatus, extra: Optional[Dict] = None):
    payload = {"status": status.value, "_userId": user_id, **(extra or {})}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            await client.patch(
                f"{_NEXTJS_URL}/api/sessions/{session_id}",
                json=payload,
                headers={"x-internal-key": _INTERNAL_KEY},
            )
    except Exception as e:
        logger.warning(f"Status update failed for {session_id} ({status.value}): {e}")


async def _safe_generate(feature_name: str, fn, *args, default_val=None):
    """Wraps feature generation in try/except so one feature failure never kills the pipeline."""
    try:
        return await _run(fn, *args)
    except Exception as exc:
        logger.error(f"Feature [{feature_name}] generation failed: {exc}", exc_info=True)
        return default_val


async def run_upload_pipeline(
    session_id: str,
    user_id:    str,
    video_path: str,
    filename:   str,
    video_url:  str,
    source:     str = "UPLOAD",
) -> None:
    """Executes full Knowledge Base processing pipeline for uploaded videos."""
    init_timing(session_id)
    audio_path: Optional[str] = None

    try:
        # ── 1. Audio Extraction ───────────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.EXTRACTING_AUDIO)
        with Timer(session_id, "audio_extraction"):
            audio_path = await _run(extract_audio, video_path)

        # ── 2. Transcription ──────────────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.TRANSCRIBING)
        with Timer(session_id, "transcription"):
            transcript_data = await _run(transcribe_audio, audio_path)

        segments = transcript_data.get("segments", [])
        if not segments:
            raise ValueError("No speech detected in video.")

        # ── 3. Semantic Chunking ──────────────────────────────────────────────
        logger.info(f"[{session_id}] Creating semantic chunks from {len(segments)} segments")
        chunks = create_semantic_chunks(segments, target_words=250, max_words=400)

        # ── 4. Knowledge Base Construction ────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.BUILDING_KNOWLEDGE_BASE)
        logger.info(f"[{session_id}] Extracting structured knowledge base")

        with Timer(session_id, "knowledge_extraction"):
            kb_data = await _run(extract_knowledge, chunks, filename)

        # ── 5. Embeddings (Vector Store) ──────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.GENERATING_EMBEDDINGS)
        with Timer(session_id, "embeddings"):
            # Store semantic chunks for improved contextual retrieval
            await _run(store_chunks, chunks, session_id, user_id, session_id, filename, source)
            # Also store raw segments for backward-compatible segment-level seeking
            await _run(store_segments, segments, session_id, user_id, session_id, filename, source)

        # ── 6. Parallel Feature Generation from Knowledge Base ────────────────
        await _update_status(session_id, user_id, ProcessingStatus.GENERATING_FEATURES)
        logger.info(f"[{session_id}] Generating study features from Knowledge Base in parallel")

        with Timer(session_id, "parallel_feature_generation"):
            summary_task = _safe_generate("summary", generate_summary_from_kb, kb_data, default_val="")
            notes_task = _safe_generate("notes", generate_notes_from_kb, kb_data, default_val="")
            quiz_task = _safe_generate("quiz", generate_quiz_from_kb, kb_data, default_val=[])
            flashcards_task = _safe_generate("flashcards", generate_flashcards_from_kb, kb_data, default_val=[])

            summary, notes, quiz, flashcards = await asyncio.gather(
                summary_task, notes_task, quiz_task, flashcards_task
            )

        # Chapters come directly from structured knowledge extraction
        chapters = kb_data.get("chapters", [])

        # ── 7. Persist to Database ────────────────────────────────────────────
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
                    "chapters":   chapters,
                    "segments":   segments,
                    "knowledgeBase": {
                        "status": "READY",
                        "cleanedTranscript": transcript_data["text"],
                        "topics": kb_data.get("topics", []),
                        "concepts": kb_data.get("concepts", []),
                        "keyFacts": kb_data.get("key_facts", []),
                        "relationships": kb_data.get("relationships", []),
                        "learningObjectives": kb_data.get("learning_objectives", []),
                        "chapters": chapters,
                    },
                },
            )

        log_summary(session_id)
        logger.info(f"[{session_id}] Knowledge Base pipeline complete ✓")

    except Exception as exc:
        logger.error(f"[{session_id}] Knowledge Base pipeline failed: {exc}", exc_info=True)
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
    source:     str = "YOUTUBE",
) -> None:
    """Executes full Knowledge Base processing pipeline for YouTube videos."""
    from app.services.youtube_service import download_youtube_video

    init_timing(session_id)
    audio_path: Optional[str] = None
    video_path: Optional[str] = None

    try:
        # ── 1. YouTube Download ───────────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.DOWNLOADING)
        with Timer(session_id, "youtube_download"):
            yt_info    = await _run(download_youtube_video, url)
            video_path = yt_info["file_path"]
            title      = yt_info["title"]
            video_url  = f"http://127.0.0.1:8000/{video_path}"

        # ── 2. Audio Extraction ───────────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.EXTRACTING_AUDIO, extra={"title": title})
        with Timer(session_id, "audio_extraction"):
            audio_path = await _run(extract_audio, video_path)

        # ── 3. Transcription ──────────────────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.TRANSCRIBING)
        with Timer(session_id, "transcription"):
            transcript_data = await _run(transcribe_audio, audio_path)

        segments = transcript_data.get("segments", [])
        if not segments:
            raise ValueError("No speech detected in video.")

        # ── 4. Semantic Chunking ──────────────────────────────────────────────
        logger.info(f"[{session_id}] Creating semantic chunks from {len(segments)} segments")
        chunks = create_semantic_chunks(segments, target_words=250, max_words=400)

        # ── 5. Knowledge Base Construction ────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.BUILDING_KNOWLEDGE_BASE)
        logger.info(f"[{session_id}] Extracting structured knowledge base")

        with Timer(session_id, "knowledge_extraction"):
            kb_data = await _run(extract_knowledge, chunks, title)

        # ── 6. Embeddings (Vector Store) ──────────────────────────────────────
        await _update_status(session_id, user_id, ProcessingStatus.GENERATING_EMBEDDINGS)
        with Timer(session_id, "embeddings"):
            await _run(store_chunks, chunks, session_id, user_id, session_id, title, source)
            await _run(store_segments, segments, session_id, user_id, session_id, title, source)

        # ── 7. Parallel Feature Generation from Knowledge Base ────────────────
        await _update_status(session_id, user_id, ProcessingStatus.GENERATING_FEATURES)
        logger.info(f"[{session_id}] Generating study features from Knowledge Base in parallel")

        with Timer(session_id, "parallel_feature_generation"):
            summary_task = _safe_generate("summary", generate_summary_from_kb, kb_data, default_val="")
            notes_task = _safe_generate("notes", generate_notes_from_kb, kb_data, default_val="")
            quiz_task = _safe_generate("quiz", generate_quiz_from_kb, kb_data, default_val=[])
            flashcards_task = _safe_generate("flashcards", generate_flashcards_from_kb, kb_data, default_val=[])

            summary, notes, quiz, flashcards = await asyncio.gather(
                summary_task, notes_task, quiz_task, flashcards_task
            )

        chapters = kb_data.get("chapters", [])

        # ── 8. Persist to Database ────────────────────────────────────────────
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
                    "chapters":   chapters,
                    "segments":   segments,
                    "knowledgeBase": {
                        "status": "READY",
                        "cleanedTranscript": transcript_data["text"],
                        "topics": kb_data.get("topics", []),
                        "concepts": kb_data.get("concepts", []),
                        "keyFacts": kb_data.get("key_facts", []),
                        "relationships": kb_data.get("relationships", []),
                        "learningObjectives": kb_data.get("learning_objectives", []),
                        "chapters": chapters,
                    },
                },
            )

        log_summary(session_id)
        logger.info(f"[{session_id}] YouTube Knowledge Base pipeline complete ✓")

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