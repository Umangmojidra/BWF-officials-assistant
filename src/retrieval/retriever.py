import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.ingestion.embedder import generate_embeddings
from src.ingestion.vector_store import get_collection

def retrieve_chunks(query, top_k=3):
    index = get_collection()
    
    # Generate embedding for query
    embedding = generate_embeddings([query])
    
    # Search Pinecone
    results = index.query(
        vector=embedding[0].tolist(),
        top_k=top_k,
        include_metadata=True
    )
    
    return results

def format_context(results):
    chunks = []
    for match in results["matches"]:
        chunks.append({
            "text": match["metadata"]["text"],
            "source": match["metadata"]["source"],
            "page_number": match["metadata"]["page_number"]
        })
    return {"chunks": chunks}

# Test
if __name__ == "__main__":
    results = retrieve_chunks("Can a player touch the net during play?")
    context = format_context(results)
    
    for i, chunk in enumerate(context["chunks"]):
        print(f"\nChunk {i+1}:")
        print(f"Text: {chunk['text'][:200]}")
        print(f"Source: {chunk['source']}")
        print(f"Page: {chunk['page_number']}")