import ollama

from app.services.embedding_service import (
    search_segments
)


def ask_question(question: str):

    results = search_segments(question)

    documents = results["documents"][0]

    context = "\n".join(documents)

    prompt = f"""
You are a helpful AI video assistant.

Answer the question ONLY using
the provided context.

If answer is not found,
say:
"I could not find that in the video."

Context:
{context}

Question:
{question}

Answer:
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
            "num_predict": 120
        }
    )

    return response["message"]["content"]