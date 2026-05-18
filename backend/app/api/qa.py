from fastapi import APIRouter
from pydantic import BaseModel

from app.services.qa_service import (
    ask_question
)

router = APIRouter(
    prefix="/qa",
    tags=["Q&A"]
)


class QuestionRequest(BaseModel):
    question: str


@router.post("/")
async def ask_ai(
    data: QuestionRequest
):

    answer = ask_question(
        data.question
    )

    return {
        "question": data.question,
        "answer": answer
    }