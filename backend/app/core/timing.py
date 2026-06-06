"""
app/core/timing.py
Phase 1 — Performance metrics.
Wrap any pipeline stage with @timed or use the Timer context manager.
All results are logged and stored in a shared dict per request.
"""
import time
import functools
from contextlib import contextmanager
from typing import Dict, Optional
from app.core.logging import logger


# Per-request timing store — keyed by session_id
_timing_store: Dict[str, Dict[str, float]] = {}


def init_timing(session_id: str) -> None:
    _timing_store[session_id] = {}


def record(session_id: str, stage: str, elapsed: float) -> None:
    if session_id not in _timing_store:
        _timing_store[session_id] = {}
    _timing_store[session_id][stage] = round(elapsed, 2)
    logger.info(f"[TIMING] {stage}: {elapsed:.2f}s  (session={session_id})")


def get_timings(session_id: str) -> Dict[str, float]:
    return _timing_store.get(session_id, {})


def clear_timings(session_id: str) -> None:
    _timing_store.pop(session_id, None)


def log_summary(session_id: str) -> None:
    timings = get_timings(session_id)
    if not timings:
        return
    total = sum(timings.values())
    lines = [f"  {k:<30} {v:>6.1f}s" for k, v in timings.items()]
    lines.append(f"  {'TOTAL':<30} {total:>6.1f}s")
    logger.info(f"[TIMING SUMMARY] session={session_id}\n" + "\n".join(lines))


@contextmanager
def Timer(session_id: str, stage: str):
    """
    Usage:
        with Timer(session_id, "transcription"):
            result = transcribe_audio(path)
    """
    start = time.perf_counter()
    try:
        yield
    finally:
        record(session_id, stage, time.perf_counter() - start)