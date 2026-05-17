import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.ingestion.embedder import generate_embeddings
from src.ingestion.vector_store import get_collection



def retrieve_chunks(query):
    embeddings = generate_embeddings([query])
    collections = get_collection()
    results = collections.query(
        query_embeddings= [embeddings[0].tolist()],
        n_results = 3
    )

    return results


def format_context(results):
    chunks = []

    for doc, meta, in zip(results['documents'][0],results['metadatas'][0]):
        chunks.append({
            "text": doc,
            "source" : meta['source'],
            "page_number" : meta['page_number'] 
        })
    return {"chunks": chunks}

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    
    results = retrieve_chunks("Can a player touch the net during play?")
    context = format_context(results)
    
    for i, chunk in enumerate(context['chunks']):
        print(f"\nChunk {i+1}:")
        print(f"Text: {chunk['text'][:200]}")
        print(f"Source: {chunk['source']}")
        print(f"Page: {chunk['page_number']}")