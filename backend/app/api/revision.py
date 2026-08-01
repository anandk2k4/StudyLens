"""
app/api/revision.py — fixed version

Instead of FastAPI calling Next.js to fetch session data (which causes
503 when INTERNAL_API_KEY is missing or route doesn't exist), the frontend
now passes the session data it already has directly in the request body.

This is simpler, faster, and removes the internal HTTP call entirely.
"""
import httpx, os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Any

from app.services.revision_service import generate_revision
from app.core.logging import logger

router = APIRouter(prefix="/revision", tags=["Revision"])

_NEXTJS_URL   = os.getenv("NEXTJS_URL",       "http://localhost:3000")
_INTERNAL_KEY = os.getenv("INTERNAL_API_KEY", "")


class RevisionRequest(BaseModel):
    session_id:      str            = Field(..., min_length=1)
    user_id:         str            = Field(..., min_length=1)
    difficulty:      str            = Field("intermediate")
    # Session content — passed from Zustand store (already loaded in browser)
    title:           str            = ""
    summary:         Optional[str]  = None
    notes:           Optional[str]  = None
    chapters:        Optional[List] = None
    quiz:            Optional[List] = None
    flashcards:      Optional[List] = None
    # If revision already in DB, frontend passes it → returned immediately
    cached_revision: Optional[Any]  = None


class KeyConcept(BaseModel):
    concept:    str
    definition: str

class MemoryTrick(BaseModel):
    trick:       str
    explanation: str

class ExamQuestion(BaseModel):
    question: str
    hint:     str

class RevisionResponse(BaseModel):
    quick_revision:    str
    detailed_revision: str
    cheat_sheet:       List[str]         = []
    key_concepts:      List[KeyConcept]  = []
    common_mistakes:   List[str]         = []
    memory_tricks:     List[MemoryTrick] = []
    exam_questions:    List[ExamQuestion]= []
    final_checklist:   List[str]         = []
    cached:            bool              = False


async def _save_to_db(session_id: str, user_id: str, revision: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.patch(
                f"{_NEXTJS_URL}/api/sessions/{session_id}",
                json={"revision": revision, "_userId": user_id},
                headers={"x-internal-key": _INTERNAL_KEY},
            )
            if res.status_code not in (200, 201):
                logger.warning(f"[Revision] DB save returned {res.status_code}: {res.text[:200]}")
    except Exception as e:
        logger.warning(f"[Revision] Failed to save to DB: {e}")


@router.post("/", response_model=RevisionResponse)
async def generate_revision_endpoint(data: RevisionRequest):
    # Return cached revision if frontend already has it in the session
    if data.cached_revision:
        logger.info(f"[Revision] Returning cached revision for {data.session_id}")
        try:
            return RevisionResponse(**data.cached_revision, cached=True)
        except Exception:
            logger.warning("[Revision] Cached data malformed — regenerating")

    # Validate we have something to work with
    if not data.title and not data.summary and not data.notes:
        raise HTTPException(
            status_code=400,
            detail="Session has no content yet. Make sure the video has finished processing."
        )

    # Generate
    result = generate_revision(
        title=      data.title or "Lecture",
        summary=    data.summary,
        notes=      data.notes,
        chapters=   data.chapters,
        quiz=       data.quiz,
        flashcards= data.flashcards,
        difficulty= data.difficulty,
    )

    # Persist so next visit loads from cache
    await _save_to_db(data.session_id, data.user_id, result)

    return RevisionResponse(**result, cached=False)