"""
RAG-based Q&A service — improved retrieval.

Fixes:
- Query expansion: generates 3 search queries from the question
  so semantically different phrasings of the same fact are found
- Segment merging: combines adjacent segments to avoid split-fact problem
- Higher n_results default (8 instead of 5)
- Deduplication of retrieved segments before feeding to LLM
- Confidence check: if answer looks like a refusal, retry with broader context
"""
import re
from typing import List, Dict, Tuple

from app.services.embedding_service import search_segments
from app.services.ollama_client import chat
from app.core.logging import logger

# ── Prompts ───────────────────────────────────────────────────────────────────

_EXPANSION_PROMPT = """Given this question, write 3 different search queries that would help find the answer in a transcript.
Each query should use different words but target the same information.
Return ONLY the 3 queries, one per line, no numbering or extra text.

Question: {question}

Queries:"""

_QA_PROMPT = """You are an AI assistant answering questions about a video lecture.

Use ONLY the context segments below to answer.
If the answer is genuinely not present in any segment, say: "I could not find that in the video."

Do NOT start with greetings. Answer directly and completely.

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""

# ── Query expansion ───────────────────────────────────────────────────────────

def _expand_query(question: str) -> List[str]:
    """
    Generate 3 alternative phrasings of the question for broader retrieval.
    Falls back to just the original question if the LLM fails.
    """
    try:
        raw = chat(
            _EXPANSION_PROMPT.format(question=question),
            num_predict=120,
            temperature=0.3,   # slightly higher for variation
        )
        queries = [
            line.strip()
            for line in raw.strip().splitlines()
            if line.strip() and len(line.strip()) > 5
        ]
        # Always include the original
        all_queries = [question] + queries[:3]
        logger.info(f"Expanded to {len(all_queries)} queries")
        return all_queries
    except Exception as exc:
        logger.warning(f"Query expansion failed, using original: {exc}")
        return [question]


# ── Segment merging ───────────────────────────────────────────────────────────

def _merge_adjacent(segments: List[Dict], all_segments: List[Dict], window: int = 1) -> List[Dict]:
    """
    For each retrieved segment, include the segment immediately before and after it
    from the full transcript. This prevents the split-fact problem where
    one sentence spans two Whisper segments.
    """
    if not all_segments:
        return segments

    # Build index: start_time → position in full transcript
    start_to_idx = {s["start"]: i for i, s in enumerate(all_segments)}
    merged: List[Dict] = []
    seen_starts = set()

    for seg in segments:
        idx = start_to_idx.get(seg["start"])
        if idx is None:
            if seg["start"] not in seen_starts:
                merged.append(seg)
                seen_starts.add(seg["start"])
            continue

        # Add window segments around the matched one
        for offset in range(-window, window + 1):
            neighbour_idx = idx + offset
            if 0 <= neighbour_idx < len(all_segments):
                neighbour = all_segments[neighbour_idx]
                if neighbour["start"] not in seen_starts:
                    merged.append(neighbour)
                    seen_starts.add(neighbour["start"])

    # Sort by timestamp
    return sorted(merged, key=lambda s: s["start"])


# ── Deduplication ─────────────────────────────────────────────────────────────

def _deduplicate(segments: List[Dict]) -> List[Dict]:
    """Remove duplicate segments by start time."""
    seen = set()
    unique = []
    for seg in segments:
        if seg["start"] not in seen:
            seen.add(seg["start"])
            unique.append(seg)
    return unique


# ── Answer looks like a refusal? ──────────────────────────────────────────────

_REFUSAL_RE = re.compile(
    r"(could not find|not (found|mentioned|covered|discussed|present)|"
    r"no information|not in the video|cannot find)",
    re.IGNORECASE,
)

def _looks_like_refusal(answer: str) -> bool:
    return bool(_REFUSAL_RE.search(answer))


# ── Public entry point ────────────────────────────────────────────────────────

def ask_question(
    question: str,
    video_id: str = "",
    all_segments: List[Dict] = None,   # full transcript segments for merging
) -> Tuple[str, List[Dict]]:
    """
    Returns (answer_text, source_segments).

    Strategy:
    1. Expand the question into 3 search queries
    2. Retrieve top 8 segments per query
    3. Merge adjacent segments to fix split-fact problem
    4. Deduplicate and take top 10 by relevance order
    5. If LLM returns a refusal, retry with the top 15 segments (broader context)
    """
    if not video_id:
        # Try to get video_id from embedding service's current state
        from app.services.embedding_service import _current_video_id
        video_id = _current_video_id

    if not video_id:
        return "No video has been uploaded yet.", []

    # ── Step 1: Expand query ──────────────────────────────────────────────────
    queries = _expand_query(question)

    # ── Step 2: Retrieve for each query ──────────────────────────────────────
    all_retrieved: List[Dict] = []
    for q in queries:
        results = search_segments(q, video_id=video_id, n_results=8)
        all_retrieved.extend(results)

    if not all_retrieved:
        return "No relevant content found in the video.", []

    # ── Step 3: Merge adjacent segments ──────────────────────────────────────
    if all_segments:
        all_retrieved = _merge_adjacent(all_retrieved, all_segments, window=1)

    # ── Step 4: Deduplicate, keep order (first occurrence = most relevant) ───
    sources = _deduplicate(all_retrieved)[:10]

    # ── Step 5: Generate answer ───────────────────────────────────────────────
    context = "\n---\n".join(s["text"] for s in sources)
    logger.info(f"QA: {len(sources)} context segments for question='{question[:60]}'")

    answer = chat(
        _QA_PROMPT.format(context=context, question=question),
        num_predict=350,
        temperature=0.1,
    ).strip()

    # ── Step 6: Retry with broader context if answer is a refusal ────────────
    if _looks_like_refusal(answer):
        logger.info("Answer looks like a refusal — retrying with broader context")
        broader = _deduplicate(all_retrieved)[:15]
        broader_context = "\n---\n".join(s["text"] for s in broader)
        retry_answer = chat(
            _QA_PROMPT.format(context=broader_context, question=question),
            num_predict=400,
            temperature=0.15,
        ).strip()

        # Only use the retry answer if it's NOT also a refusal
        if not _looks_like_refusal(retry_answer):
            answer = retry_answer
            sources = broader

    return answer, sources