import fitz
import os
import re

def is_section_boundary(line):
    number_pattern = r"\d+\.\d+(\.\d+)*"
    caps_pattern = r"^[A-Z]+(\s[A-Z]+)*$"
    
    return re.match(number_pattern, line) or re.match(caps_pattern, line)

def get_all_pdf_paths(folder_path):
    pdf_files = []
    for file in os.listdir(folder_path):
        if file.endswith(".pdf"):
            pdf_files.append(os.path.join(folder_path, file))
    return pdf_files

def extract_pdf_content(pdf_path):
    doc = fitz.open(pdf_path)
    pages_data = []
    
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text()
        pages_data.append({
            "text": text,
            "page_number": page_num,
            "source": os.path.basename(pdf_path)
        })
    
    return pages_data

def extract_all_pdfs(folder_path):
    all_pages = []
    pdf_paths = get_all_pdf_paths(folder_path)
    
    for pdf_path in pdf_paths:
        print(f"Extracting: {os.path.basename(pdf_path)}")
        pages = extract_pdf_content(pdf_path)
        all_pages.extend(pages)
    
    print(f"\nTotal pages extracted from all PDFs: {len(all_pages)}")
    return all_pages

def chunk_text(pages_data, overlap=3):
    chunks = []
    current_chunk = []
    current_source = ""
    current_page = 0
    
    for page in pages_data:
        lines = page['text'].split('\n')
        current_source = page['source']
        current_page = page['page_number']
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if is_section_boundary(line):
                if current_chunk:
                    # Save current chunk
                    chunks.append({
                        "text": "\n".join(current_chunk),
                        "source": current_source,
                        "page_number": current_page
                    })
                    # Overlap — keep last 3 lines
                    current_chunk = current_chunk[-overlap:]
                    
            current_chunk.append(line)
    
    # Don't forget last chunk!
    if current_chunk:
        chunks.append({
            "text": "\n".join(current_chunk),
            "source": current_source,
            "page_number": current_page
        })
    
    return chunks

# Test
if __name__ == "__main__":
    all_data = extract_all_pdfs("data/documents")
    chunks = chunk_text(all_data)
    print(f"Total chunks created: {len(chunks)}")
    print(f"\nFirst chunk preview:")
    print(chunks[0]['text'][:300])