# import pytest
from app.schemas.triage import (
    TriageAssessmentRequest,
    DemographicContext,
    VitalsInput,
    SymptomEntry,
    UrgencyTier,
    Gender
)
from app.services.triage_engine import TriageEngine

def test_emergency_hypoxia():
    req = TriageAssessmentRequest(
        demographics=DemographicContext(age_years=54, gender=Gender.MALE),
        vitals=VitalsInput(spo2_percentage=86, respiratory_rate_bpm=34, heart_rate_bpm=115),
        symptoms=[SymptomEntry(name="Severe breathlessness", severity="severe")]
    )
    res = TriageEngine.evaluate(req)
    assert res.urgency_tier == UrgencyTier.EMERGENCY_RED
    assert res.transport_recommended is True
    assert res.priority_score <= 2
    assert "hypoxia" in res.detected_red_flags[0].lower() or "tachypnea" in str(res.detected_red_flags).lower()
    assert "does not provide a definitive diagnosis" in res.non_diagnostic_disclaimer.lower()

def test_maternal_pre_eclampsia():
    req = TriageAssessmentRequest(
        demographics=DemographicContext(age_years=24, gender=Gender.FEMALE, is_pregnant=True, gestational_age_weeks=34),
        vitals=VitalsInput(systolic_bp=168, diastolic_bp=114, heart_rate_bpm=92),
        symptoms=[SymptomEntry(name="Severe headache with blurred vision", severity="severe")]
    )
    res = TriageEngine.evaluate(req)
    assert res.urgency_tier == UrgencyTier.EMERGENCY_RED
    assert res.transport_recommended is True
    assert "pre-eclamptic" in str(res.detected_red_flags).lower()
    assert res.recommended_specialty == "Obstetrics & Gynecology (MCH Care)"

def test_routine_patient():
    req = TriageAssessmentRequest(
        demographics=DemographicContext(age_years=32, gender=Gender.FEMALE),
        vitals=VitalsInput(
            systolic_bp=118,
            diastolic_bp=76,
            heart_rate_bpm=72,
            respiratory_rate_bpm=16,
            spo2_percentage=98,
            body_temperature_f=98.6
        ),
        symptoms=[SymptomEntry(name="Mild runny nose", severity="mild", duration_days=2)]
    )
    res = TriageEngine.evaluate(req)
    assert res.urgency_tier == UrgencyTier.ROUTINE_GREEN
    assert res.transport_recommended is False
    assert len(res.detected_red_flags) == 0
    assert res.priority_score >= 8
