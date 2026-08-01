"""
app/services/multisession_rag_service.py

Multi-video RAG — structured, per-lecture answer generation.

Fix: the prompt template previously contained literal "{lecture_title}"
placeholders meant as instructions for the model to read, but Python's
str.format() tried to substitute them and crashed with KeyError.
Fixed by building the instructional template as a plain string with
escaped braces, and injecting the actual lecture titles separately.
"""
import re
from typing import List, Dict, Tuple
from collections import defaultdict

from app.services.embedding_service import search_all_user_segments
from app.services.ollama_client import chat
from app.core.logging import logger


# ── Prompts ───────────────────────────────────────────────────────────────────

_EXPANSION_PROMPT = """Given this question, write 3 different search queries to find the answer across multiple video lectures.
Each query should use different words but target the same information.
Return ONLY the 3 queries, one per line, no numbering.

Question: {question}

Queries:"""


def _build_multi_qa_prompt(context: str, question: str, lecture_titles: List[str]) -> str:
    """
    Build the structured multi-lecture prompt WITHOUT using str.format()
    on the instructional text — avoids KeyError from literal braces.
    Lecture titles are injected directly as a formatted list instead of
    as format placeholders.
    """
    titles_list = "\n".join(f'  - "{t}"' for t in lecture_titles)

    example_sections = "\n\n".join(
        f'{title} Says\n<summary of what this lecture says>'
        for title in lecture_titles[:2]
    ) if lecture_titles else '<Lecture Title> Says\n<summary>'

    return f"""You are a personal learning assistant with access to the user's lecture library.

LECTURES PROVIDED (grouped by source):
{context}

LECTURE TITLES IN THIS CONTEXT:
{titles_list}

QUESTION: {question}

INSTRUCTIONS — follow this exact structure:

1. Identify which lectures actually contain information relevant to the question.
2. For EACH relevant lecture, write a short section titled exactly: "<Lecture Title> Says"
   — using the EXACT lecture title from the list above — summarizing only what THAT lecture says, using ONLY that lecture's content.
3. After covering each lecture individually, write a section titled "Common Themes" — what multiple lectures agree on. Skip this section if there is only one relevant lecture.
4. Write a section titled "Differences" — where lectures disagree, emphasize different things, or use different approaches. Skip this section if there is only one relevant lecture or no differences exist.
5. Write a final section titled "Conclusion" — a combined, synthesized answer to the question.

RULES:
- Do NOT merge everything into a single paragraph.
- Do NOT skip the per-lecture sections even if the answer seems simple.
- Use the EXACT lecture titles given above as section headers.
- Base every claim ONLY on the provided lecture content — do not invent information.
- If a lecture has no relevant information, do not give it a section.
- If NONE of the lectures contain relevant information, respond only with:
  "I could not find that across your lectures."
- Do not add greetings or meta-commentary.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

{example_sections}

Common Themes
<shared ideas across lectures>

Differences
<where lectures disagree or differ>

Conclusion
<synthesized final answer>

ANSWER:"""


# ── Query expansion ───────────────────────────────────────────────────────────

def _expand_query(question: str) -> List[str]:
    try:
        raw = chat(
            _EXPANSION_PROMPT.format(question=question),
            num_predict=100,
            temperature=0.3,
        )
        queries = [
            line.strip()
            for line in raw.strip().splitlines()
            if line.strip() and len(line.strip()) > 5
        ]
        return [question] + queries[:3]
    except Exception as exc:
        logger.warning(f"Query expansion failed: {exc}")
        return [question]


# ── Deduplication ─────────────────────────────────────────────────────────────

def _deduplicate(segments: List[Dict]) -> List[Dict]:
    seen_texts = set()
    unique = []
    for seg in segments:
        key = seg["text"].strip()[:100]
        if key not in seen_texts:
            seen_texts.add(key)
            unique.append(seg)
    return unique


# ── Balanced coverage ──────────────────────────────────────────────────────────

def _balance_across_sessions(
    segments:        List[Dict],
    max_per_session: int = 5,
    total_max:       int = 25,
) -> List[Dict]:
    per_session: Dict[str, List[Dict]] = defaultdict(list)
    for seg in segments:
        per_session[seg["session_id"]].append(seg)

    queues = {sid: chunks[:max_per_session] for sid, chunks in per_session.items()}
    session_ids = list(queues.keys())

    balanced: List[Dict] = []
    idx = 0
    while len(balanced) < total_max and any(queues.values()):
        sid = session_ids[idx % len(session_ids)]
        if queues[sid]:
            balanced.append(queues[sid].pop(0))
        idx += 1
        if idx > total_max * len(session_ids) + len(session_ids):
            break

    return balanced


# ── Source extraction ─────────────────────────────────────────────────────────

def _extract_sources(segments: List[Dict]) -> List[Dict]:
    seen = set()
    sources = []
    for seg in segments:
        sid = seg.get("session_id", "")
        if sid and sid not in seen:
            seen.add(sid)
            sources.append({
                "session_id": sid,
                "title":      seg.get("title",  "Unknown"),
                "source":     seg.get("source", "UPLOAD"),
            })
    return sources


# ── Context builder ────────────────────────────────────────────────────────────

def _build_context(segments: List[Dict]) -> Tuple[str, List[str]]:
    by_session: Dict[str, Dict] = {}
    order: List[str] = []

    for seg in segments:
        sid = seg.get("session_id", "unknown")
        if sid not in by_session:
            title = seg.get("title", "Unknown Lecture")
            by_session[sid] = {"title": title, "texts": []}
            order.append(title)
        by_session[sid]["texts"].append(seg["text"])

    parts = []
    for sid, data in by_session.items():
        title = data["title"]
        texts = "\n".join(f"  - {t}" for t in data["texts"])
        parts.append(f"=== {title} ===\n{texts}")

    return "\n\n".join(parts), order


# ── Refusal detection ─────────────────────────────────────────────────────────

_REFUSAL_RE = re.compile(
    r"(could not find|not (found|mentioned|covered|present)|"
    r"no information|not in (the|any)|cannot find)",
    re.IGNORECASE,
)

def _is_refusal(text: str) -> bool:
    return bool(_REFUSAL_RE.search(text))


# ── Structured answer parser ──────────────────────────────────────────────────

_SECTION_RE = re.compile(
    r"^(.+?\sSays|Common Themes|Differences|Conclusion)\s*$",
    re.MULTILINE,
)

def _parse_sections(answer: str) -> List[Dict[str, str]]:
    matches = list(_SECTION_RE.finditer(answer))

    if not matches:
        return [{"heading": "Answer", "type": "conclusion", "content": answer.strip()}]

    sections = []
    for i, m in enumerate(matches):
        heading = m.group(1).strip()
        start   = m.end()
        end     = matches[i + 1].start() if i + 1 < len(matches) else len(answer)
        content = answer[start:end].strip()

        if not content:
            continue

        if heading == "Common Themes":
            section_type = "themes"
        elif heading == "Differences":
            section_type = "differences"
        elif heading == "Conclusion":
            section_type = "conclusion"
        elif heading.endswith(" Says"):
            section_type = "lecture"
        else:
            section_type = "other"

        sections.append({"heading": heading, "type": section_type, "content": content})

    return sections if sections else [{"heading": "Answer", "type": "conclusion", "content": answer.strip()}]


# ── Public entry point ────────────────────────────────────────────────────────

def ask_across_sessions(
    question: str,
    user_id:  str,
) -> Tuple[str, List[Dict], List[Dict]]:
    if not user_id:
        return "Please log in to use multi-session search.", [], []

    logger.info(f"Multi-session QA | user={user_id} | question='{question[:60]}'")

    queries = _expand_query(question)

    all_retrieved: List[Dict] = []
    for q in queries:
        results = search_all_user_segments(q, user_id=user_id, n_results=15)
        all_retrieved.extend(results)

    if not all_retrieved:
        return "No content found across your lectures. Try uploading some videos first.", [], []

    unique   = _deduplicate(all_retrieved)
    balanced = _balance_across_sessions(unique, max_per_session=5, total_max=25)

    num_sessions = len(set(s["session_id"] for s in balanced))
    logger.info(f"Multi-session RAG: {len(balanced)} chunks from {num_sessions} sessions")

    context, lecture_titles = _build_context(balanced)

    # ── Build prompt WITHOUT .format() — avoids KeyError on literal braces ────
    prompt = _build_multi_qa_prompt(context, question, lecture_titles)
    answer = chat(prompt, num_predict=700, temperature=0.15).strip()

    if _is_refusal(answer) and len(balanced) < len(unique):
        logger.info("Multi-session refusal — retrying with broader context")
        extended = _balance_across_sessions(unique, max_per_session=8, total_max=35)
        context2, lecture_titles2 = _build_context(extended)
        prompt2 = _build_multi_qa_prompt(context2, question, lecture_titles2)
        answer2 = chat(prompt2, num_predict=750, temperature=0.2).strip()
        if not _is_refusal(answer2):
            answer   = answer2
            balanced = extended

    sources  = _extract_sources(balanced)
    sections = _parse_sections(answer)

    logger.info(
        f"Multi-session QA complete: {len(sources)} sources, "
        f"{len(sections)} structured sections"
    )

    return answer, sources, sections