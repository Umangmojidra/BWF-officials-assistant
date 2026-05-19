import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.ingestion.pdf_parser import extract_all_pdfs, chunk_text
from src.ingestion.embedder import generate_embeddings
from src.ingestion.vector_store import store_chunks

def run_ingestion():
    print("Step 1 — Extracting PDFs...")
    all_data = extract_all_pdfs("data/documents")
    
    print("Step 2 — Chunking text...")
    chunks = chunk_text(all_data)
    print(f"Total chunks: {len(chunks)}")
    
    print("Step 3 — Generating embeddings...")
    texts = [chunk["text"] for chunk in chunks]
    embeddings = generate_embeddings(texts)
    print(f"Embeddings shape: {embeddings.shape}")
    
    print("Step 4 — Uploading to Pinecone...")
    store_chunks(chunks, embeddings)
    
    print("\n✅ Ingestion complete!")

if __name__ == "__main__":
    run_ingestion()