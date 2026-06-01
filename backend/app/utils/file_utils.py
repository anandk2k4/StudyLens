"""
Safe file handling: sanitise filenames, validate MIME type,
enforce size limits, generate UUID-based storage paths, cleanup.
"""
import os
import uuid
import shutil
import mimetypes
from pathlib import Path
from typing import Tuple

from app.core.config import settings
from app.core.errors import UploadError
from app.core.logging import logger

ALLOWED_VIDEO_MIMES = {
    "video/mp4", "video/mpeg", "video/quicktime",
    "video/x-msvideo", "video/webm", "video/ogg",
    "video/x-matroska",
}

ALLOWED_EXTENSIONS = {".mp4", ".mpeg", ".mpg", ".mov", ".avi", ".webm", ".ogg", ".mkv"}


def validate_video_file(filename: str, content_type: str, size: int) -> None:
    """Raise UploadError if the file fails any safety check."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise UploadError(f"File type '{ext}' is not supported. Use MP4, MOV, WebM, etc.")

    # Browsers sometimes send "application/octet-stream" — fall back to extension check
    if content_type not in ALLOWED_VIDEO_MIMES:
        guessed, _ = mimetypes.guess_type(filename)
        if guessed not in ALLOWED_VIDEO_MIMES:
            raise UploadError(f"MIME type '{content_type}' is not a recognised video format.")

    if size > settings.max_upload_bytes:
        limit_mb = settings.max_upload_mb
        raise UploadError(f"File exceeds the {limit_mb} MB limit.")


def safe_filename(original: str) -> Tuple[str, str]:
    """
    Return (video_id, safe_path) where safe_path is UUID-based —
    the original filename is never used as a filesystem path.
    """
    ext = Path(original).suffix.lower() or ".mp4"
    video_id = uuid.uuid4().hex
    safe_name = f"{video_id}{ext}"
    dest = os.path.join(settings.upload_dir, safe_name)
    return video_id, dest


def ensure_upload_dir() -> None:
    os.makedirs(settings.upload_dir, exist_ok=True)


def cleanup_files(*paths: str) -> None:
    """Best-effort deletion — logs but never raises."""
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
                logger.info(f"Cleaned up: {path}")
        except Exception as exc:
            logger.warning(f"Could not delete {path}: {exc}")