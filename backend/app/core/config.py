"""
Central configuration — reads from environment / .env file.
All other modules import settings from here; nothing is hardcoded anywhere else.
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_env: str = "development"
    secret_key: str = "dev-secret-change-me"

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_timeout: int = 120

    # Whisper
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