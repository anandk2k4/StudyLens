"""
Audio extraction: video → MP3 using ffmpeg-python.
FFmpeg binary path is read from settings (works on Windows + Linux/Mac).
"""
import os
import ffmpeg

from app.core.config import settings
from app.core.errors import AudioExtractionError
from app.core.logging import logger


def _configure_ffmpeg() -> None:
    """Add custom FFmpeg bin path to PATH if configured (Windows support)."""
    if settings.ffmpeg_bin_path:
        os.environ["PATH"] = settings.ffmpeg_bin_path + os.pathsep + os.environ.get("PATH", "")


def extract_audio(video_path: str) -> str:
    """
    Extract audio from *video_path* and save as .mp3 alongside the video.
    Returns the path to the generated audio file.
    Raises AudioExtractionError on failure.
    """
    _configure_ffmpeg()

    base = os.path.splitext(video_path)[0]
    audio_path = f"{base}.mp3"

    try:
        logger.info(f"Extracting audio: {video_path} → {audio_path}")
        (
            ffmpeg
            .input(video_path)
            .output(audio_path, format="mp3", audio_bitrate="128k", ac=1)
            .run(overwrite_output=True, quiet=True)
        )
        logger.info("Audio extraction complete")
        return audio_path

    except ffmpeg.Error as exc:
        stderr = exc.stderr.decode() if exc.stderr else str(exc)
        logger.error(f"FFmpeg error: {stderr}")
        raise AudioExtractionError(
            f"Audio extraction failed. Is FFmpeg installed? Detail: {stderr[:200]}"
        ) from exc
    except FileNotFoundError:
        raise AudioExtractionError(
            "FFmpeg not found. Install FFmpeg and ensure it is on PATH "
            "(or set FFMPEG_BIN_PATH in .env)."
        )