from fastapi import APIRouter, HTTPException, Header, status
from typing import Optional
from app.config import settings
from app.schemas.triage import TriageAssessmentRequest, TriageAssessmentResponse
from app.services.triage_engine import TriageEngine

router = APIRouter()

@router.post(
    "/assess",
    response_model=TriageAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute clinical urgency tier and triage priority (Non-Diagnostic)",
    description=(
        "Evaluates vital signs, symptoms, and demographic context according to Indian Public Health "
        "Standards (IPHS) and WHO ETAT protocols. This endpoint provides assistive decision support ONLY "
        "and does not produce a medical diagnosis."
    ),
    tags=["Clinical Triage Assist"]
)
async def assess_triage(
    payload: TriageAssessmentRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    # Authenticate internal API calls if API_KEY is set in environment
    if settings.ENVIRONMENT == "production" and x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key header"
        )

    try:
        response = TriageEngine.evaluate(payload)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical decision engine evaluation error: {str(e)}"
        )
