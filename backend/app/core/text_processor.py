import re, hashlib
from typing import List, Dict
from dataclasses import dataclass


@dataclass
class TextChunk:
    index: int
    text: str
    char_start: int
    char_end: int


class TextProcessor:
    def __init__(self, chunk_size: int = 1500, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def clean(self, text: str) -> str:
        text = re.sub(r"\n\s*\d{1,4}\s*\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]{2,}", " ", text)
        text = re.sub(r"[^\x00-\x7F]+", " ", text)
        return "\n".join(l.strip() for l in text.split("\n")).strip()

    def split_into_chunks(self, text: str) -> List[TextChunk]:
        paragraphs = re.split(r"\n\n+", text)
        chunks, current, start, pos = [], "", 0, 0
        for para in paragraphs:
            plen = len(para) + 2
            if len(current) + plen > self.chunk_size and current:
                chunks.append(TextChunk(len(chunks), current.strip(), start, pos))
                overlap = current[-self.overlap:]
                start = pos - len(overlap)
                current = overlap + "\n\n" + para
            else:
                current += ("\n\n" + para if current else para)
            pos += plen
        if current.strip():
            chunks.append(TextChunk(len(chunks), current.strip(), start, pos))
        return chunks

    def get_text_stats(self, text: str) -> Dict:
        words = text.split()
        return {
            "char_count": len(text),
            "word_count": len(words),
            "sentence_count": len([s for s in re.split(r"[.!?]+", text) if s.strip()]),
            "paragraph_count": len([p for p in re.split(r"\n\n+", text) if p.strip()]),
            "estimated_pages": max(1, len(words) // 250),
        }

    def compute_hash(self, text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()[:12]
