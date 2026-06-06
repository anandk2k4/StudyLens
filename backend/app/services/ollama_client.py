"""
app/services/ollama_client.py
Optimized for CPU usage — reduced token limits and lower temperature
cuts generation time significantly without quality loss.
"""
import httpx
import ollama

from app.core.config import settings
from app.core.errors import OllamaUnavailableError, GenerationError
from app.core.logging import logger


def chat(
    prompt:      str,
    num_predict: int   = 400,
    temperature: float = 0.1,
) -> str:
    try:
        response = ollama.chat(
            model=settings.ollama_model,
            messages=[{"role": "user", "content": prompt}],
            options={
                "temperature":  temperature,
                "num_predict":  num_predict,
                "num_ctx":      4096,    # ← limit context window — faster on CPU
                "repeat_penalty": 1.1,   # ← reduce repetition without extra tokens
            },
        )
        content: str = response["message"]["content"]
        logger.debug(f"Ollama responded ({len(content)} chars)")
        return content

    except (ConnectionRefusedError, httpx.ConnectError, Exception) as exc:
        msg = str(exc).lower()
        if any(k in msg for k in ["connection", "refused", "connect"]):
            raise OllamaUnavailableError()
        raise GenerationError(f"Ollama generation failed: {exc}") from exc


def check_ollama_health() -> bool:
    try:
        models = ollama.list()
        available = [m["name"] for m in models.get("models", [])]
        return any(settings.ollama_model in name for name in available)
    except Exception:
        return False