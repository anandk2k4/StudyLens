"""
app/services/summary_service.py

Summary generation service.
Uses proportional segment selection and a grounded, structure-enforced
prompt to reduce hallucination and produce cleanly parseable output.

Key improvements over the previous version:
- Explicit output structure (overview line + real newline-separated bullets)
  instead of letting the model inline everything with "* " markers
- No "The main topic is..." framing — starts directly with content
- Post-processing cleanup strips any stray meta-commentary or inline
  bullet artifacts the model might still produce
- Slightly higher token budget + repeat_penalty tuning for more complete,
  less repetitive output
"""
import re
from app.services.ollama_client import chat
from app.services.segment_selector import select_for_summary
from app.core.logging import logger


_PROMPT = """You are an educational assistant producing a study summary from a video transcript.

TRANSCRIPT EXCERPT:
{context}

OUTPUT FORMAT (follow this exactly):

Line 1: One sentence stating what the video covers. Start directly with the subject
— do NOT write "The main topic is" or "This video discusses" or similar framing.

Then a blank line, followed by 3-6 bullet points, EACH ON ITS OWN LINE, each
starting with "- ". Each bullet must be a complete, standalone fact from the
transcript — do not write multiple bullets on the same line.

If the transcript reaches a conclusion or final recommendation, end with one
more line starting with "- " that states it clearly.

RULES:
- Base everything ONLY on the transcript above — never invent details.
- Use plain, factual language. No filler phrases, no opinions.
- Do NOT start with greetings or meta-commentary ("Sure!", "Here is...").
- Do NOT put more than one point on a single line.
- Do NOT use "Key points:" or "Conclusion:" as inline labels — just write
  the bullet lines directly, one per line.

EXAMPLE OF CORRECT FORMAT:
Clipping platforms are compared to find the best tool for short-form content creation.

- The author tested multiple clipping platforms over several weeks using a ranking system.
- The biggest platform was evaluated first, followed by a second pass to skip irrelevant options.
- WAP was highlighted for tracking TikTok, Reels, and Shorts content across multiple languages.
- WAP does not require approval or identity verification before use.
- The author identified WAP as the preferred platform due to its flexibility.

Now write the summary for the transcript above, following this exact format.

SUMMARY:"""


# ── Cleanup ────────────────────────────────────────────────────────────────────

_GREETING_RE = re.compile(
    r"^(sure|certainly|of course|here is|here's|i'll|let me|great question)",
    re.IGNORECASE,
)

_INLINE_LABEL_RE = re.compile(
    r"\b(key points?|main points?|key takeaways?)\s*:\s*",
    re.IGNORECASE,
)

_INLINE_CONCLUSION_RE = re.compile(
    r"\s*(?:conclusion|in conclusion|to conclude)\s*:\s*",
    re.IGNORECASE,
)


def _clean_summary(raw: str) -> str:
    text = raw.strip()

    # Strip stray greeting/meta-commentary opener if present
    lines = text.split("\n")
    if lines and _GREETING_RE.match(lines[0].strip()):
        lines = lines[1:]
    text = "\n".join(lines).strip()

    # Strip inline "Key points:" / "Main points:" labels — bullets should
    # stand on their own without this prefix
    text = _INLINE_LABEL_RE.sub("", text)

    # If the model still inlined a "Conclusion:" mid-paragraph instead of
    # putting it on its own bulleted line, break it onto a new line
    text = _INLINE_CONCLUSION_RE.sub("\n- ", text)

    # Normalise: if bullets were still inlined with "* " instead of real
    # newlines, convert them to proper newline-separated "- " bullets
    if "\n- " not in text and "* " in text:
        parts = re.split(r"\s*\*\s+", text)
        if len(parts) > 1:
            head = parts[0].strip()
            bullets = [p.strip() for p in parts[1:] if p.strip()]
            text = head + "\n\n" + "\n".join(f"- {b}" for b in bullets)

    return text.strip()


# ── Public entry point ────────────────────────────────────────────────────────

def generate_summary(segments: list) -> str:
    selected = select_for_summary(segments, target=12)
    context = "\n".join(s["text"] for s in selected)
    logger.info("Generating summary")

    raw = chat(
        _PROMPT.format(context=context),
        num_predict=420,
        temperature=0.15,
    )

    return _clean_summary(raw)