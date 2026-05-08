from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyzeBookRequest
from app.core.text_processor import TextProcessor
from app.core.extraction_engine import ExtractionEngine
from app.services.package_store import store

router    = APIRouter()
processor = TextProcessor()
engine    = ExtractionEngine()


@router.post("/")
async def analyze_book(req: AnalyzeBookRequest):
    if len(req.text.strip()) < 300:
        raise HTTPException(400, "Text must be at least 300 characters.")

    cleaned = processor.clean(req.text)
    stats   = processor.get_text_stats(cleaned)
    chunks  = processor.split_into_chunks(cleaned)

    if not chunks:
        raise HTTPException(400, "Could not parse any content from the provided text.")

    extracted = await engine.extract_all(
        chunks=chunks,
        title=req.title,
        author=req.author or "Unknown",
        depth=req.extraction_depth,
    )

    # Optional focus-area filtering
    if req.focus_areas:
        focus_map = {
            "principles": ["philosophy", "strategy", "ethics"],
            "tactics":    ["tactics", "power_dynamics"],
            "philosophy": ["philosophy", "ethics"],
            "warnings":   [],
        }
        keep = set()
        for area in req.focus_areas:
            keep.update(focus_map.get(area, []))
        if keep:
            extracted["principles"] = [
                p for p in extracted["principles"] if p.get("category") in keep
            ]

    package = {
        "book_title":               req.title,
        "author":                   req.author,
        "summary":                  extracted.get("summary", ""),
        "philosophical_framework":  extracted.get("philosophical_framework", {}),
        "principles":               extracted.get("principles", []),
        "behavioral_guidelines":    extracted.get("behavioral_guidelines", []),
        "cautions":                 extracted.get("cautions", []),
        "total_principles_extracted": len(extracted.get("principles", [])),
        "extraction_depth":         req.extraction_depth,
        "metadata": {
            "text_stats":       stats,
            "chunks_processed": len(chunks),
            "focus_areas":      req.focus_areas,
        },
    }

    pkg_id = store.save(package)
    return {
        "status":     "success",
        "package_id": pkg_id,
        "message":    f"Extracted {package['total_principles_extracted']} principles from '{req.title}'",
        "package":    {**package, "id": pkg_id},
        "text_stats": stats,
    }
