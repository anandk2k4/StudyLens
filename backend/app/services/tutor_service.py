"""
app/services/tutor_service.py

AI Tutor Mode — RAG pipeline UNCHANGED from the original implementation
(query expansion, ChromaDB retrieval, dedup, adjacent segment merge).

ONLY CHANGE: the final generation call now goes to Gemini 2.5 Flash
instead of the local Ollama model. Everything before that line —
retrieval, chapter scoping, context assembly — is identical to before.
"""
import re
from typing import List, Dict, Optional

from app.services.embedding_service import search_segments
from app.services.gemini_tutor_service import generate_gemini_tutor_response   # ← NEW
from app.services.ollama_client import chat   # kept only for query expansion
from app.core.logging import logger


_VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}


# ── Adjacent segment merge (UNCHANGED — same pattern as qa_service) ──────────

def _merge_adjacent(
    segments:     List[Dict],
    all_segments: List[Dict],
    window: int = 1,
) -> List[Dict]:
    if not all_segments:
        return segments

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

        for offset in range(-window, window + 1):
            neighbour_idx = idx + offset
            if 0 <= neighbour_idx < len(all_segments):
                neighbour = all_segments[neighbour_idx]
                if neighbour["start"] not in seen_starts:
                    merged.append(neighbour)
                    seen_starts.add(neighbour["start"])

    return sorted(merged, key=lambda s: s["start"])


def _deduplicate(segments: List[Dict]) -> List[Dict]:
    seen = set()
    unique = []
    for seg in segments:
        if seg["start"] not in seen:
            seen.add(seg["start"])
            unique.append(seg)
    return unique


# ── Query expansion (UNCHANGED — still uses Ollama, this is retrieval-side) ──
# Note: this stays on Ollama because it's part of the RETRIEVAL pipeline,
# not the generation step. The spec only asked to replace the final LLM
# call that produces the tutor's teaching response, not the lightweight
# query rewriting used to improve ChromaDB recall.

_EXPANSION_PROMPT = """Given this question, write 3 different search queries that would help find the answer in a transcript.
Each query should use different words but target the same information.
Return ONLY the 3 queries, one per line, no numbering or extra text.

Question: {question}

Queries:"""


def _expand_query(question: str) -> List[str]:
    try:
        raw = chat(_EXPANSION_PROMPT.format(question=question), num_predict=120, temperature=0.3)
        queries = [
            line.strip() for line in raw.strip().splitlines()
            if line.strip() and len(line.strip()) > 5
        ]
        return [question] + queries[:3]
    except Exception as exc:
        logger.warning(f"Tutor query expansion failed: {exc}")
        return [question]


# ── Chapter-aware filtering (UNCHANGED) ───────────────────────────────────────

def _filter_segments_by_chapter(all_segments: List[Dict], chapter: Dict) -> List[Dict]:
    start = chapter.get("start", 0)
    end   = chapter.get("end", float("inf"))
    return [seg for seg in all_segments if start <= seg["start"] <= end]


# ── Fallback response ──────────────────────────────────────────────────────────

def _fallback_response(difficulty: str, message: str) -> Dict:
    return {
        "concept":             message,
        "example":             "",
        "analogy":             "",
        "key_takeaways":       [],
        "practice_question":   "",
        "difficulty":          difficulty,
        "follow_up_questions": [],
    }


# ── Public entry point ────────────────────────────────────────────────────────

def generate_tutor_response(
    session_id:    str,
    question:      str,
    difficulty:    str = "beginner",
    chapter:       Optional[Dict] = None,
    all_segments:  Optional[List[Dict]] = None,
) -> Dict:
    """
    Generate a structured tutor response.

    RETRIEVAL (UNCHANGED):
      - query expansion
      - ChromaDB single-video search (embedding_service.search_segments)
      - chapter scoping (if provided)
      - deduplication + adjacent segment merge

    GENERATION (CHANGED):
      - Previously: Ollama chat() call
      - Now: Gemini 2.5 Flash via gemini_tutor_service.py
    """
    difficulty = difficulty if difficulty in _VALID_DIFFICULTIES else "beginner"

    if not session_id:
        return _fallback_response(difficulty, "No session selected.")

    logger.info(
        f"Tutor request | session={session_id} difficulty={difficulty} "
        f"chapter={'yes' if chapter else 'no'} question='{question[:60]}'"
    )

    # ── Step 1: Expand query (UNCHANGED) ──────────────────────────────────────
    queries = _expand_query(question)

    # ── Step 2: Retrieve (UNCHANGED) ──────────────────────────────────────────
    retrieved: List[Dict] = []
    for q in queries:
        results = search_segments(q, video_id=session_id, n_results=8)
        retrieved.extend(results)

    if not retrieved:
        return _fallback_response(difficulty, "No relevant content found in this video.")

    # ── Step 3: Chapter scoping (UNCHANGED) ───────────────────────────────────
    if chapter and all_segments:
        retrieved = _filter_segments_by_chapter(retrieved, chapter)
        if not retrieved:
            return _fallback_response(
                difficulty,
                f"No relevant content found within the chapter '{chapter.get('title', '')}'."
            )

    # ── Step 4: Merge adjacent segments (UNCHANGED) ───────────────────────────
    if all_segments:
        scoped_all = (
            _filter_segments_by_chapter(all_segments, chapter)
            if chapter else all_segments
        )
        retrieved = _merge_adjacent(retrieved, scoped_all, window=1)

    # ── Step 5: Deduplicate (UNCHANGED) ───────────────────────────────────────
    sources = _deduplicate(retrieved)[:10]
    context = "\n---\n".join(s["text"] for s in sources)

    # ── Step 6: Generate response — NOW VIA GEMINI ────────────────────────────
    result = generate_gemini_tutor_response(
        context=context,
        question=question,
        difficulty=difficulty,
    )

    logger.info(f"Tutor response generated successfully | difficulty={difficulty} | provider=gemini")
    return result