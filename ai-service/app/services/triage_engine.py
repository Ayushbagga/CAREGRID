from datetime import datetime, timezone
from typing import Optional
from app.config import settings
from app.schemas.triage import (
    TriageAssessmentRequest,
    TriageAssessmentResponse,
    UrgencyTier
)
from app.services.red_flag_detector import RedFlagDetector
from app.services.priority_scorer import PriorityScorer

class TriageEngine:
    """
    Main orchestration service for clinical decision support.
    Synthesizes vitals, symptoms, and demographic context into standardized triage outputs.
    Strictly non-diagnostic decision support for healthcare workers and doctors.
    """

    @classmethod
    def determine_recommended_specialty(
        cls, request: TriageAssessmentRequest, tier: UrgencyTier, all_red_flags: list
    ) -> Optional[str]:
        """Suggests appropriate public health medical specialty based on clinical signals."""
        if request.demographics.is_pregnant:
            return "Obstetrics & Gynecology (Maternal Health)"
        if request.demographics.age_years < 12:
            return "Pediatrics"

        flags_text = " ".join(all_red_flags).lower()
        symptom_text = " ".join([s.name.lower() for s in request.symptoms])
        combined = f"{flags_text} {symptom_text}"

        if any(w in combined for w in ["chest pain", "anginal", "tachycardia", "hypotension", "shock"]):
            return "Emergency Medicine / General Medicine"
        if any(w in combined for w in ["hypoxia", "breathlessness", "respiratory", "tachypnea"]):
            return "Respiratory Medicine / Critical Care"
        if any(w in combined for w in ["convulsion", "unconscious", "stroke", "paralysis"]):
            return "Neurology / Emergency Medicine"
        if any(w in combined for w in ["trauma", "head injury", "fracture", "burn"]):
            return "General Surgery"

        return "General Medicine (Primary Health Centre OPD)"

    @classmethod
    def generate_recommended_action(
        cls, tier: UrgencyTier, transport_recommended: bool, specialty: Optional[str]
    ) -> str:
        """Provides actionable guidance for rural front-line workers and medical officers."""
        if tier == UrgencyTier.EMERGENCY_RED:
            transfer_notice = "Initiate immediate facility transfer protocol. " if transport_recommended else ""
            return (
                f"{transfer_notice}Urgent Medical Officer evaluation required. "
                f"Notify receiving facility ({specialty or 'Secondary/Tertiary Hospital'}) of incoming high-urgency patient. "
                "Keep patient monitored and in recovery position."
            )
        elif tier == UrgencyTier.URGENT_AMBER:
            return (
                f"Fast-track patient to Primary Health Centre Medical Officer for {specialty or 'clinical review'} "
                "within 24 to 48 hours. Monitor vital signs and re-evaluate if symptoms progress."
            )
        else:
            return (
                "Enroll in routine OPD consultation queue. Provide standard health counseling, "
                "and schedule routine community health worker follow-up visit."
            )

    @classmethod
    def evaluate(cls, request: TriageAssessmentRequest) -> TriageAssessmentResponse:
        """
        Executes clinical priority evaluation with non-diagnostic guarantees.
        """
        # 1. Evaluate vital signs
        vital_red_flags, vital_anomalies, has_vital_emergency = (
            RedFlagDetector.evaluate_vitals(request.vitals, request.demographics)
        )

        # 2. Evaluate symptoms
        symptom_red_flags, has_symptom_emergency = (
            RedFlagDetector.evaluate_symptoms(request.symptoms, request.demographics)
        )

        # 3. Calculate priority score and tier
        tier, priority_score, transport, rationale = PriorityScorer.calculate_priority(
            has_vital_emergency=has_vital_emergency,
            has_symptom_emergency=has_symptom_emergency,
            vital_red_flags=vital_red_flags,
            symptom_red_flags=symptom_red_flags,
            vital_anomalies=vital_anomalies,
            demographics=request.demographics
        )

        all_red_flags = vital_red_flags + symptom_red_flags
        specialty = cls.determine_recommended_specialty(request, tier, all_red_flags)
        action = cls.generate_recommended_action(tier, transport, specialty)

        return TriageAssessmentResponse(
            urgency_tier=tier,
            priority_score=priority_score,
            detected_red_flags=all_red_flags,
            vital_anomalies=vital_anomalies,
            transport_recommended=transport,
            recommended_specialty=specialty,
            recommended_action=action,
            clinical_rationale=rationale,
            non_diagnostic_disclaimer=settings.DISCLAIMER_TEXT,
            model_version=settings.MODEL_VERSION,
            assessed_at=datetime.now(timezone.utc)
        )
