from fastapi import APIRouter
from app.schemas.video import SearchRequest, SearchResponse, Segment
from app.services.embedding_service import search_segments

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/", response_model=SearchResponse)
async def semantic_search(data: SearchRequest):
    results = search_segments(
        query=data.query,
        video_id=data.video_id or "",
        n_results=data.n_results,
    )
    return SearchResponse(results=[Segment(**r) for r in results])