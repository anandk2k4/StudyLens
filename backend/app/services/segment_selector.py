"""
Smart segment selection for AI generation tasks.

Instead of always picking the same 9 positional segments,
we choose segments proportionally to transcript length and,
for quiz generation, by information density (unique word ratio).
"""
from typing import List, Dict


def _density_score(text: str) -> float:
    """Ratio of unique words — higher = more information-rich."""
    words = text.lower().split()
    return len(set(words)) / max(len(words), 1)


def select_for_summary(segments: List[Dict], target: int = 12) -> List[Dict]:
    """
    Proportional spread: evenly samples `target` segments across the full
    transcript so no section is silently ignored.
    """
    total = len(segments)
    if total <= target:
        return segments
    step = total / target
    indices = {round(i * step) for i in range(target)}
    indices = [min(i, total - 1) for i in sorted(indices)]
    return [segments[i] for i in indices]


def select_for_quiz(segments: List[Dict], target: int = 12) -> List[Dict]:
    """
    Picks the most information-dense segments across the transcript.
    Dense segments contain more distinct concepts → better quiz material.
    Ensures at least one segment from start / middle / end for coverage.
    """
    total = len(segments)
    if total <= target:
        return segments

    # Anchor segments (positional coverage)
    anchors = {0, total // 4, total // 2, 3 * total // 4, total - 1}

    # Score remaining segments by density
    scored = sorted(
        [(i, _density_score(segments[i]["text"])) for i in range(total) if i not in anchors],
        key=lambda x: x[1],
        reverse=True,
    )

    selected = set(anchors)
    for idx, _ in scored:
        if len(selected) >= target:
            break
        selected.add(idx)

    return [segments[i] for i in sorted(selected)]