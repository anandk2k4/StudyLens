"""
app/api/qa.py — updated /qa/all to return structured sections
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

from app.schemas.video import QuestionRequest, AnswerResponse, Segment
from app.services.qa_service import ask_question
from app.services.multisession_rag_service import ask_across_sessions

router = APIRouter(prefix="/qa", tags=["Q&A"])


# ── Single video Q&A (unchanged) ─────────────────────────────────────────────

@router.post("/", response_model=AnswerResponse)
async def ask_ai(data: QuestionRequest):
    answer, sources = ask_question(
        question=data.question,
        video_id=data.video_id or "",
    )
    return AnswerResponse(
        question=data.question,
        answer=answer,
        sources=[Segment(**s) for s in sources],
    )


# ── Multi-session Q&A — now returns structured sections ──────────────────────

class MultiSessionRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    user_id:  str = Field(..., min_length=1)


class SourceItem(BaseModel):
    session_id: str
    title:      str
    source:     str = "UPLOAD"


class AnswerSection(BaseModel):
    heading: str
    type:    Literal["lecture", "themes", "differences", "conclusion", "other"]
    content: str


class MultiSessionResponse(BaseModel):
    question: str
    answer:   str                      # raw full text — fallback rendering
    sections: List[AnswerSection] = []  # structured — preferred rendering
    sources:  List[SourceItem]    = []


@router.post("/all", response_model=MultiSessionResponse)
async def ask_across_all(data: MultiSessionRequest):
    """
    Search across ALL of the user's uploaded videos/lectures.
    Returns a structured, per-lecture breakdown with themes/differences/conclusion.
    """
    if not data.user_id:
        raise HTTPException(status_code=400, detail="user_id is required for multi-session search.")

    answer, sources, sections = ask_across_sessions(
        question=data.question,
        user_id=data.user_id,
    )

    return MultiSessionResponse(
        question=data.question,
        answer=answer,
        sections=[AnswerSection(**s) for s in sections],
        sources=[SourceItem(**s) for s in sources],
    )