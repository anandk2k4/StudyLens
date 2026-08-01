"""
app/services/gemini_tutor_service.py

Replaces the Ollama call in tutor_service.py with Gemini 2.5 Flash.
The RAG retrieval pipeline (query expansion, ChromaDB search, dedup,
adjacent segment merge) is NOT touched — it stays in tutor_service.py
exactly as before. This module only handles the final generation step.

Uses the official google-genai SDK with structured output (response_schema)
so the model is constrained to return valid JSON matching our schema —
no manual JSON extraction/regex needed for the happy path.
"""
import time
from typing import List, Dict, Optional

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.logging import logger


# ── Client — initialized once, reused across all requests ────────────────────

_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured. Set it in backend/.env"
            )
        _client = genai.Client(api_key=settings.gemini_api_key)
        print("Gemini Key:", settings.gemini_api_key)
        print("Length:", len(settings.gemini_api_key))
        logger.info("Gemini client initialized")
    return _client


_MODEL_NAME = "gemini-2.5-flash"
_TIMEOUT_SECONDS = 30


# ── Response schema — constrains Gemini to return exactly this shape ─────────

_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "concept": {
            "type": "STRING",
            "description": "Clear explanation of the concept, written to teach — not summarize.",
        },
        "example": {
            "type": "STRING",
            "description": "A NEW practical example illustrating the concept. Must not copy the lecture verbatim.",
        },
        "analogy": {
            "type": "STRING",
            "description": "A real-world, everyday analogy that makes the concept intuitive. No technical jargon inside the analogy.",
        },
        "key_takeaways": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "3 to 5 concise bullet points summarizing the most important lessons, suitable for quick revision.",
        },
        "practice_question": {
            "type": "STRING",
            "description": "ONE practice question matching the selected difficulty level.",
        },
        "follow_up_questions": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Exactly 3 natural follow-up questions that continue the learning process.",
        },
    },
    "required": [
        "concept", "example", "analogy",
        "key_takeaways", "practice_question", "follow_up_questions",
    ],
}


# ── Difficulty-specific teaching instructions ─────────────────────────────────

_DIFFICULTY_RULES = {
    "beginner": (
        "Assume ZERO prior knowledge. Explain every technical term the moment "
        "you use it. Use very simple language and short sentences. Lean heavily "
        "on the analogy to make the concept click."
    ),
    "intermediate": (
        "Assume basic familiarity with the topic. Include moderate technical "
        "detail. Balance explanation with appropriate terminology — don't "
        "over-simplify, but don't assume expert knowledge either."
    ),
    "advanced": (
        "Use professional, precise terminology without over-explaining basics. "
        "Focus on deeper understanding, trade-offs, and edge cases. Keep "
        "analogies brief or omit them if they don't add real value."
    ),
}

_VALID_DIFFICULTIES = set(_DIFFICULTY_RULES.keys())


# ── System instruction ─────────────────────────────────────────────────────────

_SYSTEM_INSTRUCTION = """You are StudyLens AI Tutor — an expert teacher whose job is to teach students using ONLY the provided lecture context.

Never answer using outside knowledge. If information is missing from the lecture, clearly state within your explanation that the lecture does not cover it — do not invent or supplement with knowledge from outside the provided context.

Your goal is to TEACH, not summarize. Never repeat the transcript verbatim.

Instead:
- explain the concept in your own words
- simplify where appropriate for the difficulty level
- teach as a patient, encouraging instructor would
- create NEW examples (do not copy examples from the lecture)
- use everyday analogies free of technical jargon
- encourage the learner to think, not just receive information

For programming topics, the example should be a code snippet.
For trading/finance topics, the example should be a market scenario.
For math topics, the example should be a solved problem.
For science topics, the example should be an experiment or observation.
For business topics, the example should be a case study.

Return your response as JSON matching the provided schema. Do not include markdown formatting, code fences, or any text outside the JSON structure."""


# ── Prompt builder ─────────────────────────────────────────────────────────────

def _build_prompt(context: str, question: str, difficulty: str) -> str:
    difficulty_rule = _DIFFICULTY_RULES[difficulty]
    return f"""LECTURE CONTEXT (the only source of truth — do not use outside knowledge):
{context}

DIFFICULTY LEVEL: {difficulty}
TEACHING RULE FOR THIS LEVEL: {difficulty_rule}

STUDENT'S QUESTION: {question}

Teach this concept to the student following all system instructions. Produce the concept explanation, a new example, an analogy, 3-5 key takeaways, one practice question, and exactly 3 follow-up questions."""


# ── Fallback response ──────────────────────────────────────────────────────────

def _fallback_response(difficulty: str, message: str) -> Dict:
    return {
        "concept":             message,
        "example":             "",
        "analogy":             "",
        "key_takeaways":       [],
        "practice_question":   "",
        "difficulty":          difficulty,
        "follow_up_questions": [],
    }


def _validate_response(data: dict) -> bool:
    required = ["concept", "example", "analogy", "key_takeaways", "practice_question", "follow_up_questions"]
    if not all(k in data for k in required):
        return False
    if not isinstance(data["key_takeaways"], list) or not isinstance(data["follow_up_questions"], list):
        return False
    if not isinstance(data["concept"], str) or len(data["concept"].strip()) == 0:
        return False
    return True


def _normalize_response(data: dict, difficulty: str) -> Dict:
    takeaways = [str(t).strip() for t in data["key_takeaways"] if str(t).strip()][:5]
    follow_ups = [str(q).strip() for q in data["follow_up_questions"] if str(q).strip()][:3]

    return {
        "concept":             str(data["concept"]).strip(),
        "example":             str(data.get("example", "")).strip(),
        "analogy":             str(data.get("analogy", "")).strip(),
        "key_takeaways":       takeaways,
        "practice_question":   str(data.get("practice_question", "")).strip(),
        "difficulty":          difficulty,
        "follow_up_questions": follow_ups,
    }


# ── Public entry point ────────────────────────────────────────────────────────

def generate_gemini_tutor_response(
    context:    str,
    question:   str,
    difficulty: str = "beginner",
) -> Dict:
    """
    Generate a structured tutor response using Gemini 2.5 Flash.

    This function receives the ALREADY-RETRIEVED lecture context from
    tutor_service.py's RAG pipeline — it does not perform any retrieval
    itself. It only handles prompt construction, the Gemini API call,
    JSON validation, and fallback handling.

    Args:
        context:    Retrieved + merged + deduplicated lecture segments,
                     joined into a single string by tutor_service.py.
        question:   The student's question.
        difficulty: "beginner" | "intermediate" | "advanced"

    Returns:
        dict matching the TutorResponse schema, or a safe fallback
        if Gemini fails after retry.
    """
    difficulty = difficulty if difficulty in _VALID_DIFFICULTIES else "beginner"

    if not context or not context.strip():
        return _fallback_response(difficulty, "No relevant content found in this video.")

    try:
        client = _get_client()
    except RuntimeError as e:
        logger.error(str(e))
        return _fallback_response(difficulty, "Tutor service is not configured correctly.")

    prompt = _build_prompt(context, question, difficulty)

    config = types.GenerateContentConfig(
        system_instruction=_SYSTEM_INSTRUCTION,
        temperature=0.4,
        response_mime_type="application/json",
        response_schema=_RESPONSE_SCHEMA,
    )

    # ── Attempt 1 ──────────────────────────────────────────────────────────────
    start = time.perf_counter()
    try:
        response = client.models.generate_content(
            model=_MODEL_NAME,
            contents=prompt,
            config=config,
        )
        elapsed = time.perf_counter() - start
        logger.info(f"[Gemini Tutor] Response in {elapsed:.2f}s (attempt 1)")

        import json
        data = json.loads(response.text)

        if _validate_response(data):
            return _normalize_response(data, difficulty)

        logger.warning("[Gemini Tutor] Attempt 1 produced incomplete JSON, retrying")

    except Exception as e:
        elapsed = time.perf_counter() - start
        logger.error(f"[Gemini Tutor] Attempt 1 failed after {elapsed:.2f}s: {e}")

    # ── Attempt 2 — explicit retry instruction ────────────────────────────────
    start = time.perf_counter()
    try:
        retry_prompt = prompt + "\n\nIMPORTANT: Return valid JSON only, matching the exact schema provided."
        response = client.models.generate_content(
            model=_MODEL_NAME,
            contents=retry_prompt,
            config=config,
        )
        elapsed = time.perf_counter() - start
        logger.info(f"[Gemini Tutor] Response in {elapsed:.2f}s (attempt 2 - retry)")

        import json
        data = json.loads(response.text)

        if _validate_response(data):
            return _normalize_response(data, difficulty)

        logger.warning("[Gemini Tutor] Attempt 2 also produced incomplete JSON")

    except Exception as e:
        elapsed = time.perf_counter() - start
        logger.error(f"[Gemini Tutor] Attempt 2 failed after {elapsed:.2f}s: {e}")

    # ── Both attempts failed — safe fallback, never crash ─────────────────────
    return _fallback_response(
        difficulty,
        "I had trouble generating a complete answer. Please try rephrasing your question."
    )