from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import healthcheck, triage

app = FastAPI(
    title="CAREGRID AI Clinical Triage & Decision Assist Service",
    description=(
        "**CAREGRID Clinical Decision Support Microservice**\n\n"
        "Engineered for Smart India Hackathon (SIH26133) in collaboration with the "
        "Government of Maharashtra (Public Health Department / Arogya Vibhag).\n\n"
        "### 🛡️ Mandatory Clinical Policy & Non-Diagnostic Guarantee:\n"
        "- This service assists front-line health workers (ASHAs/ANMs) and medical officers by "
        "calculating clinical urgency priority tiers (`emergency_red`, `urgent_amber`, `routine_green`).\n"
        "- It **DOES NOT** diagnose diseases or prescribe treatments.\n"
        "- All medical interventions remain the legal and professional responsibility of licensed healthcare personnel."
    ),
    version=settings.MODEL_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(healthcheck.router, prefix="/api/v1")
app.include_router(triage.router, prefix="/api/v1/triage")

@app.get("/", tags=["Root"])
async def root():
    return {
        "project": "CAREGRID",
        "service": "AI Clinical Decision Support Microservice",
        "jurisdiction": "Government of Maharashtra",
        "problem_statement": "SIH26133",
        "non_diagnostic_policy": "STRICTLY_ENFORCED",
        "documentation": "/docs"
    }
