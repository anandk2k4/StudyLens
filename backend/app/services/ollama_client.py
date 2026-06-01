"""
Thin wrapper around the Ollama Python client.
- Single model reference from settings (never hardcoded in services)
- Timeout enforcement
- Friendly error on connection failure
"""
import httpx
import ollama

from app.core.config import settings
from app.core.errors import OllamaUnavailableError, GenerationError
from app.core.logging import logger


def chat(prompt: str, num_predict: int = 512, temperature: float = 0.1) -> str:
    """
    Send a single-turn prompt to Ollama and return the text response.
    Raises OllamaUnavailableError if Ollama is down.
    Raises GenerationError on any other failure.
    """
    try:
        response = ollama.chat(
            model=settings.ollama_model,
            messages=[{"role": "user", "content": prompt}],
            options={
                "temperature": temperature,
                "num_predict": num_predict,
            },
        )
        content: str = response["message"]["content"]
        logger.debug(f"Ollama responded ({len(content)} chars)")
        return content

    except (ConnectionRefusedError, httpx.ConnectError, Exception) as exc:
        msg = str(exc).lower()
        if "connection" in msg or "refused" in msg or "connect" in msg:
            raise OllamaUnavailableError()
        raise GenerationError(f"Ollama generation failed: {exc}") from exc


def check_ollama_health() -> bool:
    """Return True if Ollama is reachable and the configured model is available."""
    try:
        models = ollama.list()
        available = [m["name"] for m in models.get("models", [])]
        return any(settings.ollama_model in name for name in available)
    except Exception:
        return False