from fastapi import APIRouter
from pydantic import BaseModel
from fastapi import HTTPException

from app.services.youtube_service import (
    download_youtube_video
)

from app.services.transcription_service import (
    transcribe_audio
)

from app.services.summary_service import (
    generate_summary
)

from app.services.notes_service import (
    generate_notes
)

from app.services.quiz_service import (
    generate_quiz
)

from app.services.embedding_service import (
    store_segments
)

from app.services.text_cleaning_service import (
    clean_segments
)

router = APIRouter(
    prefix="/youtube",
    tags=["YouTube"]
)


class YoutubeRequest(BaseModel):
    url: str


@router.post("/")
async def process_youtube(
    data: YoutubeRequest
):
    try:

        # Download video
        video_path = download_youtube_video(
            data.url
        )
    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Error downloading YouTube video: {str(e)}"
        )

    # Transcribe
    transcript_data = transcribe_audio(
        video_path
    )

    # Clean segments
    cleaned_segments = clean_segments(
        transcript_data["segments"]
    )

    # Store embeddings
    store_segments(cleaned_segments)

    # Generate AI features
    summary = generate_summary(
        cleaned_segments
    )

    notes = generate_notes(
        cleaned_segments
    )

    quiz = generate_quiz(
        cleaned_segments
    )

    return {

        "video_url":
            f"http://127.0.0.1:8000/{video_path}",

        "transcript":
            transcript_data["text"],

        "segments":
            cleaned_segments,

        "summary":
            summary,

        "notes":
            notes,

        "quiz":
            quiz
    }