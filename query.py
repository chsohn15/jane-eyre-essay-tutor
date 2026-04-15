from openai import OpenAI
import chromadb

client = OpenAI()
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="jane_eyre")

def query(question, n_results=5):
    response = client.embeddings.create(
        input=[question],
        model="text-embedding-3-small"
    )
    query_embedding = response.data[0].embedding
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    for i, (doc, metadata) in enumerate(zip(results["documents"][0], results["metadatas"][0])):
        print(f"\n--- Result {i+1} | {metadata['chapter']} | paragraph {metadata['paragraph']} ---")
        print(doc)

if __name__ == "__main__":
    query("red room locked punished")