"""
app/services/chapter_service.py
AI chapter detection from transcript segments.

- Selects evenly-spread segments covering the full video
- Generates chapter boundaries with titles and summaries
- Robust JSON parser with 2 retries
- Chapter count scales with video duration
"""
import re
import json
from typing import List, Dict

from app.services.ollama_client import chat
from app.core.logging import logger


# ── Type ──────────────────────────────────────────────────────────────────────

Chapter = Dict  # {"title": str, "start": float, "end": float, "summary": str}


# ── Chapter count by duration ─────────────────────────────────────────────────

def _target_chapters(segments: list) -> int:
    if not segments:
        return 3
    duration = segments[-1]["end"]
    if duration < 600:       return 3   # < 10 min  → 2-4
    elif duration < 1800:    return 5   # 10-30 min → 4-6
    elif duration < 3600:    return 8   # 30-60 min → 6-10
    else:                    return 10  # 60+ min   → 8-12


# ── Segment selection — full spread, not density-based ───────────────────────

def _select_spread(segments: list, n: int = 20) -> list:
    """
    For chapter detection we need full coverage, not just dense segments.
    Evenly sample n segments across the entire transcript.
    """
    total = len(segments)
    if total <= n:
        return segments
    step = total / n
    indices = [min(round(i * step), total - 1) for i in range(n)]
    return [segments[i] for i in sorted(set(indices))]


# ── Prompt ─────────────────────────────────────────────────────────────────────

_PROMPT = """You are analyzing a video transcript to detect chapter boundaries.

VIDEO TRANSCRIPT (with timestamps):
{context}

TASK: Identify {target_chapters} logical chapters based on topic changes in the transcript.

RULES:
- Each chapter must cover a distinct topic or section
- Use the actual timestamps from the transcript for start/end values
- First chapter must start at 0
- Last chapter must end at {total_duration}
- Chapters must not overlap
- Do NOT create chapters for: greetings, sponsor messages, outros, filler
- Title: short (2-5 words), descriptive
- Summary: 1 sentence describing what is covered

OUTPUT: ONLY a valid JSON array. No explanation. No markdown. No code blocks.

[
  {{"title": "Introduction", "start": 0, "end": 120, "summary": "Overview of the topic."}},
  {{"title": "Core Concepts", "start": 120, "end": 450, "summary": "Explains the main ideas."}}
]

JSON:"""


# ── Parser ────────────────────────────────────────────────────────────────────

def _extract_json(text: str) -> str:
    text = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    start = text.find("[")
    end   = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


def _validate_chapter(c: dict, total_duration: float) -> bool:
    """Validate a single chapter dict."""
    return (
        isinstance(c, dict)
        and isinstance(c.get("title"),   str) and len(c["title"].strip()) > 0
        and isinstance(c.get("summary"), str) and len(c["summary"].strip()) > 0
        and isinstance(c.get("start"),   (int, float))
        and isinstance(c.get("end"),     (int, float))
        and c["start"] < c["end"]
        and c["start"] >= 0
        and c["end"]   <= total_duration + 5  # allow 5s tolerance
    )


def _parse_chapters(content: str, total_duration: float) -> List[Chapter]:
    try:
        data = json.loads(_extract_json(content))
        if not isinstance(data, list):
            return []

        chapters = [
            {
                "title":   c["title"].strip(),
                "start":   float(c["start"]),
                "end":     float(c["end"]),
                "summary": c["summary"].strip(),
            }
            for c in data
            if _validate_chapter(c, total_duration)
        ]

        if not chapters:
            return []

        # Sort by start time
        chapters.sort(key=lambda x: x["start"])

        # Fix first chapter to start at 0
        chapters[0]["start"] = 0.0

        # Fix last chapter to end at total_duration
        chapters[-1]["end"] = total_duration

        return chapters

    except json.JSONDecodeError as e:
        logger.warning(f"Chapter JSON parse error: {e}")
        return []
    except Exception as e:
        logger.warning(f"Chapter parse error: {e}")
        return []


# ── Public entry point ────────────────────────────────────────────────────────

def generate_chapters(segments: list) -> List[Chapter]:
    """
    Generate chapters from transcript segments.
    Returns a list of chapter dicts with title, start, end, summary.
    Returns [] if generation fails.
    """
    if not segments:
        return []

    total_duration  = segments[-1]["end"]
    target_chapters = _target_chapters(segments)

    # Use spread selection for full coverage
    selected = _select_spread(segments, n=24)

    # Build context with timestamps so model can use real values
    context_lines = [
        f"[{s['start']:.0f}s] {s['text']}"
        for s in selected
    ]
    context = "\n".join(context_lines)

    prompt = _PROMPT.format(
        context=context,
        target_chapters=target_chapters,
        total_duration=total_duration,
    )

    best: List[Chapter] = []

    for attempt in range(2):
        budget = 500 if attempt == 0 else 700
        logger.info(f"Chapter generation attempt {attempt + 1} (budget={budget})")

        try:
            content = chat(prompt, num_predict=budget, temperature=0.1)
            result  = _parse_chapters(content, total_duration)

            if len(result) > len(best):
                best = result

            if len(best) >= 2:  # at least 2 chapters = success
                break

        except Exception as e:
            logger.error(f"Chapter attempt {attempt + 1} error: {e}")

    logger.info(f"Chapters generated: {len(best)}")
    return best