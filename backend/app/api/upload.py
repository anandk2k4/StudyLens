"""
app/api/upload.py — pass title and source to pipeline for embedding metadata
"""
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.errors  import StudyLensError
from app.core.logging import logger
from app.utils.file_utils import validate_video_file, safe_filename, ensure_upload_dir
from app.workers.pipeline import run_upload_pipeline

router = APIRouter(prefix="/upload", tags=["Upload"])


class UploadStarted(BaseModel):
    session_id: str
    message:    str = "Processing started."


@router.post("/", response_model=UploadStarted)
async def upload_video(
    background_tasks: BackgroundTasks,
    file:       UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    user_id:    Optional[str] = Form(None),
    title:      Optional[str] = Form(None),    # ← NEW
    source:     Optional[str] = Form("UPLOAD"),# ← NEW
):
    ensure_upload_dir()

    content = await file.read()
    try:
        validate_video_file(
            filename=file.filename or "upload",
            content_type=file.content_type or "",
            size=len(content),
        )
    except StudyLensError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"stage": exc.stage, "message": exc.message},
        )

    if session_id:
        import os
        video_path = os.path.join("uploads", f"{session_id}.mp4")
        with open(video_path, "wb") as f:
            f.write(content)
        used_session_id = session_id
    else:
        used_session_id, video_path = safe_filename(file.filename or "upload")
        with open(video_path, "wb") as f:
            f.write(content)

    video_url = f"http://127.0.0.1:8000/{video_path}"
    logger.info(
        f"Upload saved: {video_path} ({len(content)//1024} KB) "
        f"session={used_session_id} user={user_id} title={title}"
    )

    background_tasks.add_task(
        run_upload_pipeline,
        session_id=used_session_id,
        user_id=user_id or "",
        video_path=video_path,
        filename=title or file.filename or "upload",   # use provided title
        video_url=video_url,
        source=source or "UPLOAD",                      # ← NEW
    )

    return UploadStarted(session_id=used_session_id)