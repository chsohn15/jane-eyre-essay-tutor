import re

def load_text(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def strip_gutenberg(text):
    start = "There was no possibility of taking a walk that day."
    end = "*** END OF THE PROJECT GUTENBERG EBOOK 1260 ***"
    start_idx = text.index(start)
    end_idx = text.index(end)
    return text[start_idx:end_idx].strip()

def split_into_chapters(text):
    pattern = r'(CHAPTER [IVXLC]+)'
    parts = re.split(pattern, text)
    chapters = []
    for i in range(1, len(parts), 2):
        heading = parts[i].strip()
        body = parts[i+1].strip() if i+1 < len(parts) else ""
        chapters.append({ "heading": heading, "body": body })
    return chapters

def split_into_chunks(chapters):
    chunks = []
    for chapter in chapters:
        paragraphs = [p.strip().replace('\n', ' ').replace('_', '') for p in chapter["body"].split('\n\n') if len(p.strip()) > 300]
        for i, paragraph in enumerate(paragraphs):
            context_before = paragraphs[i - 1] if i > 0 else ""
            context_after = paragraphs[i + 1] if i < len(paragraphs) - 1 else ""
            chunks.append({
                "text": paragraph,
                "chapter": chapter["heading"],
                "paragraph": i + 1,
                "context_before": context_before,
                "context_after": context_after
            })
    return chunks

if __name__ == "__main__":
    raw = load_text("jane_eyre.txt")
    clean = strip_gutenberg(raw)
    chapters = split_into_chapters(clean)
    chunks = split_into_chunks(chapters)
    
    print(f"Total chapters: {len(chapters)}")
    print(f"Total chunks: {len(chunks)}")
    print("\n--- Sample chunk ---")
    print(chunks[0])
    print("\n--- Sample chunk from later ---")
    print(chunks[100])
    print("\n--- Sample chunk from near the end ---")
    print(chunks[-10])