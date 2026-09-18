from typing import List, Tuple
from app.schemas.triage import VitalsInput, DemographicContext, SymptomEntry

class RedFlagDetector:
    """
    Identifies clinical emergency red flags and physiological vital anomalies
    strictly conforming to Indian Public Health Standards (IPHS) and WHO ETAT protocols.
    """

    CRITICAL_SYMPTOM_KEYWORDS = {
        "chest_pain": "Acute Chest Pain / Anginal Discomfort",
        "breathlessness": "Severe Respiratory Distress / Dyspnea",
        "convulsion": "Active Convulsions / Seizure",
        "unconscious": "Altered Sensorium / Unconsciousness",
        "bleeding": "Acute Severe Hemorrhage",
        "head_injury": "Severe Head Trauma / Concussion",
        "paralysis": "Acute Focal Neurological Deficit / Stroke-like symptoms",
        "severe_burn": "Major Burn Injury",
        "snake_bite": "Suspected Venomous Snake Bite"
    }

    MATERNAL_DANGER_KEYWORDS = {
        "vaginal_bleeding": "Antepartum / Postpartum Vaginal Bleeding",
        "severe_headache_blur": "Severe Headache with Visual Disturbance in Pregnancy",
        "epigastric_pain": "Severe Epigastric Pain in Third Trimester",
        "decreased_fetal_movement": "Absence or Marked Reduction of Fetal Movements",
        "water_breaking": "Premature Rupture of Membranes"
    }

    @classmethod
    def evaluate_vitals(
        cls, vitals: VitalsInput, demographics: DemographicContext
    ) -> Tuple[List[str], List[str], bool]:
        """
        Evaluates vital signs against clinical boundaries.
        Returns: (red_flags, vital_anomalies, is_emergency)
        """
        red_flags: List[str] = []
        anomalies: List[str] = []
        is_emergency = False

        if not vitals:
            return red_flags, anomalies, is_emergency

        # 1. Oxygen Saturation (SpO2)
        if vitals.spo2_percentage is not None:
            if vitals.spo2_percentage < 90:
                red_flags.append(f"Severe Hypoxia: SpO2 is {vitals.spo2_percentage}% (< 90%)")
                is_emergency = True
            elif vitals.spo2_percentage <= 93:
                anomalies.append(f"Sub-optimal Oxygenation: SpO2 is {vitals.spo2_percentage}% (90-93%)")

        # 2. Blood Pressure
        if vitals.systolic_bp is not None:
            if vitals.systolic_bp >= 180:
                red_flags.append(f"Hypertensive Crisis: Systolic BP {vitals.systolic_bp} mmHg (>= 180)")
                is_emergency = True
            elif vitals.systolic_bp < 80:
                red_flags.append(f"Severe Hypotension / Shock Index: Systolic BP {vitals.systolic_bp} mmHg (< 80)")
                is_emergency = True
            elif vitals.systolic_bp >= 140:
                anomalies.append(f"Elevated Systolic BP: {vitals.systolic_bp} mmHg")

        if vitals.diastolic_bp is not None:
            if vitals.diastolic_bp >= 120:
                red_flags.append(f"Severe Diastolic Hypertension: {vitals.diastolic_bp} mmHg (>= 120)")
                is_emergency = True
            elif vitals.diastolic_bp < 50:
                red_flags.append(f"Critical Diastolic Hypotension: {vitals.diastolic_bp} mmHg (< 50)")
                is_emergency = True
            elif vitals.diastolic_bp >= 90:
                anomalies.append(f"Elevated Diastolic BP: {vitals.diastolic_bp} mmHg")

        # Maternal specific BP check (Pre-eclampsia: BP >= 140/90 in pregnancy, severe >= 160/110)
        if demographics.is_pregnant:
            sys = vitals.systolic_bp or 0
            dia = vitals.diastolic_bp or 0
            if sys >= 160 or dia >= 110:
                red_flags.append(f"Obstetric Red Flag: Severe Pre-Eclamptic Range BP ({sys}/{dia} mmHg)")
                is_emergency = True
            elif sys >= 140 or dia >= 90:
                anomalies.append(f"Obstetric Alert: Gestational Hypertension ({sys}/{dia} mmHg)")

        # 3. Heart Rate
        if vitals.heart_rate_bpm is not None:
            if vitals.heart_rate_bpm > 130:
                red_flags.append(f"Severe Tachycardia: Heart rate {vitals.heart_rate_bpm} bpm (> 130)")
                is_emergency = True
            elif vitals.heart_rate_bpm < 40:
                red_flags.append(f"Severe Bradycardia: Heart rate {vitals.heart_rate_bpm} bpm (< 40)")
                is_emergency = True
            elif vitals.heart_rate_bpm > 100:
                anomalies.append(f"Tachycardia: Heart rate {vitals.heart_rate_bpm} bpm")

        # 4. Respiratory Rate
        if vitals.respiratory_rate_bpm is not None:
            if vitals.respiratory_rate_bpm >= 32:
                red_flags.append(f"Severe Tachypnea: {vitals.respiratory_rate_bpm} breaths/min (>= 32)")
                is_emergency = True
            elif vitals.respiratory_rate_bpm < 8:
                red_flags.append(f"Bradypnea / Respiratory Depression: {vitals.respiratory_rate_bpm} breaths/min (< 8)")
                is_emergency = True
            elif vitals.respiratory_rate_bpm > 22:
                anomalies.append(f"Tachypnea: {vitals.respiratory_rate_bpm} breaths/min")

        # 5. Temperature
        if vitals.body_temperature_f is not None:
            if vitals.body_temperature_f >= 104.0:
                red_flags.append(f"Hyperpyrexia: Temperature {vitals.body_temperature_f}°F (>= 104°F)")
                is_emergency = True
            elif vitals.body_temperature_f < 95.0:
                red_flags.append(f"Hypothermia: Temperature {vitals.body_temperature_f}°F (< 95°F)")
                is_emergency = True
            elif vitals.body_temperature_f >= 101.0:
                anomalies.append(f"Pyrexia / Fever: {vitals.body_temperature_f}°F")

        # 6. Fetal Heart Rate (Obstetric monitoring)
        if demographics.is_pregnant and vitals.fetal_heart_rate_bpm is not None:
            if vitals.fetal_heart_rate_bpm < 110:
                red_flags.append(f"Critical Fetal Distress: FHR {vitals.fetal_heart_rate_bpm} bpm (< 110)")
                is_emergency = True
            elif vitals.fetal_heart_rate_bpm > 160:
                red_flags.append(f"Fetal Tachycardia: FHR {vitals.fetal_heart_rate_bpm} bpm (> 160)")
                is_emergency = True

        return red_flags, anomalies, is_emergency

    @classmethod
    def evaluate_symptoms(
        cls, symptoms: List[SymptomEntry], demographics: DemographicContext
    ) -> Tuple[List[str], bool]:
        """
        Evaluates symptom list for urgent or life-threatening presentations.
        """
        danger_signs: List[str] = []
        is_emergency = False

        for s in symptoms:
            name_lower = s.name.lower()

            for key, label in cls.CRITICAL_SYMPTOM_KEYWORDS.items():
                if key in name_lower or any(word in name_lower for word in key.split("_")):
                    danger_signs.append(f"Critical Danger Sign: {label}")
                    is_emergency = True

            if demographics.is_pregnant:
                for key, label in cls.MATERNAL_DANGER_KEYWORDS.items():
                    if key in name_lower or any(word in name_lower for word in key.split("_")):
                        danger_signs.append(f"Obstetric Emergency Sign: {label}")
                        is_emergency = True

            if s.severity.lower() == "severe" and "pain" in name_lower:
                danger_signs.append(f"Severe Unrelenting Pain: {s.name}")

        return danger_signs, is_emergency
