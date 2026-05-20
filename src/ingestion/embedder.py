import os
import requests
import numpy as np
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
HEADERS = {"Authorization": f"Bearer {os.getenv('HF_TOKEN')}"}

def generate_embeddings(texts):
    response = requests.post(
        API_URL,
        headers=HEADERS,
        json={"inputs": texts, "options": {"wait_for_model": True}}
    )
    embeddings = np.array(response.json())
    return embeddings