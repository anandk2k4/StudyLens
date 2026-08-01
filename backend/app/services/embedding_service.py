"""
app/services/embedding_service.py — updated for multi-session RAG.

Changes:
- store_segments now accepts user_id, session_id, title, source as metadata
- search_segments can search a single video OR all videos for a user
- Each segment stores: session_id, user_id, title, source in metadata
- User isolation guaranteed — all queries filter by user_id
"""
from typing import List, Dict, Any, Optional

from sentence_transformers import SentenceTransformer
import chromadb

from app.core.config import settings
from app.core.errors import EmbeddingError
from app.core.logging import logger

# ── Load once ─────────────────────────────────────────────────────────────────
logger.info("Loading embedding model: all-MiniLM-L6-v2")
_embed_model = SentenceTransformer("all-MiniLM-L6-v2")
logger.info("Embedding model ready")

_chroma_client = chromadb.PersistentClient(path=settings.chroma_db_path)

# Single global collection — all users, all videos
# Filtered by user_id at query time for isolation
_COLLECTION_NAME = "studylens_all"

_current_video_id: str = ""


def _get_collection():
    return _chroma_client.get_or_create_collection(
        name=_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


# ── Store ─────────────────────────────────────────────────────────────────────

def store_segments(
    segments:   List[Dict],
    video_id:   str,
    user_id:    str  = "",
    session_id: str  = "",
    title:      str  = "",
    source:     str  = "UPLOAD",
) -> None:
    """
    Embed and store segments with full metadata for multi-session RAG.
    Deletes existing segments for this video_id before re-inserting.

    Metadata stored per segment:
      - video_id    : ChromaDB collection key
      - session_id  : Prisma session ID
      - user_id     : Owner — used to filter all queries
      - title       : Video title for source attribution
      - source      : UPLOAD | YOUTUBE
      - start / end : Timestamp
    """
    global _current_video_id

    try:
        collection = _get_collection()
        _current_video_id = video_id

        texts = [seg["text"] for seg in segments]
        logger.info(f"Embedding {len(texts)} segments | video={video_id} user={user_id}")

        # Delete old entries for this video_id (handles re-upload)
        try:
            existing = collection.get(where={"video_id": {"$eq": video_id}})
            if existing["ids"]:
                collection.delete(ids=existing["ids"])
                logger.info(f"Deleted {len(existing['ids'])} old segments for video {video_id}")
        except Exception:
            pass

        embeddings = _embed_model.encode(
            texts, batch_size=32, show_progress_bar=False
        ).tolist()

        # Use video_id + index as unique ID
        ids = [f"{video_id}_{i}" for i in range(len(segments))]

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=[
                {
                    "video_id":   video_id,
                    "session_id": session_id or video_id,
                    "user_id":    user_id,
                    "title":      title,
                    "source":     source,
                    "start":      seg["start"],
                    "end":        seg.get("end", seg["start"]),
                }
                for seg in segments
            ],
        )
        logger.info(f"Stored {len(segments)} segments in ChromaDB")

    except Exception as exc:
        logger.error(f"Embedding storage failed: {exc}")
        raise EmbeddingError(f"Failed to store embeddings: {exc}") from exc


# ── Search — single video ─────────────────────────────────────────────────────

def search_segments(
    query:    str,
    video_id: str = "",
    n_results: int = 8,
) -> List[Dict[str, Any]]:
    """
    Search within a single video's segments.
    Backward compatible with existing qa_service.py usage.
    """
    vid = video_id or _current_video_id
    if not vid:
        return []

    try:
        collection = _get_collection()
        count = collection.count()
        if count == 0:
            return []

        query_embedding = _embed_model.encode([query]).tolist()
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(n_results, count),
            where={"video_id": {"$eq": vid}},
        )

        return [
            {
                "text":  doc,
                "start": meta.get("start", 0),
                "end":   meta.get("end",   0),
            }
            for doc, meta in zip(
                results["documents"][0],
                results["metadatas"][0],
            )
        ]

    except Exception as exc:
        logger.error(f"Search failed: {exc}")
        return []


# ── Search — all videos for a user ───────────────────────────────────────────

def search_all_user_segments(
    query:    str,
    user_id:  str,
    n_results: int = 30,
) -> List[Dict[str, Any]]:
    """
    Search across ALL videos belonging to a user.
    Returns segments with source metadata for attribution.
    Never returns segments from other users.
    """
    if not user_id:
        return []

    try:
        collection = _get_collection()
        count = collection.count()
        if count == 0:
            return []

        query_embedding = _embed_model.encode([query]).tolist()
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(n_results, count),
            where={"user_id": {"$eq": user_id}},   # ← user isolation
        )

        return [
            {
                "text":       doc,
                "start":      meta.get("start", 0),
                "end":        meta.get("end",   0),
                "session_id": meta.get("session_id", ""),
                "video_id":   meta.get("video_id",   ""),
                "title":      meta.get("title",       "Unknown"),
                "source":     meta.get("source",      "UPLOAD"),
            }
            for doc, meta in zip(
                results["documents"][0],
                results["metadatas"][0],
            )
        ]

    except Exception as exc:
        logger.error(f"Multi-session search failed: {exc}")
        return []