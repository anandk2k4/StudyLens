"""
YouTube download service — production grade.

Fixes vs original:
- Path comes from settings (never hardcoded)
- UUID-based filename (title is NEVER used as a filesystem path)
- Structured error handling with custom exceptions
- Progress hook for logging
- Metadata returned alongside the path
- yt-dlp options hardened for reliability
"""
import os
import uuid
from typing import TypedDict

import yt_dlp

from app.core.config import settings
from app.core.logging import logger
from app.core.errors import UploadError


class YouTubeInfo(TypedDict):
    video_id: str        # internal UUID (not the YouTube ID)
    file_path: str       # absolute path to downloaded .mp4
    title: str           # original YouTube title (for display only)
    duration: int        # seconds
    youtube_id: str      # YouTube's own video ID


# ── yt-dlp options ────────────────────────────────────────────────────────────

def _build_opts(output_path: str) -> dict:
    return {
        # Best mp4-compatible video+audio, fallback to best single file
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
        "merge_output_format": "mp4",

        # Use our UUID-based path — title never touches the filesystem
        "outtmpl": output_path,

        # Reliability options
        "noplaylist": True,          # never accidentally download a whole playlist
        "quiet": True,
        "no_warnings": False,
        "socket_timeout": 30,
        "retries": 3,
        "fragment_retries": 3,

        # Use android client — more reliable for age-restricted / recent videos
        "extractor_args": {
            "youtube": {"player_client": ["android", "web"]}
        },

        # Progress logging
        "progress_hooks": [_progress_hook],
    }


def _progress_hook(d: dict) -> None:
    if d["status"] == "downloading":
        total = d.get("total_bytes") or d.get("total_bytes_estimate", 0)
        downloaded = d.get("downloaded_bytes", 0)
        if total:
            pct = downloaded / total * 100
            logger.debug(f"Downloading: {pct:.1f}%")
    elif d["status"] == "finished":
        logger.info(f"Download finished: {d.get('filename', '')}")
    elif d["status"] == "error":
        logger.error(f"yt-dlp error hook: {d}")


# ── Validation ────────────────────────────────────────────────────────────────

def _validate_url(url: str) -> None:
    """Basic check before hitting yt-dlp."""
    url = url.strip()
    if not url:
        raise UploadError("YouTube URL cannot be empty.")
    if not (url.startswith("https://") or url.startswith("http://")):
        raise UploadError("Invalid URL — must start with http:// or https://")
    if "youtube.com" not in url and "youtu.be" not in url:
        raise UploadError("Only YouTube URLs are supported.")


def _validate_metadata(info: dict) -> None:
    """Reject live streams and excessively long videos."""
    if info.get("is_live"):
        raise UploadError("Live streams cannot be downloaded.")

    duration = info.get("duration", 0) or 0
    max_duration = 3 * 60 * 60  # 3 hours
    if duration > max_duration:
        raise UploadError(
            f"Video is {duration // 60} minutes long. "
            f"Maximum allowed is {max_duration // 60} minutes."
        )


# ── Public entry point ────────────────────────────────────────────────────────

def download_youtube_video(url: str) -> YouTubeInfo:
    """
    Download a YouTube video and return metadata + local file path.

    Raises UploadError for any user-facing problem
    (invalid URL, live stream, too long, private video, etc.)
    """
    _validate_url(url)
    os.makedirs(settings.upload_dir, exist_ok=True)

    # UUID-based filename — YouTube title never used as filesystem path
    internal_id = uuid.uuid4().hex
    output_path = os.path.join(settings.upload_dir, f"{internal_id}.mp4")
    opts = _build_opts(output_path)

    logger.info(f"Starting YouTube download: {url}")

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)

        if not info:
            raise UploadError("Could not retrieve video information. Check the URL.")

        _validate_metadata(info)

        # Confirm file actually exists after download
        if not os.path.exists(output_path):
            # yt-dlp sometimes adjusts the extension — check for that
            alt = output_path.replace(".mp4", ".mkv")
            if os.path.exists(alt):
                os.rename(alt, output_path)
            else:
                raise UploadError("Download appeared to succeed but no file was created.")

        file_size = os.path.getsize(output_path)
        logger.info(f"YouTube download complete: {output_path} ({file_size // 1024} KB)")

        return YouTubeInfo(
            video_id=internal_id,
            file_path=output_path,
            title=info.get("title", "Untitled"),
            duration=int(info.get("duration", 0) or 0),
            youtube_id=info.get("id", ""),
        )

    except UploadError:
        raise  # already formatted, pass through

    except yt_dlp.utils.DownloadError as exc:
        msg = str(exc)
        # Translate common yt-dlp errors into friendly messages
        if "Private video" in msg:
            raise UploadError("This video is private and cannot be downloaded.")
        if "This video is unavailable" in msg:
            raise UploadError("This video is unavailable in your region or has been removed.")
        if "Sign in" in msg or "age" in msg.lower():
            raise UploadError("This video requires age verification and cannot be accessed.")
        if "copyright" in msg.lower():
            raise UploadError("This video has been blocked due to a copyright claim.")
        raise UploadError(f"Download failed: {msg[:200]}")

    except Exception as exc:
        logger.error(f"Unexpected YouTube download error: {exc}", exc_info=True)
        raise UploadError(f"An unexpected error occurred during download: {str(exc)[:200]}")