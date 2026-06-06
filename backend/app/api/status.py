"""
app/api/status.py
GET /status/:session_id — lightweight status poll endpoint.
Returns current processing stage + any available results.
Used by frontend polling hook.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any

from app.core.security import get_current_user, AuthPayload
from app.core.timing   import get_timings
import httpx, os

router = APIRouter(prefix="/status", tags=["Status"])

_NEXTJS_URL   = os.getenv("NEXTJS_URL", "http://localhost:3000")
_INTERNAL_KEY = os.getenv("INTERNAL_API_KEY", "")


class StatusResponse(BaseModel):
    session_id: str
    status:     str
    label:      str
    timings:    Optional[dict] = None


@router.get("/{session_id}", response_model=StatusResponse)
async def get_status(
    session_id:   str,
    current_user: AuthPayload = Depends(get_current_user),
):
    """
    Returns current pipeline stage for a session.
    Frontend polls this every 3s while status is not READY/ERROR.
    """
    # Fetch current status from Next.js (which reads from DB)
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(
                f"{_NEXTJS_URL}/api/sessions/{session_id}/status",
                headers={"x-internal-key": _INTERNAL_KEY},
            )
        if res.status_code == 404:
            raise HTTPException(status_code=404, detail="Session not found.")
        data = res.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Could not reach app server: {e}")

    from app.core.status import ProcessingStatus
    try:
        status_enum = ProcessingStatus(data.get("status", "PROCESSING"))
        label = status_enum.label
    except ValueError:
        label = data.get("status", "Processing…")

    return StatusResponse(
        session_id=session_id,
        status=data.get("status", "PROCESSING"),
        label=label,
        timings=get_timings(session_id) if data.get("status") == "READY" else None,
    )