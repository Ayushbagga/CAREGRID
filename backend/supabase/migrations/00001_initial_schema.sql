-- ==============================================================================
-- CAREGRID: Migration 00001 - Initial Schema (Revised MVP)
-- SIH26133: Accessibility & Quality of Public Healthcare in Rural/Underserved Areas
-- Target: Government of Maharashtra (Public Health Department / Arogya Vibhag)
-- ==============================================================================

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
        'district_hospital'
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

DO $$ BEGIN
    CREATE TYPE follow_up_status AS ENUM (
        'pending',
        'completed',
        'missed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Facilities Table (Service Discovery)
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
    contact_number TEXT,
    operating_hours TEXT DEFAULT '24x7 Emergency, 9 AM - 4 PM OPD',
    services_available JSONB DEFAULT '[]'::jsonb,
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
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    estimated_age INTEGER,
    gender TEXT NOT NULL,
    blood_group TEXT,
    primary_phone TEXT,
    village TEXT NOT NULL,
    taluka TEXT NOT NULL,
    district TEXT NOT NULL,
    assigned_asha_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    primary_facility_id UUID REFERENCES facilities(id) ON DELETE RESTRICT,
    is_pregnant BOOLEAN DEFAULT FALSE,
    gestational_age_weeks INTEGER,
    high_risk_pregnancy BOOLEAN DEFAULT FALSE,
    chronic_conditions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. Encounters Table (Clinical consultations & field visits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    encounter_type TEXT NOT NULL, -- 'asha_home_visit', 'phc_opd', 'teleconsultation'
    chief_complaints JSONB DEFAULT '[]'::jsonb,
    clinical_notes TEXT,
    provisional_observations TEXT,
    diagnostic_tests_ordered JSONB DEFAULT '[]'::jsonb,
    advised_medications JSONB DEFAULT '[]'::jsonb,
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
    non_diagnostic_disclaimer TEXT NOT NULL,
    clinician_acknowledged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
    status referral_status NOT NULL DEFAULT 'initiated',
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
    status appointment_status NOT NULL DEFAULT 'in_queue',
    webrtc_room_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. Follow-up Tasks Table (Continuity of Care)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assigned_asha_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    originating_referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL, -- 'post_referral_check', 'maternal_anc_check', 'chronic_vitals_check', 'routine_follow_up'
    due_date DATE NOT NULL,
    status follow_up_status NOT NULL DEFAULT 'pending',
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. Audit Logs Table (Security & Compliance)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. Indexes & Performance Optimization
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_village ON patients(village);
CREATE INDEX IF NOT EXISTS idx_patients_assigned_asha ON patients(assigned_asha_id);
CREATE INDEX IF NOT EXISTS idx_patients_primary_facility ON patients(primary_facility_id);

CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_facility ON encounters(facility_id);
CREATE INDEX IF NOT EXISTS idx_vitals_encounter ON vitals(encounter_id);
CREATE INDEX IF NOT EXISTS idx_triage_encounter ON triage_assessments(encounter_id);

CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_patient ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_from_fac ON referrals(from_facility_id);
CREATE INDEX IF NOT EXISTS idx_referrals_to_fac ON referrals(to_facility_id);

CREATE INDEX IF NOT EXISTS idx_appointments_queue ON appointments(facility_id, scheduled_date, status, queue_tier);
CREATE INDEX IF NOT EXISTS idx_followup_asha ON follow_up_tasks(assigned_asha_id, status, due_date);
