import os
import numpy as np
import hashlib

def generate_embeddings(texts):
    embeddings = []
    for text in texts:
        vector = np.zeros(384)
        words = text.lower().split()
        for word in words:
            hash_val = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = hash_val % 384
            vector[idx] += 1.0
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        embeddings.append(vector)
    return np.array(embeddings)