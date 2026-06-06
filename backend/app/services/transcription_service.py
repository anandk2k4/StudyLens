"""
app/services/transcription_service.py
faster-whisper with int8 quantization — 4-8x faster than openai-whisper on CPU.

Install:
    pip install faster-whisper
    pip uninstall openai-whisper   (removes the slow version)
"""
import os
from typing import Dict, List, Any

from faster_whisper import WhisperModel
from app.core.config import settings
from app.core.errors import TranscriptionError
from app.core.logging import logger

# ── Config from .env ──────────────────────────────────────────────────────────
# WHISPER_DEVICE=cpu       (Windows without CUDA — always use cpu)
# WHISPER_COMPUTE_TYPE=int8  (fastest on CPU)
# WHISPER_MODEL=small        (good balance of speed vs quality)

_DEVICE       = os.getenv("WHISPER_DEVICE",       "cpu")
_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

logger.info(
    f"Loading faster-whisper | model={settings.whisper_model} "
    f"device={_DEVICE} compute_type={_COMPUTE_TYPE}"
)

_model = WhisperModel(
    settings.whisper_model,
    device=_DEVICE,
    compute_type=_COMPUTE_TYPE,
    cpu_threads=os.cpu_count() or 4,    # use all available CPU cores
    num_workers=1,
)

logger.info("faster-whisper ready")


def transcribe_audio(audio_path: str) -> Dict[str, Any]:
    """
    Transcribe audio with faster-whisper.
    Same output contract as before: { "text": str, "segments": [...] }
    """
    try:
        logger.info(f"Transcribing: {audio_path}")

        segments_iter, info = _model.transcribe(
            audio_path,
            beam_size=1,          # ← reduced from 5 — much faster, minimal quality loss
            best_of=1,            # ← no sampling — deterministic and faster
            vad_filter=True,      # ← skip silence automatically — big win for YouTube
            vad_parameters=dict(
                min_silence_duration_ms=300,
                threshold=0.5,
            ),
            condition_on_previous_text=False,  # ← prevents repetition loops on CPU
            language="en",        # ← remove this line if you need auto-detection
        )

        logger.info(
            f"Language: {info.language} "
            f"(prob={info.language_probability:.2f}) "
            f"duration={info.duration:.1f}s"
        )

        segments: List[Dict] = []
        full_parts: List[str] = []

        for seg in segments_iter:
            text = seg.text.strip()
            if not text:
                continue
            segments.append({
                "text":  text,
                "start": round(seg.start, 2),
                "end":   round(seg.end,   2),
            })
            full_parts.append(text)

        logger.info(f"Transcription complete: {len(segments)} segments")
        return {"text": " ".join(full_parts), "segments": segments}

    except Exception as exc:
        logger.error(f"Transcription failed: {exc}")
        raise TranscriptionError(f"Transcription failed: {exc}") from exc