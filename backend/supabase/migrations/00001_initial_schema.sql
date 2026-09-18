-- ==============================================================================
-- CAREGRID: Migration 00001 - Initial Schema
-- SIH26133: Accessibility & Quality of Public Healthcare in Rural/Underserved Areas
-- Target: Government of Maharashtra (Public Health Department)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Custom Enum Types
-- ------------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'citizen',
        'asha_worker',
        'anm_worker',
        'medical_officer',
        'specialist_doctor',
        'pharmacist',
        'lab_technician',
        'facility_admin',
        'district_officer',
        'state_admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE facility_type AS ENUM (
        'sub_centre',
        'phc',
        'chc',
        'rural_hospital',
        'sub_district_hosp',
        'district_hospital',
        'medical_college'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE urgency_tier AS ENUM (
        'emergency_red',
        'urgent_amber',
        'routine_green'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE referral_status AS ENUM (
        'initiated',
        'in_transit',
        'acknowledged',
        'evaluated',
        'admitted',
        'discharged',
        'closed_loop'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
        'scheduled',
        'in_queue',
        'in_consultation',
        'completed',
        'cancelled',
        'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Facilities Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    facility_type facility_type NOT NULL,
    district TEXT NOT NULL,
    taluka TEXT NOT NULL,
    village TEXT,
    pincode TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    total_beds INTEGER DEFAULT 0,
    available_beds INTEGER DEFAULT 0,
    contact_number TEXT,
    emergency_ambulance_number TEXT DEFAULT '108',
    specialties_available JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. Profiles Table (Linked to auth.users in Supabase)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'citizen',
    full_name TEXT NOT NULL,
    phone_number TEXT,
    preferred_language TEXT DEFAULT 'mr',
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    assigned_district TEXT,
    assigned_taluka TEXT,
    assigned_village TEXT,
    registration_number TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. Patients Table (Demographics & Master Health Identity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abha_id TEXT UNIQUE,
    national_id_hash TEXT,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    estimated_age INTEGER,
    gender TEXT NOT NULL,
    blood_group TEXT,
    primary_phone TEXT,
    emergency_contact_phone TEXT,
    village TEXT NOT NULL,
    taluka TEXT NOT NULL,
    district TEXT NOT NULL,
    assigned_asha_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    primary_facility_id UUID REFERENCES facilities(id) ON DELETE RESTRICT,
    is_pregnant BOOLEAN DEFAULT FALSE,
    gestational_age_weeks INTEGER,
    high_risk_pregnancy BOOLEAN DEFAULT FALSE,
    chronic_conditions TEXT[] DEFAULT '{}',
    known_allergies TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. Encounters Table (Clinical visits & field interactions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    encounter_type TEXT NOT NULL, -- 'asha_home_visit', 'phc_opd', 'teleconsultation', 'emergency'
    chief_complaints JSONB DEFAULT '[]'::jsonb,
    clinical_notes TEXT,
    provisional_observations TEXT,
    encounter_date TIMESTAMPTZ DEFAULT NOW(),
    is_synced_from_offline BOOLEAN DEFAULT FALSE,
    client_offline_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. Vitals Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    heart_rate_bpm INTEGER,
    respiratory_rate_bpm INTEGER,
    spo2_percentage INTEGER,
    body_temperature_f NUMERIC(4, 1),
    random_blood_glucose_mg_dl INTEGER,
    weight_kg NUMERIC(5, 2),
    height_cm NUMERIC(5, 2),
    fetal_heart_rate_bpm INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. Triage Assessments Table (AI-Assisted, Strictly Non-Diagnostic)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS triage_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    urgency_tier urgency_tier NOT NULL,
    priority_score INTEGER NOT NULL CHECK (priority_score BETWEEN 1 AND 10),
    detected_red_flags JSONB DEFAULT '[]'::jsonb,
    vital_anomalies JSONB DEFAULT '[]'::jsonb,
    transport_recommended BOOLEAN DEFAULT FALSE,
    recommended_specialty TEXT,
    clinical_rationale TEXT NOT NULL,
    non_diagnostic_disclaimer_version TEXT NOT NULL,
    clinician_acknowledged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    clinician_overridden_tier urgency_tier,
    model_version TEXT NOT NULL DEFAULT 'caregrid-triage-v1.0',
    assessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. Referrals Table (Closed-Loop Transfer Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code TEXT UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    from_facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    to_facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    referring_officer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    receiving_doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    referral_reason TEXT NOT NULL,
    required_specialty TEXT NOT NULL,
    urgency_tier urgency_tier NOT NULL DEFAULT 'urgent_amber',
    transport_arranged BOOLEAN DEFAULT FALSE,
    ambulance_tracking_code TEXT,
    status referral_status NOT NULL DEFAULT 'initiated',
    admission_date TIMESTAMPTZ,
    discharge_date TIMESTAMPTZ,
    discharge_summary TEXT,
    post_discharge_instructions_for_asha TEXT,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. Appointments & OPD Queue Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    token_number INTEGER NOT NULL,
    queue_tier urgency_tier NOT NULL DEFAULT 'routine_green',
    appointment_type TEXT NOT NULL DEFAULT 'physical_opd', -- 'physical_opd' | 'rural_teleconsultation'
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_slot TEXT,
    status appointment_status NOT NULL DEFAULT 'in_queue',
    webrtc_room_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. Audit Logs Table (Immutable Compliance Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_village ON patients(village);
CREATE INDEX IF NOT EXISTS idx_patients_taluka ON patients(taluka);
CREATE INDEX IF NOT EXISTS idx_patients_district ON patients(district);
CREATE INDEX IF NOT EXISTS idx_patients_assigned_asha ON patients(assigned_asha_id);
CREATE INDEX IF NOT EXISTS idx_patients_primary_facility ON patients(primary_facility_id);

CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_facility_id ON encounters(facility_id);
CREATE INDEX IF NOT EXISTS idx_encounters_encounter_date ON encounters(encounter_date);

CREATE INDEX IF NOT EXISTS idx_vitals_encounter_id ON vitals(encounter_id);
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON vitals(patient_id);

CREATE INDEX IF NOT EXISTS idx_triage_encounter_id ON triage_assessments(encounter_id);
CREATE INDEX IF NOT EXISTS idx_triage_urgency_tier ON triage_assessments(urgency_tier);

CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_patient ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_from_fac ON referrals(from_facility_id);
CREATE INDEX IF NOT EXISTS idx_referrals_to_fac ON referrals(to_facility_id);

CREATE INDEX IF NOT EXISTS idx_appointments_queue ON appointments(facility_id, scheduled_date, status, queue_tier);

-- ------------------------------------------------------------------------------
-- 12. Triggers for Automatic updated_at Timestamps
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_facilities ON facilities;
CREATE TRIGGER set_timestamp_facilities
BEFORE UPDATE ON facilities
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_profiles ON profiles;
CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_patients ON patients;
CREATE TRIGGER set_timestamp_patients
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_encounters ON encounters;
CREATE TRIGGER set_timestamp_encounters
BEFORE UPDATE ON encounters
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_referrals ON referrals;
CREATE TRIGGER set_timestamp_referrals
BEFORE UPDATE ON referrals
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_appointments ON appointments;
CREATE TRIGGER set_timestamp_appointments
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
