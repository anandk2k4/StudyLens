import ollama


def generate_summary(segments):

    total_segments = len(segments)

    if total_segments < 9:

        important_segments = segments

    else:

        important_segments = (

            segments[:3] +

            segments[
                total_segments // 2:
                total_segments // 2 + 3
            ] +

            segments[-3:]
        )

    context = "\n".join(

        segment["text"]

        for segment in important_segments
    )

    prompt = f"""
Create a clear and grounded summary
using ONLY the transcript context.

Focus on:
- beginning
- important events
- ending lesson

Use exact character roles
from the transcript.

Do not switch character actions.
Do not invent information.
Do not add opinions or commentary.

Transcript Context:
{context}
"""

    response = ollama.chat(

        model="phi",

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],

        options={
            "temperature": 0.1,
            "num_predict": 180
        }
    )

    return response[
        "message"
    ]["content"]