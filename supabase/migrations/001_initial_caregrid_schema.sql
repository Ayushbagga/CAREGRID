-- =============================================================================
-- CAREGRID Supabase / PostgreSQL Initial Migration
-- File: supabase/migrations/001_initial_caregrid_schema.sql
-- Problem Statement: SIH26133 — Rural Healthcare Access & Care Coordination Platform
-- Target Beneficiary: Government of Maharashtra (Public Health Department)
-- Specification Alignment:
--   - docs/Backend-Schema-v1.0.md
--   - docs/PRD-v1.0.md & docs/TRD-v1.0.md
--   - docs/Security-Privacy-v1.0.md
--   - docs/API-Contract-v1.0.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: EXTENSIONS & SCHEMAS
-- -----------------------------------------------------------------------------
-- PostgreSQL 13+ native gen_random_uuid() is built-in; pgcrypto enabled if needed.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";



-- -----------------------------------------------------------------------------
-- SECTION 2: ENUMS & DOMAINS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE caregrid_role_type AS ENUM (
    'asha_anm',
    'mo_doctor',
    'phc_staff',
    'admin_governance',
    'citizen'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE caregrid_facility_type AS ENUM (
    'sub_center',
    'phc',
    'rural_hospital',
    'sub_district_hospital',
    'district_hospital'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE caregrid_urgency_tier AS ENUM (
    'emergency_red',
    'urgent_amber',
    'routine_green'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE caregrid_referral_status AS ENUM (
    'initiated',
    'acknowledged',
    'evaluated',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE caregrid_follow_up_status AS ENUM (
    'pending',
    'completed',
    'missed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE caregrid_queue_status AS ENUM (
    'waiting',
    'called',
    'in_consultation',
    'completed',
    'no_show'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE caregrid_stock_status AS ENUM (
    'adequate',
    'low',
    'stock_out'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- SECTION 3: CORE TABLES (20 Entities)
-- -----------------------------------------------------------------------------

-- 1. Roles Reference Table
CREATE TABLE IF NOT EXISTS public.roles (
  id VARCHAR(32) PRIMARY KEY,
  role_type caregrid_role_type NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Facilities
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  facility_type caregrid_facility_type NOT NULL,
  district VARCHAR(100) NOT NULL,
  taluka VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  phone VARCHAR(20),
  operating_hours VARCHAR(100) NOT NULL DEFAULT '24x7 Emergency, OPD 09:00 - 16:00',
  has_teleconsultation BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users Profile (Linked to Supabase auth.users or application credentials)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id VARCHAR(32) NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  assigned_district VARCHAR(100),
  assigned_taluka VARCHAR(100),
  assigned_village VARCHAR(100),
  preferred_language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'mr')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Facility Services Catalog
CREATE TABLE IF NOT EXISTS public.facility_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  service_code VARCHAR(50) NOT NULL,
  service_name VARCHAR(150) NOT NULL,
  service_category VARCHAR(50) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  schedule_days TEXT[] NOT NULL DEFAULT '{"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"}',
  schedule_hours VARCHAR(50) NOT NULL DEFAULT '09:00 - 16:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_facility_service UNIQUE (facility_id, service_code)
);

-- 5. Patients (Neutral Identifier CARE-MH-YYYY-XXXX)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_id VARCHAR(30) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  age INT,
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('female', 'male', 'other', 'undisclosed')),
  phone VARCHAR(20),
  emergency_contact_phone VARCHAR(20),
  address TEXT,
  village VARCHAR(100) NOT NULL,
  taluka VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  pincode VARCHAR(10),
  registered_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  home_facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  is_high_risk BOOLEAN NOT NULL DEFAULT FALSE,
  high_risk_reason TEXT,
  consent_granted BOOLEAN NOT NULL DEFAULT TRUE,
  sync_version INT NOT NULL DEFAULT 1,
  client_created_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Health Records (Longitudinal Care Summary, 1:1 with Patient)
CREATE TABLE IF NOT EXISTS public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  blood_group VARCHAR(10),
  allergies TEXT[] NOT NULL DEFAULT '{}',
  chronic_conditions TEXT[] NOT NULL DEFAULT '{}',
  non_diagnostic_disclaimer TEXT NOT NULL DEFAULT 'Assistive care timeline. Requires qualified medical practitioner review.',
  sync_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Encounters (Community & Facility Clinical Touchpoints)
CREATE TABLE IF NOT EXISTS public.encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  encounter_type VARCHAR(50) NOT NULL CHECK (encounter_type IN ('asha_home_visit', 'phc_opd', 'teleconsultation', 'specialist_review', 'emergency_triage')),
  chief_complaint TEXT NOT NULL,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  client_created_at TIMESTAMPTZ,
  sync_version INT NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Triage Assessments (Assistive, Rule-Based, Strictly Non-Diagnostic)
CREATE TABLE IF NOT EXISTS public.triage_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assessed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  systolic_bp INT CHECK (systolic_bp IS NULL OR (systolic_bp BETWEEN 50 AND 260)),
  diastolic_bp INT CHECK (diastolic_bp IS NULL OR (diastolic_bp BETWEEN 30 AND 160)),
  pulse_bpm INT CHECK (pulse_bpm IS NULL OR (pulse_bpm BETWEEN 30 AND 220)),
  respiratory_rate_bpm INT CHECK (respiratory_rate_bpm IS NULL OR (respiratory_rate_bpm BETWEEN 8 AND 60)),
  temperature_celsius NUMERIC(4, 1) CHECK (temperature_celsius IS NULL OR (temperature_celsius BETWEEN 34.0 AND 42.0)),
  sp_o2_percent INT CHECK (sp_o2_percent IS NULL OR (sp_o2_percent BETWEEN 50 AND 100)),
  hemoglobin_g_dl NUMERIC(3, 1) CHECK (hemoglobin_g_dl IS NULL OR (hemoglobin_g_dl BETWEEN 2.0 AND 25.0)),
  symptoms_reported TEXT[] NOT NULL DEFAULT '{}',
  red_flag_symptoms TEXT[] NOT NULL DEFAULT '{}',
  urgency_tier caregrid_urgency_tier NOT NULL,
  priority_score INT NOT NULL CHECK (priority_score IN (1, 2, 3)),
  recommended_action TEXT NOT NULL,
  recommended_specialty VARCHAR(100),
  red_flag_triggers TEXT[] NOT NULL DEFAULT '{}',
  non_diagnostic_disclaimer TEXT NOT NULL DEFAULT 'Assistive clinical decision support only. Not a medical diagnosis. Qualified healthcare professional review required.',
  disclaimer_acknowledged BOOLEAN NOT NULL DEFAULT TRUE,
  sync_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE RESTRICT,
  provider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('phc_opd', 'teleconsultation', 'follow_up_visit', 'diagnostic_test')),
  scheduled_date DATE NOT NULL,
  scheduled_time_slot VARCHAR(30) NOT NULL,
  reason_for_visit TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_in', 'completed', 'cancelled', 'no_show')),
  sync_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Queues (Priority-Sorted OPD Queues: Emergency Red Fast-Tracked)
CREATE TABLE IF NOT EXISTS public.queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  queue_token VARCHAR(20) NOT NULL,
  queue_number INT NOT NULL,
  priority_level INT NOT NULL CHECK (priority_level IN (1, 2, 3)),
  urgency_tier caregrid_urgency_tier NOT NULL,
  status caregrid_queue_status NOT NULL DEFAULT 'waiting',
  estimated_wait_minutes INT NOT NULL DEFAULT 15,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT uq_facility_queue_token UNIQUE (facility_id, queue_token, checked_in_at)
);

-- 11. Consultations & Teleconsultation Sessions
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  consultation_type VARCHAR(50) NOT NULL CHECK (consultation_type IN ('in_person_opd', 'teleconsultation')),
  specialist_provider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (session_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  clinical_notes TEXT,
  specialist_advice TEXT,
  teleconsult_room_id VARCHAR(100),
  duration_minutes INT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  sync_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Referrals (Closed-Loop Referral Tracking)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_tracking_code VARCHAR(50) NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  source_facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE RESTRICT,
  target_facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE RESTRICT,
  urgency_tier caregrid_urgency_tier NOT NULL,
  specialty_requested VARCHAR(100) NOT NULL,
  clinical_summary TEXT NOT NULL,
  status caregrid_referral_status NOT NULL DEFAULT 'initiated',
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledging_notes TEXT,
  evaluated_at TIMESTAMPTZ,
  evaluation_notes TEXT,
  completed_at TIMESTAMPTZ,
  discharge_summary TEXT,
  follow_up_due_days INT NOT NULL DEFAULT 5,
  assigned_asha_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  sync_version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Diagnostics (Point-of-Care Testing)
CREATE TABLE IF NOT EXISTS public.diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE RESTRICT,
  ordered_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  test_name VARCHAR(150) NOT NULL,
  test_code VARCHAR(50) NOT NULL,
  test_category VARCHAR(50) NOT NULL CHECK (test_category IN ('point_of_care', 'routine_lab', 'specialized_diagnostic')),
  status VARCHAR(30) NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'sample_collected', 'processing', 'completed', 'cancelled')),
  result_value VARCHAR(100),
  result_unit VARCHAR(50),
  reference_range VARCHAR(100),
  clinical_interpretation TEXT,
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  sync_version INT NOT NULL DEFAULT 1
);

-- 14. Services & Essential Medicines Availability
CREATE TABLE IF NOT EXISTS public.services_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('medicine', 'diagnostic', 'service')),
  item_code VARCHAR(50) NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  stock_status caregrid_stock_status NOT NULL DEFAULT 'adequate',
  quantity_on_hand INT,
  unit VARCHAR(50),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_facility_item UNIQUE (facility_id, item_code)
);

-- 15. Follow-Ups (Post-Referral & Maternal Care Continuity Tasks)
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  assigned_asha_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('post_referral_check', 'high_risk_pregnancy_visit', 'routine_check', 'immunization_follow_up', 'chronic_care_check')),
  due_date DATE NOT NULL,
  status caregrid_follow_up_status NOT NULL DEFAULT 'pending',
  priority_category VARCHAR(30) NOT NULL DEFAULT 'due_today' CHECK (priority_category IN ('overdue', 'due_today', 'upcoming')),
  instructions TEXT NOT NULL,
  notes TEXT,
  patient_condition VARCHAR(50) CHECK (patient_condition IS NULL OR patient_condition IN ('improving', 'stable', 'deteriorating', 'requires_re_referral')),
  completed_at TIMESTAMPTZ,
  sync_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Multilingual Notifications (Trilingual EN, HI, MR)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'mr')),
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('follow_up_reminder', 'referral_update', 'queue_call', 'appointment_confirmation')),
  channel VARCHAR(30) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'sms', 'push')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Immutable Audit Logs (Append-Only, Trigger-Protected)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_name VARCHAR(50) NOT NULL,
  record_id UUID,
  client_ip INET,
  user_agent TEXT,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Health Schemes (PM-JAY, MJPJAY, JSSK, PMMVY)
CREATE TABLE IF NOT EXISTS public.schemes (
  id VARCHAR(50) PRIMARY KEY,
  scheme_name VARCHAR(200) NOT NULL,
  scheme_name_mr VARCHAR(200) NOT NULL,
  scheme_name_hi VARCHAR(200) NOT NULL,
  coverage_amount_inr INT NOT NULL DEFAULT 0,
  category VARCHAR(50) NOT NULL CHECK (category IN ('health_insurance', 'maternal_welfare', 'child_health')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Scheme Guidance (Trilingual Document Checklists)
CREATE TABLE IF NOT EXISTS public.scheme_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id VARCHAR(50) NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL CHECK (language IN ('en', 'hi', 'mr')),
  eligibility_criteria TEXT[] NOT NULL DEFAULT '{}',
  required_documents TEXT[] NOT NULL DEFAULT '{}',
  application_steps TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_scheme_guidance UNIQUE (scheme_id, language)
);

-- 20. Offline Sync Events (Idempotent Mutation Queue Processing)
CREATE TABLE IF NOT EXISTS public.offline_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_event_id UUID NOT NULL,
  entity_table VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  client_version INT NOT NULL,
  client_timestamp TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  sync_status VARCHAR(20) NOT NULL DEFAULT 'applied' CHECK (sync_status IN ('applied', 'rejected', 'conflict_resolved')),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_sync_event UNIQUE (user_id, client_event_id)
);

-- -----------------------------------------------------------------------------
-- SECTION 4: PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_facilities_district_type ON public.facilities(district, facility_type);
CREATE INDEX IF NOT EXISTS idx_patients_care_id ON public.patients(care_id);
CREATE INDEX IF NOT EXISTS idx_patients_village_district ON public.patients(district, village);
CREATE INDEX IF NOT EXISTS idx_patients_is_high_risk ON public.patients(is_high_risk) WHERE is_high_risk = TRUE;
CREATE INDEX IF NOT EXISTS idx_encounters_patient_date ON public.encounters(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_triage_urgency ON public.triage_assessments(urgency_tier, priority_score);
CREATE INDEX IF NOT EXISTS idx_queues_facility_priority ON public.queues(facility_id, priority_level ASC, queue_number ASC) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_referrals_status_urgency ON public.referrals(status, urgency_tier);
CREATE INDEX IF NOT EXISTS idx_referrals_target_facility ON public.referrals(target_facility_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_source_facility ON public.referrals(source_facility_id, status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_asha_due ON public.follow_ups(assigned_asha_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_avail_facility ON public.services_availability(facility_id, stock_status);

-- -----------------------------------------------------------------------------
-- SECTION 5: AUDIT LOG PROTECTION TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.caregrid_protect_audit_logs()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'CAREGRID Security Violation: audit_logs is append-only and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_protect ON public.audit_logs;
CREATE TRIGGER trg_audit_protect
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.caregrid_protect_audit_logs();

-- -----------------------------------------------------------------------------
-- SECTION 6: ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.caregrid_user_role()
RETURNS VARCHAR AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'role',
    (current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role'),
    'anonymous'
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.caregrid_user_facility()
RETURNS UUID AS $$
BEGIN
  RETURN (
    COALESCE(
      current_setting('request.jwt.claims', true)::jsonb->>'facility_id',
      current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'facility_id'
    )
  )::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- SECTION 7: ENABLE ROW LEVEL SECURITY (Mandatory On All Application Tables)
-- -----------------------------------------------------------------------------
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_guidance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- SECTION 8: ROLE-BASED ACCESS CONTROL (RLS POLICIES)
-- -----------------------------------------------------------------------------

-- 8.1 Roles & Reference Schemes (Public Read, Admin Mutate)
CREATE POLICY rls_roles_select ON public.roles
  FOR SELECT TO authenticated, anon USING (TRUE);

CREATE POLICY rls_schemes_select ON public.schemes
  FOR SELECT TO authenticated, anon USING (is_active = TRUE);

CREATE POLICY rls_scheme_guidance_select ON public.scheme_guidance
  FOR SELECT TO authenticated, anon USING (TRUE);

-- 8.2 Facilities & Public Services Directory (Public Read)
CREATE POLICY rls_facilities_select ON public.facilities
  FOR SELECT TO authenticated, anon USING (is_active = TRUE);

CREATE POLICY rls_facility_services_select ON public.facility_services
  FOR SELECT TO authenticated, anon USING (TRUE);

CREATE POLICY rls_services_avail_select ON public.services_availability
  FOR SELECT TO authenticated, anon USING (TRUE);

CREATE POLICY rls_services_avail_update ON public.services_availability
  FOR ALL TO authenticated
  USING (
    public.caregrid_user_role() IN ('mo_doctor', 'phc_staff') AND
    facility_id = public.caregrid_user_facility()
  );

-- 8.3 User Profiles
CREATE POLICY rls_users_select_self ON public.users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    public.caregrid_user_role() IN ('mo_doctor', 'admin_governance')
  );

CREATE POLICY rls_users_update_self ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- 8.4 Patients
CREATE POLICY rls_patients_asha ON public.patients
  FOR ALL TO authenticated
  USING (
    public.caregrid_user_role() = 'asha_anm' AND
    (registered_by = auth.uid() OR village = (current_setting('request.jwt.claims', true)::jsonb->>'assigned_village'))
  );

CREATE POLICY rls_patients_doctor ON public.patients
  FOR SELECT TO authenticated
  USING (
    public.caregrid_user_role() IN ('mo_doctor', 'phc_staff') AND
    (
      home_facility_id = public.caregrid_user_facility() OR
      id IN (SELECT patient_id FROM public.referrals WHERE target_facility_id = public.caregrid_user_facility() OR source_facility_id = public.caregrid_user_facility())
    )
  );

CREATE POLICY rls_patients_doctor_insert ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (public.caregrid_user_role() IN ('mo_doctor', 'phc_staff', 'asha_anm'));

CREATE POLICY rls_patients_citizen ON public.patients
  FOR SELECT TO authenticated
  USING (
    public.caregrid_user_role() = 'citizen' AND
    phone = (current_setting('request.jwt.claims', true)::jsonb->>'phone')
  );

-- 8.5 Health Records
CREATE POLICY rls_health_records_access ON public.health_records
  FOR ALL TO authenticated
  USING (
    public.caregrid_user_role() IN ('asha_anm', 'mo_doctor', 'phc_staff') OR
    patient_id IN (SELECT id FROM public.patients WHERE phone = (current_setting('request.jwt.claims', true)::jsonb->>'phone'))
  );

-- 8.6 Encounters & Triage Assessments
CREATE POLICY rls_encounters_rw ON public.encounters
  FOR ALL TO authenticated
  USING (public.caregrid_user_role() IN ('asha_anm', 'mo_doctor', 'phc_staff'));

CREATE POLICY rls_triage_rw ON public.triage_assessments
  FOR ALL TO authenticated
  USING (public.caregrid_user_role() IN ('asha_anm', 'mo_doctor', 'phc_staff'));

-- 8.7 Appointments & Queues
CREATE POLICY rls_appointments_all ON public.appointments
  FOR ALL TO authenticated
  USING (
    public.caregrid_user_role() IN ('mo_doctor', 'phc_staff', 'asha_anm') OR
    patient_id IN (SELECT id FROM public.patients WHERE phone = (current_setting('request.jwt.claims', true)::jsonb->>'phone'))
  );

CREATE POLICY rls_queues_all ON public.queues
  FOR ALL TO authenticated
  USING (public.caregrid_user_role() IN ('mo_doctor', 'phc_staff', 'asha_anm'));

-- 8.8 Consultations
CREATE POLICY rls_consultations_rw ON public.consultations
  FOR ALL TO authenticated
  USING (public.caregrid_user_role() IN ('mo_doctor', 'phc_staff'));

-- 8.9 Referrals (Closed-Loop Isolation)
CREATE POLICY rls_referrals_select ON public.referrals
  FOR SELECT TO authenticated
  USING (
    public.caregrid_user_role() IN ('mo_doctor', 'phc_staff') AND (source_facility_id = public.caregrid_user_facility() OR target_facility_id = public.caregrid_user_facility()) OR
    public.caregrid_user_role() = 'asha_anm' AND (assigned_asha_id = auth.uid()) OR
    public.caregrid_user_role() = 'admin_governance'
  );

CREATE POLICY rls_referrals_insert ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (public.caregrid_user_role() IN ('asha_anm', 'mo_doctor', 'phc_staff'));

CREATE POLICY rls_referrals_update ON public.referrals
  FOR UPDATE TO authenticated
  USING (
    (target_facility_id = public.caregrid_user_facility() AND public.caregrid_user_role() IN ('mo_doctor', 'phc_staff')) OR
    (source_facility_id = public.caregrid_user_facility() AND public.caregrid_user_role() IN ('mo_doctor', 'phc_staff'))
  );

-- 8.10 Diagnostics
CREATE POLICY rls_diagnostics_rw ON public.diagnostics
  FOR ALL TO authenticated
  USING (public.caregrid_user_role() IN ('mo_doctor', 'phc_staff', 'asha_anm'));

-- 8.11 Follow-Ups
CREATE POLICY rls_follow_ups_asha ON public.follow_ups
  FOR ALL TO authenticated
  USING (
    public.caregrid_user_role() = 'asha_anm' AND assigned_asha_id = auth.uid() OR
    public.caregrid_user_role() IN ('mo_doctor', 'phc_staff', 'admin_governance')
  );

-- 8.12 Notifications
CREATE POLICY rls_notifications_user ON public.notifications
  FOR ALL TO authenticated
  USING (recipient_user_id = auth.uid());

-- 8.13 Audit Logs (Admin Read-Only, Trigger-Enforced Append)
CREATE POLICY rls_audit_logs_admin ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.caregrid_user_role() = 'admin_governance');

CREATE POLICY rls_audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

-- 8.14 Offline Sync Events
CREATE POLICY rls_sync_events_owner ON public.offline_sync_events
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- SECTION 9: SYNTHETIC DEMO SEED FIXTURES (Zero Real Patient Data)
-- -----------------------------------------------------------------------------

-- 9.1 Reference Roles
INSERT INTO public.roles (id, role_type, description) VALUES
  ('asha_anm', 'asha_anm', 'Frontline ASHA/ANM Community Healthcare Worker'),
  ('mo_doctor', 'mo_doctor', 'PHC Medical Officer or Hospital Specialist Physician'),
  ('phc_staff', 'phc_staff', 'PHC Staff Nurse, Pharmacist or Lab Technician'),
  ('admin_governance', 'admin_governance', 'Taluka/District Public Health Governance Official'),
  ('citizen', 'citizen', 'Registered Rural Citizen / Patient Beneficiary')
ON CONFLICT (id) DO NOTHING;

-- 9.2 Reference Public Health Schemes
INSERT INTO public.schemes (id, scheme_name, scheme_name_mr, scheme_name_hi, coverage_amount_inr, category, is_active) VALUES
  ('MJPJAY', 'Mahatma Jyotirao Phule Jan Arogya Yojana', 'महात्मा ज्योतिराव फुले जन आरोग्य योजना', 'महात्मा ज्योतिराव फुले जन आरोग्य योजना', 500000, 'health_insurance', TRUE),
  ('PM-JAY', 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana', 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना', 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना', 500000, 'health_insurance', TRUE),
  ('JSSK', 'Janani Shishu Suraksha Karyakram', 'जननी शिशु सुरक्षा कार्यक्रम', 'जननी शिशु सुरक्षा कार्यक्रम', 0, 'maternal_welfare', TRUE),
  ('PMMVY', 'Pradhan Mantri Matru Vandana Yojana', 'प्रधानमंत्री मातृ वंदना योजना', 'प्रधानमंत्री मातृ वंदना योजना', 5000, 'maternal_welfare', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 9.3 Sample Demo Facilities (Illustrative Placeholders across Maharashtra Districts)
INSERT INTO public.facilities (id, name, facility_type, district, taluka, address, pincode, phone, has_teleconsultation, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Korpana Primary Health Centre', 'phc', 'Gadchiroli', 'Aheri', 'Main Road, Korpana', '442705', '+917138222111', TRUE, TRUE),
  ('c0000000-0000-0000-0000-000000000002', 'Gadchiroli District Hospital', 'district_hospital', 'Gadchiroli', 'Gadchiroli', 'Hospital Road, Complex Area, Gadchiroli', '442605', '+917132222100', TRUE, TRUE),
  ('c0000000-0000-0000-0000-000000000003', 'Igatpuri Rural Hospital', 'rural_hospital', 'Nashik', 'Igatpuri', 'Old Agra Road, Igatpuri', '422403', '+912553244222', TRUE, TRUE),
  ('c0000000-0000-0000-0000-000000000004', 'Manchar Sub-District Hospital', 'sub_district_hospital', 'Pune', 'Ambegaon', 'Pune-Nashik Highway, Manchar', '410503', '+912133223300', TRUE, TRUE),
  ('c0000000-0000-0000-0000-000000000005', 'Mendha Lekha Sub-Center', 'sub_center', 'Gadchiroli', 'Aheri', 'Village Square, Mendha Lekha', '442705', '+917138222112', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 9.4 Sample Demo Staff Profiles
INSERT INTO public.users (id, role_id, facility_id, full_name, phone, assigned_district, assigned_taluka, assigned_village, preferred_language) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'asha_anm', 'c0000000-0000-0000-0000-000000000005', 'Sunita Patil', '+919800000001', 'Gadchiroli', 'Aheri', 'Mendha Lekha', 'mr'),
  ('a0000000-0000-0000-0000-000000000002', 'mo_doctor', 'c0000000-0000-0000-0000-000000000001', 'Dr. Ramesh Kadam', '+919800000002', 'Gadchiroli', 'Aheri', NULL, 'mr'),
  ('a0000000-0000-0000-0000-000000000003', 'mo_doctor', 'c0000000-0000-0000-0000-000000000002', 'Dr. Priya Deshmukh', '+919800000003', 'Gadchiroli', 'Gadchiroli', NULL, 'mr'),
  ('a0000000-0000-0000-0000-000000000004', 'phc_staff', 'c0000000-0000-0000-0000-000000000001', 'Anand Joshi', '+919800000004', 'Gadchiroli', 'Aheri', NULL, 'mr'),
  ('a0000000-0000-0000-0000-000000000005', 'admin_governance', NULL, 'Dr. Vijay Shinde (DHO)', '+919800000005', 'Gadchiroli', NULL, NULL, 'mr')
ON CONFLICT (id) DO NOTHING;

-- 9.5 Sample Demo Patient (High-Risk Maternal Scenario)
INSERT INTO public.patients (id, care_id, first_name, last_name, date_of_birth, age, gender, phone, village, taluka, district, pincode, registered_by, home_facility_id, is_high_risk, high_risk_reason, consent_granted) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'CARE-MH-2026-A8F2', 'Kavita', 'Madavi', '1998-04-12', 28, 'female', '+919800112233', 'Mendha Lekha', 'Aheri', 'Gadchiroli', '442705', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', TRUE, 'Severe anemia in 3rd trimester pregnancy', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.health_records (id, patient_id, blood_group, allergies, chronic_conditions) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'O+', '{"Penicillin"}', '{"Gestational Anemia"}')
ON CONFLICT (id) DO NOTHING;

-- 9.6 Sample Essential Medicine Stock Fixture
INSERT INTO public.services_availability (facility_id, item_type, item_code, item_name, is_available, stock_status, quantity_on_hand, unit, updated_by) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'medicine', 'MED_IFA', 'Iron Folic Acid (IFA) Tablets', TRUE, 'adequate', 1200, 'tablets', 'a0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000001', 'medicine', 'MED_ORS', 'Oral Rehydration Salts (ORS)', TRUE, 'low', 35, 'packets', 'a0000000-0000-0000-0000-000000000004')
ON CONFLICT (facility_id, item_code) DO NOTHING;
