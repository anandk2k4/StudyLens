def clean_transcript(text: str):

    unwanted_phrases = [
        "thank you",
        "see you soon",
        "what did you learn from this story",
    ]

    cleaned_text = text

    for phrase in unwanted_phrases:
        cleaned_text = cleaned_text.replace(phrase, "")

    return cleaned_text