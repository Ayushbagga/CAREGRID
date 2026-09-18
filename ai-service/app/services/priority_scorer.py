from typing import List, Tuple
from app.schemas.triage import UrgencyTier, DemographicContext

class PriorityScorer:
    """
    Computes a numerical clinical priority score (1 = Immediate Emergency, 10 = Routine)
    and maps it to standardized public healthcare urgency tiers.
    """

    @classmethod
    def calculate_priority(
        cls,
        has_vital_emergency: bool,
        has_symptom_emergency: bool,
        vital_red_flags: List[str],
        symptom_red_flags: List[str],
        vital_anomalies: List[str],
        demographics: DemographicContext
    ) -> Tuple[UrgencyTier, int, bool, str]:
        """
        Returns: (UrgencyTier, priority_score, transport_recommended, rationale)
        """
        total_emergency_flags = len(vital_red_flags) + len(symptom_red_flags)

        # 1. Immediate Emergency Condition
        if has_vital_emergency or has_symptom_emergency or total_emergency_flags >= 2:
            priority_score = 1 if total_emergency_flags >= 2 else 2
            tier = UrgencyTier.EMERGENCY_RED
            transport = True
            rationale = (
                f"Critical urgency identified. Detected {total_emergency_flags} acute physiological "
                f"or clinical red flag(s). Requires immediate medical stabilization and transport."
            )
            return tier, priority_score, transport, rationale

        if total_emergency_flags == 1:
            tier = UrgencyTier.EMERGENCY_RED
            priority_score = 3
            transport = True
            rationale = (
                "High clinical urgency due to solitary acute red flag indicator. "
                "Urgent medical officer review and potential facility transfer indicated."
            )
            return tier, priority_score, transport, rationale

        # 2. Urgent Condition (Amber)
        anomaly_count = len(vital_anomalies)
        is_vulnerable_age = demographics.age_years < 5 or demographics.age_years >= 65
        has_chronic = len(demographics.chronic_conditions) > 0

        if anomaly_count >= 2 or (anomaly_count >= 1 and (is_vulnerable_age or demographics.is_pregnant or has_chronic)):
            tier = UrgencyTier.URGENT_AMBER
            priority_score = 4 if demographics.is_pregnant else 5
            transport = False
            rationale = (
                f"Urgent medical attention indicated. Found {anomaly_count} physiological anomaly/anomalies "
                f"with co-existing vulnerability factors. Recommended evaluation within 24 hours."
            )
            return tier, priority_score, transport, rationale

        if anomaly_count == 1 or demographics.is_pregnant:
            tier = UrgencyTier.URGENT_AMBER
            priority_score = 6
            transport = False
            rationale = (
                "Mild physiological variation or pregnancy monitoring criteria met. "
                "Schedule priority OPD consultation at Primary Health Centre."
            )
            return tier, priority_score, transport, rationale

        # 3. Routine Condition (Green)
        tier = UrgencyTier.ROUTINE_GREEN
        priority_score = 8 if has_chronic else 10
        transport = False
        rationale = (
            "No acute red flags or severe physiological anomalies detected. "
            "Patient is suitable for standard routine OPD visit, health counseling, or routine follow-up."
        )
        return tier, priority_score, transport, rationale
