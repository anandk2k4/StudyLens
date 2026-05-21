import re
import ollama


# ── Segment selection ─────────────────────────────────────────────────────────

def _select_segments(segments):
    """Return representative segments spread across the video."""
    total = len(segments)
    if total <= 9:
        return segments
    mid = total // 2
    return segments[:3] + segments[mid: mid + 3] + segments[-3:]


# ── Prompt ────────────────────────────────────────────────────────────────────

_PROMPT_TEMPLATE = """TRANSCRIPT:
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


def _build_prompt(segments):
    context = "\n".join(s["text"] for s in segments)
    return _PROMPT_TEMPLATE.format(context=context)


# ── Post-processing ───────────────────────────────────────────────────────────

def _clean_notes(raw: str) -> str:
    """
    Strip greetings/preamble, normalize bullet characters,
    and remove any trailing filler lines.
    """
    lines = raw.splitlines()
    cleaned = []

    # Patterns that indicate non-note lines (greetings, meta-commentary, etc.)
    _NOISE_RE = re.compile(
        r"^(sure|here are|certainly|of course|great|these are|"
        r"in conclusion|to summarize|i hope|let me|as requested|"
        r"study notes\s*:?|notes\s*:?)",
        re.IGNORECASE,
    )
    # Accepted bullet prefixes: •, -, *, –
    _BULLET_RE = re.compile(r"^[•\-\*–]\s*(.+)")

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if _NOISE_RE.match(line):
            continue
        # Normalize any bullet character to •
        bullet_match = _BULLET_RE.match(line)
        if bullet_match:
            cleaned.append(f"• {bullet_match.group(1).strip()}")
        elif cleaned:
            # If the LLM forgot the bullet but we're already in note territory,
            # treat the line as a continuation bullet
            cleaned.append(f"• {line}")

    return "\n".join(cleaned)


# ── LLM call ──────────────────────────────────────────────────────────────────

def _call_ollama(prompt: str, num_predict: int) -> str:
    response = ollama.chat(
        model="phi",
        messages=[{"role": "user", "content": prompt}],
        options={
            "temperature": 0.1,
            "num_predict": num_predict,
        },
    )
    # The prompt ends with "•" so the model continues from there —
    # prepend it back so the cleaner can normalise it correctly.
    return "• " + response["message"]["content"]


# ── Token budget based on transcript length ───────────────────────────────────

def _estimate_budget(segments) -> int:
    """
    Scale num_predict with content length so short videos don't get
    truncated and long ones don't waste tokens.
    """
    total_words = sum(len(s["text"].split()) for s in segments)
    # ~1 bullet per 40 words, ~15 tokens per bullet, min 300 / max 800
    estimated = (total_words // 40) * 15
    return max(300, min(estimated, 800))


# ── Public entry point ────────────────────────────────────────────────────────

def generate_notes(segments) -> str:
    selected = _select_segments(segments)
    prompt = _build_prompt(selected)
    budget = _estimate_budget(selected)

    raw = _call_ollama(prompt, num_predict=budget)
    notes = _clean_notes(raw)

    return notes