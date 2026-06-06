"""
app/core/status.py
Phase 4 — Detailed processing stages.
Single source of truth for all status values used across backend + frontend.
"""
from enum import Enum


class ProcessingStatus(str, Enum):
    # Pre-processing
    PROCESSING          = "PROCESSING"           # generic fallback
    DOWNLOADING         = "DOWNLOADING"          # yt-dlp downloading
    EXTRACTING_AUDIO    = "EXTRACTING_AUDIO"     # ffmpeg
    TRANSCRIBING        = "TRANSCRIBING"         # whisper
    GENERATING_EMBEDDINGS = "GENERATING_EMBEDDINGS"

    # AI generation (parallel)
    GENERATING_SUMMARY    = "GENERATING_SUMMARY"
    GENERATING_NOTES      = "GENERATING_NOTES"
    GENERATING_QUIZ       = "GENERATING_QUIZ"
    GENERATING_FLASHCARDS = "GENERATING_FLASHCARDS"

    # Terminal states
    READY = "READY"
    ERROR = "ERROR"

    @property
    def label(self) -> str:
        """Human-readable label for frontend display."""
        return {
            "PROCESSING":             "Processing…",
            "DOWNLOADING":            "Downloading video…",
            "EXTRACTING_AUDIO":       "Extracting audio…",
            "TRANSCRIBING":           "Transcribing audio…",
            "GENERATING_EMBEDDINGS":  "Building search index…",
            "GENERATING_SUMMARY":     "Generating summary…",
            "GENERATING_NOTES":       "Generating notes…",
            "GENERATING_QUIZ":        "Generating quiz…",
            "GENERATING_FLASHCARDS":  "Generating flashcards…",
            "READY":                  "Ready",
            "ERROR":                  "Failed",
        }.get(self.value, self.value)