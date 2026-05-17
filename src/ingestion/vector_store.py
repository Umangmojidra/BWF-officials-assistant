import chromadb
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from src.ingestion.embedder import generate_embeddings

def get_collection():
    client = chromadb.PersistentClient(path="data/vectorstore")
    collection = client.get_or_create_collection(
        name="BWF_Laws_and_Guidelines"
    )
    return collection

def store_chunks(chunks):
    collection = get_collection()
    texts = [chunk['text'] for chunk in chunks]
    embeddings = generate_embeddings(texts)
    
    for index, chunk in enumerate(chunks):
        id = f"chunk_{index}"
        collection.add(
            ids=[id],
            embeddings=[embeddings[index].tolist()],
            documents=[chunk['text']],
            metadatas=[{
                "source": chunk['source'],
                "page_number": chunk['page_number']
            }]
        )
    
    print(f"Stored {len(chunks)} chunks in ChromaDB")
    
    
if __name__ == "__main__":
    from src.ingestion.pdf_parser import extract_all_pdfs, chunk_text
    all_data = extract_all_pdfs("data/documents")
    chunks = chunk_text(all_data)
    store_chunks(chunks)