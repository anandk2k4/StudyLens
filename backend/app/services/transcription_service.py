"""
Whisper transcription service.
Model is loaded once at startup (not per-request) from settings.
"""
import whisper

from app.core.config import settings
from app.core.errors import TranscriptionError
from app.core.logging import logger

# ── Load once at import time ──────────────────────────────────────────────────
logger.info(f"Loading Whisper model: {settings.whisper_model}")
_model = whisper.load_model(settings.whisper_model)
logger.info("Whisper model ready")


def transcribe_audio(audio_path: str) -> dict:
    """
    Transcribe audio file and return:
      {
        "text": str,
        "segments": [{"text": str, "start": float, "end": float}, ...]
      }
    Raises TranscriptionError on failure.
    """
    try:
        logger.info(f"Transcribing: {audio_path}")
        result = _model.transcribe(audio_path, fp16=False)

        segments = [
            {
                "text": seg["text"].strip(),
                "start": round(seg["start"], 2),
                "end": round(seg["end"], 2),
            }
            for seg in result.get("segments", [])
            if seg.get("text", "").strip()
        ]

        logger.info(f"Transcription done: {len(segments)} segments")
        return {
            "text": result.get("text", "").strip(),
            "segments": segments,
        }

    except Exception as exc:
        logger.error(f"Transcription failed: {exc}")
        raise TranscriptionError(f"Whisper transcription failed: {exc}") from exc