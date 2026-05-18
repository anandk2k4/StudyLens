import ollama


def generate_notes(segments):

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
Transcript:
{context}

Create study notes from this transcript.

Return ONLY bullet points.

Do not add conclusions,
greetings, or commentary.

Example:
- Point 1
- Point 2
- Point 3
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
            "num_predict": 220
        }
    )

    return response[
        "message"
    ]["content"]