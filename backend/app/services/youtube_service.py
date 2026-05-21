import yt_dlp


DOWNLOAD_DIR = "uploads"


def download_youtube_video(url: str):

    ydl_opts = {

        "format":
            "bestvideo+bestaudio/best",

        "merge_output_format":
            "mp4",

        "outtmpl":
            f"{DOWNLOAD_DIR}/%(title)s.%(ext)s",

        "quiet": True,

        "noplaylist": True,

        "extractor_args": {
            "youtube": {
                "player_client": [
                    "android"
                ]
            }
        }
    }

    with yt_dlp.YoutubeDL(
        ydl_opts
    ) as ydl:

        info = ydl.extract_info(
            url,
            download=True
        )

        filename = ydl.prepare_filename(
            info
        )

        if not filename.endswith(".mp4"):

            filename = (
                filename.rsplit(".", 1)[0]
                + ".mp4"
            )

    return filename