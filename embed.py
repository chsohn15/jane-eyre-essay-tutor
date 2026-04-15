from openai import OpenAI
from parse import load_text, strip_gutenberg, split_into_chapters, split_into_chunks
import chromadb

client = OpenAI()
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="jane_eyre")

def embed_chunks(chunks):
    print(f"Embedding {len(chunks)} chunks...")
    texts = [chunk["text"] for chunk in chunks]
    response = client.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )
    embeddings = [item.embedding for item in response.data]
    return embeddings

def store_chunks(chunks, embeddings):
    print("Storing in Chroma...")
    collection.add(
        ids=[f"chunk_{i}" for i in range(len(chunks))],
        embeddings=embeddings,
        documents=[chunk["text"] for chunk in chunks],
        metadatas=[{
            "chapter": chunk["chapter"],
            "paragraph": chunk["paragraph"],
            "context_before": chunk["context_before"],
            "context_after": chunk["context_after"]
        } for chunk in chunks]
    )
    print(f"Stored {collection.count()} chunks in Chroma")

if __name__ == "__main__":
    raw = load_text("jane_eyre.txt")
    clean = strip_gutenberg(raw)
    chapters = split_into_chapters(clean)
    chunks = split_into_chunks(chapters)
    embeddings = embed_chunks(chunks)
    store_chunks(chunks, embeddings)
    print("Done!")