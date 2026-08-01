"""
app/core/config.py — extended for Phase 5 (background worker needs to call Next.js).
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_env: str = "development"
    secret_key: str = "dev-secret-change-me"
    port: int = 8000

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_timeout: int = 120

    # Whisper (faster-whisper model name — same values as openai-whisper)
    whisper_model: str = "small"

    # Storage
    upload_dir: str = "uploads"
    max_upload_mb: int = 500

    # ChromaDB
    chroma_db_path: str = "./chroma_db"

    # CORS
    allowed_origins: str = "http://localhost:3000"

    # FFmpeg
    ffmpeg_bin_path: str = ""

    # Gemini 2.5 Flash
    gemini_api_key: str = ""

    # ── Phase 5: inter-service communication ──────────────────────────────────
    # URL of the Next.js frontend (background worker posts status updates here)
    nextjs_base_url: str = "http://localhost:3000"

    # Shared secret used by the Python backend to authenticate internal
    # status-update calls to the Next.js API routes.
    # Set this to any long random string in your .env — must match
    # SERVICE_TOKEN in the Next.js environment.
    service_token: str = "change-me-in-production"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

print("Current working directory:", Path.cwd())
print("Config env file:", Path(".env").resolve())
print("Gemini key:", Settings().gemini_api_key)