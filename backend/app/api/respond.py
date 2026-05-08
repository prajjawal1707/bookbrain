from fastapi import APIRouter, HTTPException
from app.models.schemas import RespondRequest
from app.core.extraction_engine import ExtractionEngine
from app.services.package_store import store

router = APIRouter()
engine = ExtractionEngine()


@router.post("/")
async def respond(req: RespondRequest):
    if not req.user_query.strip():
        raise HTTPException(400, "user_query cannot be empty.")

    # Resolve package
    package = req.behavior_package
    if not package and req.behavior_package_id:
        package = store.get(req.behavior_package_id)
        if not package:
            raise HTTPException(404, f"Package '{req.behavior_package_id}' not found.")
    if not package:
        raise HTTPException(400, "Provide 'behavior_package_id' or 'behavior_package'.")

    result = await engine.generate_response(
        query=req.user_query,
        package=package,
        persona=req.persona,
        style=req.response_style,
    )

    return {
        "status":         "success",
        "query":          req.user_query,
        "ai_response":    result,
        "response_style": req.response_style,
    }
