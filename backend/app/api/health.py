"""
Health-check endpoint — lets the frontend (and monitoring tools) verify
that Ollama is up and the correct model is loaded before the user uploads.
"""
from fastapi import APIRouter
from app.schemas.video import HealthResponse
from app.services.ollama_client import check_ollama_health
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/", response_model=HealthResponse)
async def health_check():
    ollama_ok = check_ollama_health()
    return HealthResponse(
        status="ok" if ollama_ok else "degraded",
        ollama=ollama_ok,
        model=settings.ollama_model,
        whisper=settings.whisper_model,
    )