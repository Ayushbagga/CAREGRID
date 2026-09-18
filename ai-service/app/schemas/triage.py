from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class UrgencyTier(str, Enum):
    EMERGENCY_RED = "emergency_red"
    URGENT_AMBER = "urgent_amber"
    ROUTINE_GREEN = "routine_green"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class VitalsInput(BaseModel):
    systolic_bp: Optional[int] = Field(None, ge=40, le=300, description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: Optional[int] = Field(None, ge=20, le=200, description="Diastolic Blood Pressure (mmHg)")
    heart_rate_bpm: Optional[int] = Field(None, ge=20, le=300, description="Heart Rate (beats/min)")
    respiratory_rate_bpm: Optional[int] = Field(None, ge=4, le=100, description="Respiratory Rate (breaths/min)")
    spo2_percentage: Optional[int] = Field(None, ge=30, le=100, description="Oxygen Saturation SpO2 (%)")
    body_temperature_f: Optional[float] = Field(None, ge=80.0, le=115.0, description="Body Temperature (°F)")
    random_blood_glucose_mg_dl: Optional[int] = Field(None, ge=10, le=1000, description="Random Blood Glucose (mg/dL)")
    fetal_heart_rate_bpm: Optional[int] = Field(None, ge=40, le=240, description="Fetal Heart Rate for pregnant patients (bpm)")

class SymptomEntry(BaseModel):
    name: str = Field(..., description="Standardized or free-text symptom description")
    severity: str = Field("moderate", description="'mild', 'moderate', or 'severe'")
    duration_days: Optional[int] = Field(None, ge=0, description="Duration in days")

class DemographicContext(BaseModel):
    age_years: int = Field(..., ge=0, le=130, description="Patient age in completed years")
    gender: Gender
    is_pregnant: bool = False
    gestational_age_weeks: Optional[int] = Field(None, ge=1, le=44)
    chronic_conditions: List[str] = Field(default_factory=list)

class TriageAssessmentRequest(BaseModel):
    patient_id: Optional[str] = None
    encounter_id: Optional[str] = None
    demographics: DemographicContext
    vitals: Optional[VitalsInput] = None
    symptoms: List[SymptomEntry] = Field(default_factory=list)
    clinical_observations: Optional[str] = None

class TriageAssessmentResponse(BaseModel):
    urgency_tier: UrgencyTier
    priority_score: int = Field(..., ge=1, le=10, description="Priority rating: 1 (Emergency) to 10 (Routine)")
    detected_red_flags: List[str]
    vital_anomalies: List[str]
    transport_recommended: bool
    recommended_specialty: Optional[str] = None
    recommended_action: str
    clinical_rationale: str
    non_diagnostic_disclaimer: str
    model_version: str
    assessed_at: datetime
