from fastapi import APIRouter, HTTPException
from app.services.package_store import store
from app.core.ai_client import get_provider_info

router = APIRouter()


@router.get("/health")
async def health():
    provider = await get_provider_info()
    return {
        "status":           "healthy",
        "service":          "BookBrain API",
        "version":          "2.0.0",
        "ai_provider":      provider,
        "packages_stored":  store.count,
    }


@router.get("/packages")
async def list_packages():
    return {"packages": store.list_all(), "total": store.count}


@router.delete("/packages/{pkg_id}")
async def delete_package(pkg_id: str):
    if store.delete(pkg_id):
        return {"status": "deleted", "id": pkg_id}
    raise HTTPException(404, f"Package '{pkg_id}' not found")
