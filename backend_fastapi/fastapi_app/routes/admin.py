from fastapi import APIRouter
router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/stats", summary="Get System Stats")
async def get_stats():
    """FastAPI system statistics endpoint"""
    return {"message": "Admin stats - See Django admin panel for full functionality"}
