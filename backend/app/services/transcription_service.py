import whisper

# Load model once
model = whisper.load_model("small")

def transcribe_audio(audio_path: str):

    result = model.transcribe(audio_path)

    return result