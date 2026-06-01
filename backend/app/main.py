"""
StudyLens AI — production FastAPI application entry point.
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.errors import StudyLensError, studylens_exception_handler, generic_exception_handler
from app.core.logging import logger
from app.api import upload, qa, search, health, youtube


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown logic."""
    os.makedirs(settings.upload_dir, exist_ok=True)
    logger.info(f"StudyLens AI starting — env={settings.app_env}, model={settings.ollama_model}")
    yield
    logger.info("StudyLens AI shutting down")


app = FastAPI(
    title="StudyLens AI",
    description="AI-powered video learning platform",
    version="1.0.0",
    lifespan=lifespan,
    # Hide docs in production
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Exception handlers ────────────────────────────────────────────────────────
app.add_exception_handler(StudyLensError, studylens_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload.router)
app.include_router(qa.router)
app.include_router(search.router)
app.include_router(health.router)
app.include_router(youtube.router)

# ── Static files (uploaded videos) ───────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/")
def root():
    return {"message": "StudyLens AI is running", "docs": "/docs"}