"""
Pydantic request / response schemas.
Validated on the way in and serialised on the way out — no raw dicts in API layer.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Shared ────────────────────────────────────────────────────────────────────

class Segment(BaseModel):
    text: str
    start: float
    end: float


class QuizItem(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=4, max_length=4)
    answer: str

class Flashcard(BaseModel):
    front: str
    back: str

# ── Upload response ───────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    video_id: str
    filename: str
    video_url: str
    transcript: str
    segments: List[Segment]
    summary: str
    notes: str
    quiz: List[QuizItem]
    flashcards: List[Flashcard] = []


# ── Q&A ───────────────────────────────────────────────────────────────────────

class QuestionRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    video_id: Optional[str] = None   # reserved for multi-video support


class AnswerResponse(BaseModel):
    question: str
    answer: str
    sources: List[Segment] = []      # which segments were used


# ── Search ────────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    video_id: Optional[str] = None
    n_results: int = Field(default=5, ge=1, le=20)


class SearchResponse(BaseModel):
    results: List[Segment]


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    ollama: bool
    model: str
    whisper: str

