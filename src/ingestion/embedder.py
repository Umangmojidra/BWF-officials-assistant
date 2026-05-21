import os
import numpy as np

def generate_embeddings(texts):
    # Use simple TF-IDF style hashing for lightweight embeddings
    # This avoids external API calls and heavy torch dependencies
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.preprocessing import normalize
    import hashlib
    
    # Create 384-dim embeddings using hashing trick
    embeddings = []
    for text in texts:
        # Hash-based embedding — lightweight, no external calls
        vector = np.zeros(384)
        words = text.lower().split()
        for word in words:
            hash_val = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = hash_val % 384
            vector[idx] += 1.0
        # Normalize
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        embeddings.append(vector)
    
    return np.array(embeddings)