from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')


def generate_embeddings(text):
    embeddings = model.encode(text)
    return embeddings

if __name__ == "__main__":
    sample = ["Player touches the net during play",
              "Shuttle landing outside court is out"]
    result = generate_embeddings(sample)
    print(f"Embedding shape: {result.shape}")
    print(f"First 5 values: {result[0][:5]}")