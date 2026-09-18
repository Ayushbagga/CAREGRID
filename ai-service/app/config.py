from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"
    API_KEY: str = "caregrid-internal-dev-key-change-in-prod"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    MODEL_VERSION: str = "caregrid-triage-v1.0"
    DISCLAIMER_TEXT: str = (
        "CAREGRID Clinical Triage Assist is an assistive decision-support tool designed "
        "to assist certified healthcare workers in prioritizing clinical urgency. "
        "It does NOT provide a definitive diagnosis or replace examination by a licensed medical officer."
    )

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
