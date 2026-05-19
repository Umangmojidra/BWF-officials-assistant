import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

def get_collection():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index(os.getenv("PINECONE_INDEX"))
    return index

def store_chunks(chunks, embeddings):
    index = get_collection()
    vectors = []
    
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vectors.append({
            "id": f"chunk_{i}",
            "values": embedding.tolist(),
            "metadata": {
                "text": chunk["text"],
                "source": chunk["source"],
                "page_number": chunk["page_number"]
            }
        })
    
    # Upload in batches of 100
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch)
        print(f"Uploaded batch {i//batch_size + 1}/{(len(vectors)//batch_size) + 1}")
    
    print(f"✅ Stored {len(chunks)} chunks in Pinecone")

# Test
if __name__ == "__main__":
    index = get_collection()
    stats = index.describe_index_stats()
    print(f"Pinecone connected! Total vectors: {stats['total_vector_count']}")