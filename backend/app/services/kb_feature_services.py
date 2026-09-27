"""
app/services/kb_feature_services.py

Knowledge Base-driven feature generation services.
Generates Summary, Notes, Quiz, and Flashcards directly from structured Knowledge Base data
instead of redundantly parsing the entire raw transcript.
"""
from typing import Dict, List, Any
import json
import re

from app.core.logging import logger
from app.services.ai_service import AIService
from app.services.summary_service import _clean_summary
from app.services.notes_service import _clean as clean_notes
from app.services.quiz_service import _parse_quiz
from app.services.flashcard_service import _parse_flashcards


# ── 1. Summary from Knowledge Base ─────────────────────────────────────────────
_KB_SUMMARY_PROMPT = """You are an educational assistant writing a study summary from structured knowledge.

KNOWLEDGE BASE:
Topics:
{topics}

Core Concepts & Definitions:
{concepts}

Key Facts:
{key_facts}

Learning Objectives:
{objectives}

OUTPUT FORMAT:
Line 1: One sentence stating what this material teaches. Start directly with the subject (no "In this video" or "This lecture covers").
Then a blank line.
Then 4-6 bullet points, EACH ON ITS OWN LINE, each starting with "- ". Each bullet must state a clear, standalone takeaway based on the concepts and facts above.

SUMMARY:"""


def generate_summary_from_kb(kb_data: Dict[str, Any]) -> str:
    """Generates structured summary from Knowledge Base entities."""
    topics = "\n".join(f"- {t.get('name')}: {', '.join(t.get('subtopics', []))}" for t in kb_data.get("topics", []))
    concepts = "\n".join(f"- {c.get('term')}: {c.get('definition')}" for c in kb_data.get("concepts", [])[:10])
    key_facts = "\n".join(f"- {f.get('fact')}" for f in kb_data.get("key_facts", [])[:8])
    objectives = "\n".join(f"- {obj}" for obj in kb_data.get("learning_objectives", []))

    prompt = _KB_SUMMARY_PROMPT.format(
        topics=topics or "General overview",
        concepts=concepts or "Key terms",
        key_facts=key_facts or "Important details",
        objectives=objectives or "Study goals",
    )

    try:
        raw = AIService.generate_text(prompt, num_predict=400, temperature=0.15)
        return _clean_summary(raw)
    except Exception as exc:
        logger.warning(f"[KBFeatures] Summary from KB failed: {exc}")
        # Construct deterministic fallback from concepts
        items = [f"- {c.get('term')}: {c.get('definition')}" for c in kb_data.get("concepts", [])[:5]]
        return "Core concepts summary:\n\n" + "\n".join(items)


# ── 2. Notes from Knowledge Base ───────────────────────────────────────────────
_KB_NOTES_PROMPT = """You are an expert study note generator. Write concise, scannable study notes based on this structured knowledge.

STRUCTURED KNOWLEDGE:
Topics:
{topics}

Concepts & Definitions:
{concepts}

Key Facts:
{key_facts}

RULES:
- Start directly with the first bullet point: • <point>
- Group ideas by topic
- Each bullet point must be clear, complete, and factual
- No greetings, no intro or concluding remarks

STUDY NOTES:
•"""


def generate_notes_from_kb(kb_data: Dict[str, Any]) -> str:
    """Generates organized study notes using Knowledge Base concepts and facts."""
    topics = "\n".join(f"Topic: {t.get('name')}" for t in kb_data.get("topics", []))
    concepts = "\n".join(f"• {c.get('term')}: {c.get('definition')}" for c in kb_data.get("concepts", []))
    key_facts = "\n".join(f"• {f.get('fact')}" for f in kb_data.get("key_facts", []))

    prompt = _KB_NOTES_PROMPT.format(
        topics=topics,
        concepts=concepts,
        key_facts=key_facts,
    )

    try:
        raw = "• " + AIService.generate_text(prompt, num_predict=600, temperature=0.1)
        return clean_notes(raw)
    except Exception as exc:
        logger.warning(f"[KBFeatures] Notes from KB failed: {exc}")
        return "\n".join([f"• {c.get('term')}: {c.get('definition')}" for c in kb_data.get("concepts", [])])


# ── 3. Quiz from Knowledge Base ────────────────────────────────────────────────
_KB_QUIZ_PROMPT = """You are an educational quiz generator.
Create EXACTLY 4 multiple-choice questions testing understanding of these concepts and learning objectives.

CONCEPTS & FACTS:
{concepts}

LEARNING OBJECTIVES:
{objectives}

RULES:
- Each question must have exactly 4 options labeled A) B) C) D)
- Exactly one correct answer marked with "Answer: <A|B|C|D>"
- Questions must test concept understanding and practical implications
- Do not repeat questions

OUTPUT FORMAT (repeat for each question):
Q: <question text>
A) <option>
B) <option>
C) <option>
D) <option>
Answer: <A|B|C|D>

"""


def generate_quiz_from_kb(kb_data: Dict[str, Any], min_questions: int = 3) -> List[Dict[str, Any]]:
    """Generates MCQs using Knowledge Base concepts and learning objectives."""
    concepts = "\n".join(f"{c.get('term')}: {c.get('definition')}" for c in kb_data.get("concepts", [])[:8])
    objectives = "\n".join(f"- {o}" for o in kb_data.get("learning_objectives", []))

    prompt = _KB_QUIZ_PROMPT.format(concepts=concepts, objectives=objectives)

    def _parse(text: str):
        return _parse_quiz(text)

    def _valid(items: Any):
        return isinstance(items, list) and len(items) >= min_questions

    result = AIService.generate_with_retry(
        prompt=prompt,
        parser_fn=_parse,
        validator_fn=_valid,
        budgets=[650, 850, 1050],
        max_retries=3,
    )

    return result if result else []


# ── 4. Flashcards from Knowledge Base ──────────────────────────────────────────
_KB_FLASHCARDS_PROMPT = """You are an educational flashcard generator.
Generate 6 to 10 high-impact study flashcards from these concepts, definitions, and key facts.

CONCEPTS:
{concepts}

KEY FACTS:
{key_facts}

RULES:
- front: Clear, direct question or concept prompt
- back: Concise, precise answer or definition (1-2 sentences)
- Cover key terms, cause-effect, and definitions
- Output strictly a JSON array

OUTPUT FORMAT:
[
  {{"front": "What is <concept>?", "back": "<definition or explanation>"}}
]

JSON:"""


def generate_flashcards_from_kb(kb_data: Dict[str, Any], min_cards: int = 5) -> List[Dict[str, str]]:
    """Generates flashcards from Knowledge Base definitions and key facts."""
    concepts = "\n".join(f"- {c.get('term')}: {c.get('definition')}" for c in kb_data.get("concepts", []))
    key_facts = "\n".join(f"- {f.get('fact')}" for f in kb_data.get("key_facts", []))

    prompt = _KB_FLASHCARDS_PROMPT.format(concepts=concepts, key_facts=key_facts)

    def _parse(text: str):
        return _parse_flashcards(text)

    def _valid(items: Any):
        return isinstance(items, list) and len(items) >= min_cards

    result = AIService.generate_with_retry(
        prompt=prompt,
        parser_fn=_parse,
        validator_fn=_valid,
        budgets=[600, 800, 1000],
        max_retries=3,
    )

    if not result:
        # Fallback: create flashcards directly from concepts
        fallback_cards = []
        for c in kb_data.get("concepts", []):
            if c.get("term") and c.get("definition"):
                fallback_cards.append({
                    "front": f"What is {c['term']}?",
                    "back": c["definition"],
                })
        return fallback_cards[:8]

    return result
