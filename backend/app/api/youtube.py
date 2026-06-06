# app/api/youtube.py — no auth dependency

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.logging import logger
from app.workers.pipeline import run_youtube_pipeline

router = APIRouter(prefix="/youtube", tags=["YouTube"])


class YouTubeRequest(BaseModel):
    url:        str
    session_id: Optional[str] = None
    user_id:    Optional[str] = None


class YouTubeStarted(BaseModel):
    session_id: str
    message:    str = "Processing started."


@router.post("/", response_model=YouTubeStarted)
async def download_and_process(
    data:             YouTubeRequest,
    background_tasks: BackgroundTasks,
):
    url = data.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail={"message": "URL is required."})
    if "youtube.com" not in url and "youtu.be" not in url:
        raise HTTPException(status_code=400, detail={"message": "Only YouTube URLs are supported."})

    session_id = data.session_id or ""
    user_id    = data.user_id    or ""

    logger.info(f"YouTube job queued: session={session_id} url={url}")

    background_tasks.add_task(
        run_youtube_pipeline,
        session_id=session_id,
        user_id=user_id,
        url=url,
    )

    return YouTubeStarted(session_id=session_id)