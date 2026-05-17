import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

def load_system_prompt():
    with open("src/chat/system_prompt.txt", "r") as f:
        return f.read()
    
def build_user_message(query, context):
    chunks_text = ""
    
    for i, chunk in enumerate(context['chunks']):
        chunks_text += f"""
---
Rule {i+1}: {chunk['text']}
Source: {chunk['source']}, Page {chunk['page_number']}
---"""
    
    message = f"""User Question: {query}

Relevant BWF Rules:
{chunks_text}"""
    
    return message

def get_ruling(query, context):
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    system_prompt = load_system_prompt()
    user_message = build_user_message(query, context)
    
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system_prompt,
        messages=[
            {"role": "user", "content": user_message}
        ]
    )
    
    return response.content[0].text

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    
    from src.retrieval.retriever import retrieve_chunks, format_context
    
    query = "Can a player touch the net during play?"
    results = retrieve_chunks(query)
    context = format_context(results)
    
    ruling = get_ruling(query, context)
    print(ruling)