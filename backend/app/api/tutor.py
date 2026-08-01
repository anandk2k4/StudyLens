"""
app/api/tutor.py — updated response schema to include key_takeaways
(new field added by the Gemini prompt spec). No endpoint signature changes.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

from app.services.tutor_service import generate_tutor_response
from app.core.logging import logger

router = APIRouter(prefix="/tutor", tags=["Tutor"])


class ChapterInput(BaseModel):
    title:   str
    start:   float
    end:     float
    summary: Optional[str] = ""


class SegmentInput(BaseModel):
    text:  str
    start: float
    end:   float


class TutorRequest(BaseModel):
    session_id:   str = Field(..., min_length=1)
    question:     str = Field(..., min_length=3, max_length=1000)
    difficulty:   Literal["beginner", "intermediate", "advanced"] = "beginner"
    chapter:      Optional[ChapterInput] = None
    all_segments: Optional[List[SegmentInput]] = None


class TutorResponse(BaseModel):
    concept:             str
    example:             str
    analogy:             str
    key_takeaways:       List[str] = []   # ← NEW field
    practice_question:   str
    difficulty:           str
    follow_up_questions: List[str] = []


@router.post("/", response_model=TutorResponse)
async def tutor(data: TutorRequest):
    if not data.session_id:
        raise HTTPException(status_code=400, detail="session_id is required.")

    chapter_dict  = data.chapter.dict() if data.chapter else None
    segments_list = [s.dict() for s in data.all_segments] if data.all_segments else None

    result = generate_tutor_response(
        session_id=data.session_id,
        question=data.question,
        difficulty=data.difficulty,
        chapter=chapter_dict,
        all_segments=segments_list,
    )

    return TutorResponse(**result)