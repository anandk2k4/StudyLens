"""
Q&A API endpoint.
Passes video_id so the service queries the right ChromaDB collection.
"""
from fastapi import APIRouter
from app.schemas.video import QuestionRequest, AnswerResponse, Segment
from app.services.qa_service import ask_question

router = APIRouter(prefix="/qa", tags=["Q&A"])


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