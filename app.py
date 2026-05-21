from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.retrieval.retriever import retrieve_chunks, format_context
from src.chat.claude_client import get_ruling

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"status": "BWF Officials Chatbot API is running!"})

@app.route('/debug')
def debug():
    return jsonify({
        "pinecone_key_exists": bool(os.getenv("PINECONE_API_KEY")),
        "pinecone_key_prefix": os.getenv("PINECONE_API_KEY", "")[:8],
        "pinecone_index": os.getenv("PINECONE_INDEX")
    })

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    query = data.get('query', '')

    if not query:
        return jsonify({"error": "No question provided"}), 400

    results = retrieve_chunks(query)
    context = format_context(results)
    ruling = get_ruling(query, context)

    return jsonify({
        "query": query,
        "ruling": ruling
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)