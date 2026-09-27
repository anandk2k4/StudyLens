"""
app/services/chunking_service.py

Semantic Chunking Service for StudyLens Knowledge Base.
Merges consecutive Whisper segments into coherent semantic passages (typically 150-350 words).
Preserves precise start and end timestamps.
"""
from typing import List, Dict, Any
import re


def _is_sentence_end(text: str) -> bool:
    """Checks if segment ends with terminal punctuation."""
    return bool(re.search(r"[.!?]['\"\)]?\s*$", text.strip()))


def create_semantic_chunks(
    segments: List[Dict[str, Any]],
    target_words: int = 250,
    max_words: int = 400,
    pause_threshold_sec: float = 2.0,
) -> List[Dict[str, Any]]:
    """
    Groups raw transcript segments into semantic chunks.

    Parameters:
      segments: List of dicts with 'text', 'start', 'end'
      target_words: Preferred chunk size in words
      max_words: Hard cap on chunk size in words
      pause_threshold_sec: Pause duration indicating natural break

    Returns:
      List of chunk dictionaries:
      [{
         "index": int,
         "text": str,
         "start_time": float,
         "end_time": float,
         "word_count": int,
         "segment_count": int
      }]
    """
    if not segments:
        return []

    chunks: List[Dict[str, Any]] = []
    current_texts: List[str] = []
    current_start: float = segments[0]["start"]
    current_end: float = segments[0]["end"]
    current_word_count: int = 0
    current_segment_count: int = 0

    for i, seg in enumerate(segments):
        text = seg["text"].strip()
        if not text:
            continue

        words = len(text.split())
        start = seg["start"]
        end = seg.get("end", start)

        # Detect gap / pause between segments
        has_pause = (start - current_end) >= pause_threshold_sec if current_texts else False
        is_terminal = _is_sentence_end(current_texts[-1]) if current_texts else False

        should_split = False
        if current_word_count + words > max_words:
            should_split = True
        elif current_word_count >= target_words and (is_terminal or has_pause):
            should_split = True

        if should_split and current_texts:
            chunk_text = " ".join(current_texts).strip()
            chunks.append({
                "index": len(chunks),
                "text": chunk_text,
                "start_time": round(current_start, 2),
                "end_time": round(current_end, 2),
                "word_count": current_word_count,
                "segment_count": current_segment_count,
            })
            # Reset
            current_texts = [text]
            current_start = start
            current_end = end
            current_word_count = words
            current_segment_count = 1
        else:
            if not current_texts:
                current_start = start
            current_texts.append(text)
            current_end = end
            current_word_count += words
            current_segment_count += 1

    # Remaining text
    if current_texts:
        chunks.append({
            "index": len(chunks),
            "text": " ".join(current_texts).strip(),
            "start_time": round(current_start, 2),
            "end_time": round(current_end, 2),
            "word_count": current_word_count,
            "segment_count": current_segment_count,
        })

    return chunks
