"""
app/core/status.py
Phase 4 — Detailed processing stages.
Single source of truth for all status values used across backend + frontend.
"""
from enum import Enum


class ProcessingStatus(str, Enum):
    # Pre-processing
    PROCESSING              = "PROCESSING"               # generic fallback
    DOWNLOADING             = "DOWNLOADING"              # yt-dlp downloading
    EXTRACTING_AUDIO        = "EXTRACTING_AUDIO"         # ffmpeg
    TRANSCRIBING            = "TRANSCRIBING"             # whisper
    BUILDING_KNOWLEDGE_BASE = "BUILDING_KNOWLEDGE_BASE"  # semantic chunking & extraction
    KNOWLEDGE_BASE_READY    = "KNOWLEDGE_BASE_READY"     # KB constructed
    GENERATING_EMBEDDINGS   = "GENERATING_EMBEDDINGS"    # vector embeddings
    GENERATING_FEATURES     = "GENERATING_FEATURES"      # parallel feature generation

    # AI generation (parallel backward-compat)
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
            "PROCESSING":              "Processing…",
            "DOWNLOADING":             "Downloading video…",
            "EXTRACTING_AUDIO":        "Extracting audio…",
            "TRANSCRIBING":            "Transcribing audio…",
            "BUILDING_KNOWLEDGE_BASE": "Building Knowledge Base…",
            "KNOWLEDGE_BASE_READY":    "Knowledge Base ready…",
            "GENERATING_EMBEDDINGS":   "Building search index…",
            "GENERATING_FEATURES":     "Generating study materials…",
            "GENERATING_SUMMARY":      "Generating summary…",
            "GENERATING_NOTES":        "Generating notes…",
            "GENERATING_QUIZ":         "Generating quiz…",
            "GENERATING_FLASHCARDS":   "Generating flashcards…",
            "READY":                   "Ready",
            "ERROR":                   "Failed",
        }.get(self.value, self.value)