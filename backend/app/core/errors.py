"""
Centralised exception types + FastAPI exception handlers.
Every pipeline stage raises one of these; the handler converts it to
a clean JSON response the frontend can display.
"""
from fastapi import Request
from fastapi.responses import JSONResponse


class StudyLensError(Exception):
    """Base for all application errors."""
    status_code: int = 500
    stage: str = "unknown"

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class UploadError(StudyLensError):
    status_code = 400
    stage = "upload"


class AudioExtractionError(StudyLensError):
    status_code = 422
    stage = "audio_extraction"


class TranscriptionError(StudyLensError):
    status_code = 422
    stage = "transcription"


class EmbeddingError(StudyLensError):
    status_code = 500
    stage = "embedding"


class GenerationError(StudyLensError):
    status_code = 500
    stage = "generation"


class OllamaUnavailableError(StudyLensError):
    status_code = 503
    stage = "ollama"

    def __init__(self):
        super().__init__(
            "Ollama is not running or the model is not pulled. "
            "Start Ollama and run: ollama pull llama3.1:8b"
        )


# ── FastAPI handlers ──────────────────────────────────────────────────────────

async def studylens_exception_handler(request: Request, exc: StudyLensError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "stage": exc.stage,
            "message": exc.message,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "stage": "internal",
            "message": "An unexpected error occurred. Check server logs.",
        },
    )