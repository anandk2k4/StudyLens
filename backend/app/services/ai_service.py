"""
app/services/ai_service.py

Unified AI Service Abstraction for StudyLens AI.
Provides clean interfaces for:
- Text generation (default Ollama, with fallback)
- Structured JSON output (default Gemini 2.5 Flash, with fallback)
- Retriable generation with validation parsers
"""
from typing import Dict, Any, Optional, Callable, List
import json
import time

from app.core.config import settings
from app.core.logging import logger
from app.services.ollama_client import chat as ollama_chat
from app.services.gemini_tutor_service import _get_client as get_gemini_client


class AIService:
    """Unified AI service wrapper that eliminates provider-specific logic in domain features."""

    @staticmethod
    def generate_text(
        prompt: str,
        num_predict: int = 400,
        temperature: float = 0.1,
    ) -> str:
        """Generate unstructured text via Ollama."""
        try:
            return ollama_chat(
                prompt=prompt,
                num_predict=num_predict,
                temperature=temperature,
            )
        except Exception as e:
            logger.error(f"[AIService] Text generation failed: {e}")
            raise

    @staticmethod
    def generate_structured_gemini(
        prompt: str,
        system_instruction: str,
        response_schema: Dict[str, Any],
        model_name: str = "gemini-2.5-flash",
        temperature: float = 0.2,
        max_retries: int = 2,
    ) -> Optional[Dict[str, Any]]:
        """
        Generate structured JSON output using Gemini with schema enforcement.
        Returns parsed dictionary or None on failure.
        """
        from google.genai import types

        try:
            client = get_gemini_client()
        except Exception as exc:
            logger.warning(f"[AIService] Gemini client unavailable: {exc}")
            return None

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            response_mime_type="application/json",
            response_schema=response_schema,
        )

        for attempt in range(max_retries):
            start = time.perf_counter()
            try:
                curr_prompt = prompt if attempt == 0 else f"{prompt}\n\nIMPORTANT: Return valid JSON matching schema."
                response = client.models.generate_content(
                    model=model_name,
                    contents=curr_prompt,
                    config=config,
                )
                elapsed = time.perf_counter() - start
                logger.info(f"[AIService] Gemini response in {elapsed:.2f}s (attempt {attempt + 1})")
                return json.loads(response.text)
            except Exception as e:
                elapsed = time.perf_counter() - start
                logger.warning(f"[AIService] Gemini attempt {attempt + 1} failed ({elapsed:.2f}s): {e}")

        return None

    @staticmethod
    def generate_with_retry(
        prompt: str,
        parser_fn: Callable[[str], Any],
        validator_fn: Optional[Callable[[Any], bool]] = None,
        budgets: Optional[List[int]] = None,
        max_retries: int = 3,
        temperature: float = 0.1,
    ) -> Any:
        """
        Generate text and parse it into structured data using a parser function.
        Retries with increasing token budgets.
        """
        if budgets is None:
            budgets = [500, 750, 950]

        best_result = None

        for attempt in range(max_retries):
            budget = budgets[min(attempt, len(budgets) - 1)]
            try:
                raw = ollama_chat(prompt=prompt, num_predict=budget, temperature=temperature)
                parsed = parser_fn(raw)

                if validator_fn:
                    if validator_fn(parsed):
                        return parsed
                elif parsed:
                    return parsed

                best_result = parsed
            except Exception as exc:
                logger.warning(f"[AIService] Attempt {attempt + 1} error: {exc}")

        return best_result
