from fastapi import APIRouter, UploadFile, File
import shutil
import os

from app.services.audio_service import extract_audio
from app.services.transcription_service import transcribe_audio
from app.services.summary_service import generate_summary
from app.services.text_cleaning_service import clean_transcript
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

    cleaned_text = clean_transcript(transcript_data["text"])

    # Generate summary
    summary = generate_summary(transcript_data["segments"])

    # Generate notes
    notes = generate_notes(transcript_data["segments"])     

    quiz= generate_quiz(transcript_data["segments"])

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