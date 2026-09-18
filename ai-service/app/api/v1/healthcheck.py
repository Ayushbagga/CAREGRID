from fastapi import APIRouter
from app.config import settings

router = APIRouter()

@router.get("/healthcheck", tags=["Health"])
async def healthcheck():
    return {
        "status": "healthy",
        "service": "caregrid-ai-triage",
        "version": settings.MODEL_VERSION,
        "environment": settings.ENVIRONMENT,
        "non_diagnostic_policy": "enforced"
    }
