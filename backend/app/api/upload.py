from fastapi import APIRouter, UploadFile, File
import shutil
import os

from app.services.audio_service import extract_audio
from app.services.transcription_service import transcribe_audio
from app.services.summary_service import generate_summary
from app.services.text_cleaning_service import clean_segments
from app.services.embedding_service import store_segments
from app.services.notes_service import (generate_notes)
from app.services.quiz_service import (generate_quiz)

router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = "uploads"

@router.post("/")
async def upload_video(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract audio
    audio_path = extract_audio(file_path)

    # Generate transcript
    transcript_data = transcribe_audio(audio_path)
    

    store_segments(
    transcript_data["segments"]
    )

    cleaned_segments = clean_segments(transcript_data["segments"])

    # Generate summary
    summary = generate_summary(cleaned_segments)

    # Generate notes
    notes = generate_notes(cleaned_segments)

    quiz= generate_quiz(cleaned_segments)

    return {
        "filename": file.filename,
        "audio_extracted": True,
        "audio_path": audio_path,
        "transcript": transcript_data["text"],
        "segments": transcript_data["segments"],
        "video_url": f"http://127.0.0.1:8000/{file_path}",
        "summary": summary,
        "notes": notes,
        "quiz":quiz
    }