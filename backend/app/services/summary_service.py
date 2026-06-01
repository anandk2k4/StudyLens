"""
Summary generation service.
Uses proportional segment selection and a grounded prompt to reduce hallucination.
"""
from app.services.ollama_client import chat
from app.services.segment_selector import select_for_summary
from app.core.logging import logger

_PROMPT = """You are an educational assistant producing a study summary.

TRANSCRIPT EXCERPT:
{context}

INSTRUCTIONS:
- Write a clear, factual summary based ONLY on the transcript above.
- Cover the main topic, key points, and any conclusions reached.
- Use plain, precise language — no filler phrases or opinions.
- Do NOT start with greetings or meta-commentary (e.g. "Sure!" or "Here is...").
- Do NOT invent details not present in the transcript.
- Length: 3-5 sentences.

SUMMARY:"""


def generate_summary(segments: list) -> str:
    selected = select_for_summary(segments, target=12)
    context = "\n".join(s["text"] for s in selected)
    logger.info("Generating summary")
    return chat(_PROMPT.format(context=context), num_predict=350, temperature=0.1)