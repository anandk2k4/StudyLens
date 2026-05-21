import re
import ollama


# ── Segment selection ────────────────────────────────────────────────────────

def _select_segments(segments):
    """Return up to 9 representative segments (start / mid / end)."""
    total = len(segments)
    if total <= 9:
        return segments
    mid = total // 2
    return segments[:3] + segments[mid: mid + 3] + segments[-3:]


# ── Prompt ───────────────────────────────────────────────────────────────────

_PROMPT_TEMPLATE = """You are an educational quiz generator.

Below is a transcript. Read it carefully, then create EXACTLY 3 multiple-choice questions that test understanding of the content.

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


def _build_prompt(segments):
    context = "\n".join(s["text"] for s in segments)
    return _PROMPT_TEMPLATE.format(context=context)


# ── Parser ───────────────────────────────────────────────────────────────────

# Matches any of: "A) text", "A. text", "A - text", "(A) text"
_OPTION_RE = re.compile(
    r"^\(?([A-Da-d])\)?[\.\)\-\s]+(.+)$"
)
# Matches: "Answer: B", "answer:b", "Answer : C", etc.
_ANSWER_RE = re.compile(
    r"answer\s*:\s*([A-Da-d])", re.IGNORECASE
)


def _parse_block(block: str):
    """
    Parse a single Q/A block into a quiz dict.
    Returns None if the block is malformed.
    """
    lines = [l.strip() for l in block.strip().splitlines() if l.strip()]
    if not lines:
        return None

    question = lines[0]
    options = {}   # letter → text
    answer_letter = None

    for line in lines[1:]:
        opt_match = _OPTION_RE.match(line)
        ans_match = _ANSWER_RE.match(line)

        if opt_match:
            letter = opt_match.group(1).upper()
            options[letter] = opt_match.group(2).strip()
        elif ans_match:
            answer_letter = ans_match.group(1).upper()

    # Validate: need a question, all 4 options, and a valid answer
    if (
        not question
        or len(options) < 4
        or answer_letter not in options
    ):
        return None

    ordered_options = [options[k] for k in ("A", "B", "C", "D")]

    return {
        "question": question,
        "options": ordered_options,
        "answer": options[answer_letter],
    }


def parse_quiz(content: str):
    """Split LLM output on 'Q:' markers and parse each block."""
    quizzes = []

    # Split on "Q:" but keep the content after it
    raw_blocks = re.split(r"(?=\bQ\s*:)", content, flags=re.IGNORECASE)

    for block in raw_blocks:
        # Strip the leading "Q:" prefix before parsing
        cleaned = re.sub(r"^\s*Q\s*:\s*", "", block, flags=re.IGNORECASE)
        item = _parse_block(cleaned)
        if item:
            quizzes.append(item)

    return quizzes


# ── LLM call with retry ───────────────────────────────────────────────────────

def _call_ollama(prompt: str, num_predict: int = 600) -> str:
    response = ollama.chat(
        model="phi",
        messages=[{"role": "user", "content": prompt}],
        options={
            "temperature": 0.1,
            "num_predict": num_predict,
        },
    )
    return response["message"]["content"]


# ── Public entry point ────────────────────────────────────────────────────────

def generate_quiz(segments, min_questions: int = 3, max_retries: int = 3):
    """
    Generate a quiz from transcript segments.

    Retries up to `max_retries` times if fewer than `min_questions`
    are successfully parsed, increasing the token budget each attempt.
    Returns the best result obtained (may be fewer than min_questions
    if the LLM consistently fails).
    """
    selected = _select_segments(segments)
    prompt = _build_prompt(selected)

    best_result = []
    # Increase token budget with each retry: 600 → 700 → 800
    token_budgets = [600, 700, 800]

    for attempt in range(max_retries):
        budget = token_budgets[min(attempt, len(token_budgets) - 1)]
        content = _call_ollama(prompt, num_predict=budget)
        result = parse_quiz(content)

        if len(result) > len(best_result):
            best_result = result

        if len(best_result) >= min_questions:
            break

    # Return exactly min_questions if we got more
    return best_result[:min_questions] if len(best_result) >= min_questions else best_result