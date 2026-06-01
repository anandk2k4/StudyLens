"""
Quiz generation service — robust prompt + parser + retry logic.
"""
import re
from app.services.ollama_client import chat
from app.services.segment_selector import select_for_quiz
from app.core.logging import logger

_PROMPT = """You are an educational quiz generator.

Below is a transcript. Read it carefully, then create EXACTLY 3 multiple-choice questions
that test understanding of the content.

TRANSCRIPT:
{context}

RULES:
- Base every question strictly on the transcript above.
- Each question must have exactly 4 options labeled A) B) C) D)
- Mark the single correct answer with "Answer: X" (X = A, B, C, or D)
- Do NOT add explanations, commentary, or extra text.
- Do NOT number the questions — use only the Q: prefix shown below.

OUTPUT FORMAT (repeat exactly 3 times):

Q: <question text>
A) <option>
B) <option>
C) <option>
D) <option>
Answer: <A|B|C|D>

"""

_OPTION_RE = re.compile(r"^\(?([A-Da-d])\)?[\.\)\-\s]+(.+)$")
_ANSWER_RE = re.compile(r"answer\s*:\s*([A-Da-d])", re.IGNORECASE)


def _parse_block(block: str) -> dict | None:
    lines = [l.strip() for l in block.strip().splitlines() if l.strip()]
    if not lines:
        return None
    question = lines[0]
    options: dict[str, str] = {}
    answer_letter = None
    for line in lines[1:]:
        m = _OPTION_RE.match(line)
        a = _ANSWER_RE.match(line)
        if m:
            options[m.group(1).upper()] = m.group(2).strip()
        elif a:
            answer_letter = a.group(1).upper()
    if not question or len(options) < 4 or answer_letter not in options:
        return None
    return {
        "question": question,
        "options": [options[k] for k in ("A", "B", "C", "D")],
        "answer": options[answer_letter],
    }


def _parse_quiz(content: str) -> list:
    quizzes = []
    for block in re.split(r"(?=\bQ\s*:)", content, flags=re.IGNORECASE):
        cleaned = re.sub(r"^\s*Q\s*:\s*", "", block, flags=re.IGNORECASE)
        item = _parse_block(cleaned)
        if item:
            quizzes.append(item)
    return quizzes


def generate_quiz(segments: list, min_questions: int = 3, max_retries: int = 3) -> list:
    selected = select_for_quiz(segments, target=12)
    context = "\n".join(s["text"] for s in selected)
    prompt = _PROMPT.format(context=context)

    best: list = []
    budgets = [650, 750, 850]

    for attempt in range(max_retries):
        budget = budgets[min(attempt, len(budgets) - 1)]
        logger.info(f"Quiz generation attempt {attempt + 1} (budget={budget})")
        content = chat(prompt, num_predict=budget, temperature=0.1)
        result = _parse_quiz(content)
        if len(result) > len(best):
            best = result
        if len(best) >= min_questions:
            break

    logger.info(f"Quiz generated: {len(best)} questions")
    return best[:min_questions] if len(best) >= min_questions else best