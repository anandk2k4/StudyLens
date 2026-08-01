"""
app/services/revision_service.py

AI Revision Mode — generates a complete exam-focused revision package
using the existing Gemini client from gemini_tutor_service.py.

Key design decisions:
- Reuses already-generated data (summary, notes, chapters, quiz, flashcards)
  to reduce token usage — no full transcript re-summarization
- Single Gemini call produces all 8 revision sections in one structured JSON
- Result persisted to DB on first generation; subsequent loads come from DB
- Never uses Ollama — Gemini 2.5 Flash only (matches Tutor Mode)
"""
import json
import time
from typing import Optional, Dict, List, Any

from app.services.gemini_tutor_service import _get_client
from app.core.logging import logger


_MODEL_NAME = "gemini-2.5-flash"


# ── Response schema ────────────────────────────────────────────────────────────

_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "quick_revision": {
            "type": "STRING",
            "description": "A 1-minute recap of the most critical points only. 3-5 sentences max. Exam-focused."
        },
        "detailed_revision": {
            "type": "STRING",
            "description": "A structured 5-minute revision covering all major topics. Use ### for section headings, - for bullets, **bold** for key terms. This will be rendered as formatted text."
        },
        "cheat_sheet": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "5-10 highest-value bullet points. Each under 15 words. Perfect for last-minute review."
        },
        "key_concepts": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "concept": {"type": "STRING"},
                    "definition": {"type": "STRING"}
                },
                "required": ["concept", "definition"]
            },
            "description": "4-8 key concepts the student must remember. Each with a short definition."
        },
        "common_mistakes": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "3-6 common mistakes beginners make related to this lecture's content."
        },
        "memory_tricks": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "trick": {"type": "STRING"},
                    "explanation": {"type": "STRING"}
                },
                "required": ["trick", "explanation"]
            },
            "description": "2-4 mnemonics, acronyms, or memory patterns to help recall key points."
        },
        "exam_questions": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "question": {"type": "STRING"},
                    "hint": {"type": "STRING"}
                },
                "required": ["question", "hint"]
            },
            "description": "5-8 likely exam or interview questions based on the lecture. Each with a short hint."
        },
        "final_checklist": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "6-10 checklist items. Each starts with an action verb. Student checks these before finishing."
        }
    },
    "required": [
        "quick_revision", "detailed_revision", "cheat_sheet",
        "key_concepts", "common_mistakes", "memory_tricks",
        "exam_questions", "final_checklist"
    ]
}


# ── System instruction ─────────────────────────────────────────────────────────

_SYSTEM_INSTRUCTION = """You are an expert exam revision coach for StudyLens AI.

Your job is to help students revise a lecture BEFORE an exam or interview.

CRITICAL RULES:
- Use ONLY the provided lecture content — never hallucinate or introduce outside concepts
- Be concise and exam-focused — students are revising, not learning for the first time
- Every point must come directly from the provided lecture material
- If the lecture doesn't cover something, don't include it
- Write like a revision coach, not a teacher — short, punchy, memorable
- Focus on what will actually be tested

Your output should make a student feel confident and prepared."""


# ── Prompt builder ─────────────────────────────────────────────────────────────

def _build_revision_prompt(
    title:      str,
    summary:    Optional[str],
    notes:      Optional[str],
    chapters:   Optional[List],
    quiz:       Optional[List],
    flashcards: Optional[List],
    difficulty: str = "intermediate",
) -> str:
    sections = [f"LECTURE TITLE: {title}\n"]

    if summary:
        sections.append(f"SUMMARY:\n{summary}\n")

    if notes:
        sections.append(f"NOTES:\n{notes}\n")

    if chapters and len(chapters) > 0:
        chapter_text = "\n".join(
            f"- {c.get('title', '')}: {c.get('summary', '')}"
            for c in chapters[:10]
        )
        sections.append(f"CHAPTERS:\n{chapter_text}\n")

    if quiz and len(quiz) > 0:
        quiz_text = "\n".join(
            f"Q: {q.get('question', '')} | A: {q.get('answer', '')}"
            for q in quiz[:5]
        )
        sections.append(f"EXISTING QUIZ QUESTIONS:\n{quiz_text}\n")

    if flashcards and len(flashcards) > 0:
        fc_text = "\n".join(
            f"- {f.get('front', '')} → {f.get('back', '')}"
            for f in flashcards[:8]
        )
        sections.append(f"FLASHCARDS:\n{fc_text}\n")

    content = "\n".join(sections)

    return f"""Based on this lecture content, generate a complete revision package.

{content}

DIFFICULTY LEVEL: {difficulty}

Generate all 8 revision sections. Be concise, exam-focused, and only use information present in the lecture content above.
Return valid JSON only — no markdown, no extra text."""


# ── Validation ─────────────────────────────────────────────────────────────────

def _validate(data: dict) -> bool:
    required = [
        "quick_revision", "detailed_revision", "cheat_sheet",
        "key_concepts", "common_mistakes", "memory_tricks",
        "exam_questions", "final_checklist"
    ]
    return all(k in data for k in required)


def _normalize(data: dict) -> dict:
    """Ensure all list fields are actually lists and strings are strings."""
    return {
        "quick_revision":   str(data.get("quick_revision", "")).strip(),
        "detailed_revision":str(data.get("detailed_revision", "")).strip(),
        "cheat_sheet":      [str(i).strip() for i in data.get("cheat_sheet", [])],
        "key_concepts":     [
            {"concept": str(k.get("concept","")).strip(), "definition": str(k.get("definition","")).strip()}
            for k in data.get("key_concepts", []) if isinstance(k, dict)
        ],
        "common_mistakes":  [str(i).strip() for i in data.get("common_mistakes", [])],
        "memory_tricks":    [
            {"trick": str(m.get("trick","")).strip(), "explanation": str(m.get("explanation","")).strip()}
            for m in data.get("memory_tricks", []) if isinstance(m, dict)
        ],
        "exam_questions":   [
            {"question": str(q.get("question","")).strip(), "hint": str(q.get("hint","")).strip()}
            for q in data.get("exam_questions", []) if isinstance(q, dict)
        ],
        "final_checklist":  [str(i).strip() for i in data.get("final_checklist", [])],
    }


def _fallback() -> dict:
    return {
        "quick_revision":    "Could not generate revision content. Please try again.",
        "detailed_revision": "",
        "cheat_sheet":       [],
        "key_concepts":      [],
        "common_mistakes":   [],
        "memory_tricks":     [],
        "exam_questions":    [],
        "final_checklist":   [],
    }


# ── Public entry point ────────────────────────────────────────────────────────

def generate_revision(
    title:      str,
    summary:    Optional[str] = None,
    notes:      Optional[str] = None,
    chapters:   Optional[List] = None,
    quiz:       Optional[List] = None,
    flashcards: Optional[List] = None,
    difficulty: str = "intermediate",
) -> dict:
    """
    Generate a complete revision package using existing session data.
    Reuses summary/notes/chapters/quiz/flashcards — no transcript re-processing.
    """
    from google.genai import types

    logger.info(f"Generating revision for: {title}")

    try:
        client = _get_client()
    except RuntimeError as e:
        logger.error(str(e))
        return _fallback()

    prompt = _build_revision_prompt(title, summary, notes, chapters, quiz, flashcards, difficulty)

    config = types.GenerateContentConfig(
        system_instruction=_SYSTEM_INSTRUCTION,
        temperature=0.3,
        response_mime_type="application/json",
        response_schema=_RESPONSE_SCHEMA,
    )

    for attempt in range(2):
        start = time.perf_counter()
        try:
            response = client.models.generate_content(
                model=_MODEL_NAME,
                contents=prompt,
                config=config,
            )
            elapsed = time.perf_counter() - start
            logger.info(f"[Revision] Gemini response in {elapsed:.2f}s (attempt {attempt + 1})")

            data = json.loads(response.text)
            if _validate(data):
                logger.info(f"[Revision] Generated successfully")
                return _normalize(data)

            logger.warning(f"[Revision] Attempt {attempt + 1}: incomplete JSON")

        except Exception as e:
            elapsed = time.perf_counter() - start
            logger.error(f"[Revision] Attempt {attempt + 1} failed after {elapsed:.2f}s: {e}")

    return _fallback()