"""
Embedding + ChromaDB service.

Key fixes vs original:
- Collection is NEVER deleted at module load (was wiping DB on every restart)
- Each video gets its own namespaced collection: "video_{video_id}"
- Embeddings are batched for speed
- search_segments accepts video_id so multi-video RAG works
"""
from typing import List, Dict, Any

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

# Keep current video_id in memory so single-video usage stays simple
_current_video_id: str = ""


def _collection_name(video_id: str) -> str:
    return f"video_{video_id}"


def _get_or_create(video_id: str):
    return _chroma_client.get_or_create_collection(
        name=_collection_name(video_id),
        metadata={"hnsw:space": "cosine"},
    )


# ── Store ─────────────────────────────────────────────────────────────────────

def store_segments(segments: List[Dict], video_id: str) -> None:
    """
    Embed and store all segments for a video.
    Creates a fresh collection for each video_id (overwrites if re-uploaded).
    """
    global _current_video_id

    try:
        # Delete old collection for this video_id if it exists
        try:
            _chroma_client.delete_collection(_collection_name(video_id))
        except Exception:
            pass  # doesn't exist yet — fine

        collection = _get_or_create(video_id)
        _current_video_id = video_id

        texts = [seg["text"] for seg in segments]
        logger.info(f"Embedding {len(texts)} segments for video {video_id}")

        # Batch embed (much faster than one-by-one)
        embeddings = _embed_model.encode(texts, batch_size=32, show_progress_bar=False).tolist()

        collection.add(
            ids=[str(i) for i in range(len(segments))],
            embeddings=embeddings,
            documents=texts,
            metadatas=[
                {"start": seg["start"], "end": seg.get("end", seg["start"])}
                for seg in segments
            ],
        )
        logger.info(f"Stored {len(segments)} segments in ChromaDB")

    except Exception as exc:
        logger.error(f"Embedding storage failed: {exc}")
        raise EmbeddingError(f"Failed to store embeddings: {exc}") from exc


# ── Search ────────────────────────────────────────────────────────────────────

def search_segments(
    query: str,
    video_id: str = "",
    n_results: int = 5,
) -> List[Dict[str, Any]]:
    """
    Semantic search against stored segments.
    Falls back to _current_video_id if video_id not specified.
    Returns list of {"text": str, "start": float, "end": float}.
    """
    vid = video_id or _current_video_id
    if not vid:
        return []

    try:
        collection = _get_or_create(vid)
        query_embedding = _embed_model.encode([query]).tolist()
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(n_results, collection.count() or 1),
        )

        segments = []
        for doc, meta in zip(
            results["documents"][0],
            results["metadatas"][0],
        ):
            segments.append({
                "text": doc,
                "start": meta.get("start", 0),
                "end": meta.get("end", 0),
            })
        return segments

    except Exception as exc:
        logger.error(f"Search failed: {exc}")
        return []