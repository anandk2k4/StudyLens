from sentence_transformers import SentenceTransformer
import chromadb

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

client = chromadb.PersistentClient(
    path="./chroma_db"
)
client.delete_collection("study_lens")

collection = client.get_or_create_collection(
    name="study_lens"
)


def store_segments(segments):

    for index, segment in enumerate(segments):

        print(segment["text"])
        embedding = model.encode(
            segment["text"]
        ).tolist()

        collection.add(
            ids=[str(index)],
            embeddings=[embedding],
            documents=[segment["text"]],
            metadatas=[
                {
                    "start": segment["start"]
                }
            ]
        )


def search_segments(query):

    query_embedding = model.encode(
        query
    ).tolist()

    results = collection.query(
        query_embeddings=[
            query_embedding
        ],
        n_results=5
    )

    return results