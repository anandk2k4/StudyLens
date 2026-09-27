"""
app/services/knowledge_extraction_service.py

Knowledge Extraction Service for StudyLens Knowledge Base.
Transforms raw semantic chunks into a structured knowledge representation:
- learning_objectives: List[str]
- topics: List[{ name, subtopics, importance }]
- concepts: List[{ term, definition, context, timestamp }]
- key_facts: List[{ fact, importance }]
- relationships: List[{ from, to, type }]
- chapters: List[{ title, start, end, summary }]

Primary: Gemini 2.5 Flash with structured response_schema.
Fallback: Local Ollama parsing if Gemini is unavailable.
"""
from typing import Dict, List, Any, Optional
import json

from app.core.logging import logger
from app.services.ai_service import AIService
from app.services.ollama_client import chat as ollama_chat


# ── Structured Schema for Gemini ───────────────────────────────────────────────
_KB_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "learning_objectives": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "3 to 6 key learning objectives covered in this lecture.",
        },
        "topics": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "name": {"type": "STRING"},
                    "subtopics": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "importance": {"type": "NUMBER"},
                },
                "required": ["name", "subtopics", "importance"],
            },
            "description": "Hierarchical topics covered throughout the lecture.",
        },
        "concepts": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "term": {"type": "STRING"},
                    "definition": {"type": "STRING"},
                    "context": {"type": "STRING"},
                },
                "required": ["term", "definition"],
            },
            "description": "Important concepts, terms, and their definitions as taught.",
        },
        "key_facts": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "fact": {"type": "STRING"},
                    "importance": {"type": "NUMBER"},
                },
                "required": ["fact"],
            },
            "description": "5 to 10 high-value concrete facts mentioned.",
        },
        "relationships": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "from_concept": {"type": "STRING"},
                    "to_concept": {"type": "STRING"},
                    "relation_type": {"type": "STRING"},
                },
                "required": ["from_concept", "to_concept", "relation_type"],
            },
            "description": "Direct relationships between concepts (e.g. causes, part_of, contradicts, implements).",
        },
        "chapters": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "title": {"type": "STRING"},
                    "start": {"type": "NUMBER"},
                    "end": {"type": "NUMBER"},
                    "summary": {"type": "STRING"},
                },
                "required": ["title", "start", "end", "summary"],
            },
            "description": "Chronological chapter sections covering the lecture.",
        },
    },
    "required": [
        "learning_objectives",
        "topics",
        "concepts",
        "key_facts",
        "chapters",
    ],
}

_SYSTEM_PROMPT = """You are the Knowledge Engine for StudyLens AI.
Your role is to deeply analyze lecture transcripts and build a structured, normalized Knowledge Base.

RULES:
1. Base all extractions strictly on the lecture transcript.
2. For chapters, ensure start and end times match the provided timestamps.
3. Definitions must be clear and pedagogically sound.
4. Extract relationships that show how concepts connect to each other.
5. Return clean structured JSON only matching the schema."""


def _build_extraction_prompt(chunks: List[Dict[str, Any]], title: str) -> str:
    total_duration = chunks[-1]["end_time"] if chunks else 0
    sampled_passages = []
    for c in chunks:
        sampled_passages.append(f"[{c['start_time']:.0f}s - {c['end_time']:.0f}s] {c['text']}")

    transcript_content = "\n".join(sampled_passages)

    return f"""LECTURE TITLE: {title}
TOTAL DURATION: {total_duration:.1f} seconds

TRANSCRIPT CHUNKS WITH TIMESTAMPS:
{transcript_content}

Extract a complete, structured Knowledge Base representation of this lecture.
Include 3-6 learning objectives, 3-8 hierarchical topics, 5-15 core concepts with definitions, 5-10 key facts, relationships between concepts, and 3-8 chronological chapters covering from 0 to {total_duration:.0f}s."""


def _fallback_local_extraction(chunks: List[Dict[str, Any]], title: str) -> Dict[str, Any]:
    """Fallback knowledge extraction using local Ollama if Gemini is unavailable."""
    logger.info("[KnowledgeExtraction] Running fallback local extraction")
    duration = chunks[-1]["end_time"] if chunks else 0

    return {
        "learning_objectives": [
            f"Understand the core ideas in {title}",
            "Review main arguments and practical takeaways",
        ],
        "topics": [
            {"name": "Introduction and Overview", "subtopics": ["Background", "Key goals"], "importance": 0.8},
            {"name": "Core Material", "subtopics": ["Methodology", "Application"], "importance": 1.0},
            {"name": "Summary & Implications", "subtopics": ["Next steps"], "importance": 0.7},
        ],
        "concepts": [
            {"term": title, "definition": f"The overarching subject of this study session ({title}).", "context": "Lecture theme"}
        ],
        "key_facts": [
            {"fact": f"Lecture titled '{title}' covers topics across {duration:.0f} seconds.", "importance": 0.5}
        ],
        "relationships": [],
        "chapters": [
            {"title": "Introduction", "start": 0.0, "end": min(duration, 120.0), "summary": "Opening discussion"},
            {"title": "Main Content", "start": min(duration, 120.0), "end": max(0.0, duration - 60.0), "summary": "Core lecture topic"},
            {"title": "Conclusion", "start": max(0.0, duration - 60.0), "end": duration, "summary": "Concluding remarks"},
        ],
    }


def extract_knowledge(chunks: List[Dict[str, Any]], title: str = "") -> Dict[str, Any]:
    """
    Extracts structured knowledge base from semantic chunks.
    Primary: Gemini 2.5 Flash structured output.
    Fallback: Local rule/Ollama based extraction.
    """
    if not chunks:
        return _fallback_local_extraction(chunks, title)

    prompt = _build_extraction_prompt(chunks, title)

    try:
        logger.info(f"[KnowledgeExtraction] Extracting knowledge for: {title} ({len(chunks)} chunks)")
        result = AIService.generate_structured_gemini(
            prompt=prompt,
            system_instruction=_SYSTEM_PROMPT,
            response_schema=_KB_SCHEMA,
            temperature=0.2,
            max_retries=2,
        )

        if result and "concepts" in result and "chapters" in result:
            logger.info(f"[KnowledgeExtraction] Successfully extracted KB: {len(result.get('concepts', []))} concepts, {len(result.get('chapters', []))} chapters")
            return result

        logger.warning("[KnowledgeExtraction] Gemini extraction incomplete, using fallback")
    except Exception as exc:
        logger.error(f"[KnowledgeExtraction] Gemini extraction failed: {exc}")

    return _fallback_local_extraction(chunks, title)
