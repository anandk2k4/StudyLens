"""
app/services/flashcard_service.py
"""
import re
import json
from typing import List, Dict

from app.services.ollama_client import chat
from app.services.segment_selector import select_for_quiz
from app.core.logging import logger

FlashcardList = List[Dict[str, str]]

_PROMPT = """You are an educational flashcard generator. Your job is to create accurate question-answer flashcards from a transcript.

TRANSCRIPT:
{context}

RULES FOR QUESTIONS (front):
- Ask about specific facts, events, definitions, or concepts from the transcript
- Be clear and specific — e.g. "What did the fox say to the peacock?" not "What happened?"

RULES FOR ANSWERS (back):
- Answer EXACTLY what the question asks — nothing more, nothing less
- Write from a neutral third-person narrator perspective
- If the question asks what a character SAID, quote or closely paraphrase their actual words
- If the question asks what a character DID, describe their action
- If the question asks what something IS, give the definition
- NEVER answer from the wrong character's perspective
- NEVER include thoughts or feelings of the wrong character
- Keep answers short: 1-2 sentences maximum
- Use only information present in the transcript

ANSWER PERSPECTIVE EXAMPLES:
Q: What did the fox say to the peacock?
WRONG answer: "He looks handsome, the fox should be my friend"  ← this is the PEACOCK's thought
CORRECT answer: "The fox told the peacock he was going to eat him"  ← this answers what THE FOX SAID

Q: What did the peacock think of the fox?
WRONG answer: "The fox said he would eat him"  ← this answers what the fox said, not what peacock thought
CORRECT answer: "The peacock thought the fox was handsome and wanted to be his friend"

GENERATE:
- Between 5 and 10 flashcards
- Cover: key concepts, definitions, important events, lessons, terminology, cause/effect
- Avoid: greetings, filler sentences, sponsor messages, repeated information

OUTPUT FORMAT — ONLY valid JSON array, no explanation, no markdown, no code fences:
[
  {{"front": "question here", "back": "answer here"}},
  {{"front": "question here", "back": "answer here"}}
]

JSON OUTPUT:"""


def _extract_json(text: str) -> str:
    text = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    start = text.find("[")
    end   = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


def _validate_flashcard(card: dict) -> bool:
    return (
        isinstance(card, dict)
        and isinstance(card.get("front"), str)
        and isinstance(card.get("back"),  str)
        and len(card["front"].strip()) > 5
        and len(card["back"].strip())  > 5
        # Basic sanity: front and back should not be identical
        and card["front"].strip().lower() != card["back"].strip().lower()
    )


def _parse_flashcards(content: str) -> FlashcardList:
    try:
        data = json.loads(_extract_json(content))
        if not isinstance(data, list):
            return []
        return [
            {"front": c["front"].strip(), "back": c["back"].strip()}
            for c in data if _validate_flashcard(c)
        ]
    except json.JSONDecodeError as e:
        logger.warning(f"Flashcard JSON parse error: {e}")
        return []
    except Exception as e:
        logger.warning(f"Flashcard parse error: {e}")
        return []


def _token_budget(segments: list) -> int:
    words = sum(len(s["text"].split()) for s in segments)
    return max(400, min((words // 60) * 40, 900))


def generate_flashcards(
    segments: list,
    min_cards: int = 5,
    max_retries: int = 3,
) -> FlashcardList:
    selected = select_for_quiz(segments, target=12)
    context  = "\n".join(s["text"] for s in selected)
    prompt   = _PROMPT.format(context=context)

    best: FlashcardList = []
    budgets = [600, 750, 900]

    for attempt in range(max_retries):
        b = budgets[min(attempt, len(budgets) - 1)]
        logger.info(f"Flashcard attempt {attempt + 1} (budget={b})")
        try:
            content = chat(prompt, num_predict=b, temperature=0.1)
            result  = _parse_flashcards(content)
            if len(result) > len(best):
                best = result
            if len(best) >= min_cards:
                break
        except Exception as e:
            logger.error(f"Flashcard attempt {attempt + 1} error: {e}")

    logger.info(f"Flashcards generated: {len(best)}")
    return best