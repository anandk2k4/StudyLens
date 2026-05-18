from fastapi import APIRouter
from pydantic import BaseModel

from app.services.embedding_service import (
    search_segments
)

router = APIRouter(
    prefix="/search",
    tags=["Search"]
)


class SearchRequest(BaseModel):
    query: str


@router.post("/")
async def semantic_search(
    data: SearchRequest
):

    results = search_segments(
        data.query
    )

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]

    formatted_results = []

    for doc, metadata in zip(
        documents,
        metadatas
    ):

        formatted_results.append({
            "text": doc,
            "start": metadata["start"]
        })

    return {
        "results": formatted_results
    }