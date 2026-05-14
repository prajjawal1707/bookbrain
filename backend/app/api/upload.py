"""
PDF Upload - Maximum compatibility version
Tries pymupdf, fitz, and pypdf in order
"""
import io
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()
MAX_FILE_SIZE = 20 * 1024 * 1024


@router.post("/")
async def upload_pdf(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large. Max 20MB.")
    if len(file_bytes) < 10:
        raise HTTPException(400, "File is empty.")

    full_text = ""
    num_pages = 0
    method = ""
    errors = []

    # Try 1: pymupdf module name (PyMuPDF 1.24+)
    try:
        import pymupdf
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
        num_pages = len(doc)
        parts = []
        for i in range(num_pages):
            t = doc[i].get_text("text")
            if t and t.strip():
                parts.append(t.strip())
        doc.close()
        full_text = "\n\n".join(parts)
        method = "pymupdf"
    except Exception as e1:
        errors.append(f"pymupdf: {str(e1)}")

        # Try 2: fitz module name (older PyMuPDF)
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            num_pages = len(doc)
            parts = []
            for i in range(num_pages):
                t = doc[i].get_text("text")
                if t and t.strip():
                    parts.append(t.strip())
            doc.close()
            full_text = "\n\n".join(parts)
            method = "fitz"
        except Exception as e2:
            errors.append(f"fitz: {str(e2)}")

            # Try 3: pypdf
            try:
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(file_bytes))
                num_pages = len(reader.pages)
                parts = []
                for page in reader.pages:
                    t = page.extract_text()
                    if t and t.strip():
                        parts.append(t.strip())
                full_text = "\n\n".join(parts)
                method = "pypdf"
            except Exception as e3:
                errors.append(f"pypdf: {str(e3)}")
                raise HTTPException(
                    500,
                    f"All PDF methods failed: {' | '.join(errors)}"
                )

    if not full_text or len(full_text.strip()) < 50:
        raise HTTPException(
            400,
            "No text could be extracted. This PDF may be scanned/image-based. "
            "Please use Paste Text mode instead."
        )

    suggested_title = (
        filename.rsplit(".", 1)[0]
        .replace("-", " ")
        .replace("_", " ")
        .strip()
        .title()
    )

    word_count = len(full_text.split())

    return {
        "status": "success",
        "filename": filename,
        "suggested_title": suggested_title,
        "extracted_text": full_text,
        "stats": {
            "num_pages": num_pages,
            "total_chars": len(full_text),
            "word_count": word_count,
            "estimated_reading_pages": max(1, word_count // 250),
        },
        "method": method,
        "message": f"Extracted {word_count:,} words from {num_pages} pages."
    }