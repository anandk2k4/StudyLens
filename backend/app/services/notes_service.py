"""
Study notes generation service — improved version.
Dynamic token budget, grounded prompt, post-processing cleaner.
"""
import re
from app.services.ollama_client import chat
from app.services.segment_selector import select_for_summary
from app.core.logging import logger

_PROMPT = """TRANSCRIPT:
{context}

---
TASK: Write concise study notes from the transcript above.

STRICT RULES:
- Start your response with the first bullet point immediately. No greetings, no preamble.
- Use ONLY this format for every point:  • <note>
- Extract as many distinct key points as the content contains — do not pad or truncate artificially.
- Each bullet must be a self-contained fact, concept, or takeaway from the transcript.
- Do NOT copy sentences verbatim — paraphrase in clear, simple language.
- Do NOT add headings, numbering, summaries, or closing remarks.
- Do NOT invent information not present in the transcript.

STUDY NOTES:
•"""

_NOISE_RE = re.compile(
    r"^(sure|here are|certainly|of course|great|these are|"
    r"in conclusion|to summarize|i hope|let me|as requested|"
    r"study notes\s*:?|notes\s*:?)",
    re.IGNORECASE,
)
_BULLET_RE = re.compile(r"^[•\-\*–]\s*(.+)")


def _clean(raw: str) -> str:
    lines = raw.splitlines()
    cleaned = []
    for line in lines:
        line = line.strip()
        if not line or _NOISE_RE.match(line):
            continue
        m = _BULLET_RE.match(line)
        if m:
            cleaned.append(f"• {m.group(1).strip()}")
        elif cleaned:
            cleaned.append(f"• {line}")
    return "\n".join(cleaned)


def _token_budget(segments: list) -> int:
    words = sum(len(s["text"].split()) for s in segments)
    return max(300, min((words // 40) * 15, 800))


def generate_notes(segments: list) -> str:
    selected = select_for_summary(segments, target=12)
    context = "\n".join(s["text"] for s in selected)
    budget = _token_budget(selected)
    logger.info(f"Generating notes (budget={budget})")
    raw = "• " + chat(_PROMPT.format(context=context), num_predict=budget, temperature=0.1)
    return _clean(raw)