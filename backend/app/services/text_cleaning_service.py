def clean_segments(segments):

    unwanted_phrases = [
        "thank you",
        "see you soon",
        "i shared my learning",
        "what did you learn from this story"
    ]

    cleaned_segments = []

    for segment in segments:

        text = segment["text"].lower()

        if any(
            phrase in text
            for phrase in unwanted_phrases
        ):
            continue

        cleaned_segments.append(segment)

    return cleaned_segments