import ffmpeg
import os

# Add FFmpeg binary path
os.environ["PATH"] += os.pathsep + r"C:\Users\ANAND\ffmpeg-8.1.1-essentials_build\bin"

def extract_audio(video_path: str):

    audio_filename = (
        os.path.splitext(os.path.basename(video_path))[0]
        + ".mp3"
    )

    audio_path = os.path.join("uploads", audio_filename)

    (
        ffmpeg
        .input(video_path)
        .output(audio_path, format="mp3")
        .run(overwrite_output=True)
    )

    return audio_path