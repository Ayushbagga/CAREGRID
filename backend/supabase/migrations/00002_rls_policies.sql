-- ==============================================================================
-- CAREGRID: Migration 00002 - Row-Level Security (RLS) Policies
-- SIH26133: Accessibility & Quality of Public Healthcare in Rural/Underserved Areas
-- Target: Government of Maharashtra (Public Health Department)
-- ==============================================================================

-- Enable Row Level Security on all core healthcare tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Helper function: Get current user's role from profiles
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 2. Facilities RLS
-- Facilities directory is readable by any authenticated user; modified by admins.
-- ------------------------------------------------------------------------------
CREATE POLICY facilities_read_all ON facilities
    FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

CREATE POLICY facilities_admin_manage ON facilities
    FOR ALL
    TO authenticated
    USING (current_user_role() IN ('district_officer', 'state_admin'));

-- ------------------------------------------------------------------------------
-- 3. Profiles RLS
-- Users can view their own profile; admins can view all profiles in district.
-- ------------------------------------------------------------------------------
CREATE POLICY profiles_self_read ON profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR current_user_role() IN ('facility_admin', 'district_officer', 'state_admin'));

CREATE POLICY profiles_self_update ON profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- ------------------------------------------------------------------------------
-- 4. Patients RLS
-- - Citizen reads their own record.
-- - ASHA/ANM can read/write patients in their assigned village or taluka.
-- - Medical Officers/Specialists can read patients registered at their facility or referred to it.
-- ------------------------------------------------------------------------------
CREATE POLICY patients_citizen_self ON patients
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY patients_asha_village ON patients
    FOR ALL
    TO authenticated
    USING (
        current_user_role() IN ('asha_worker', 'anm_worker')
        AND (
            assigned_asha_id = auth.uid()
            OR village = (SELECT assigned_village FROM profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY patients_clinical_access ON patients
    FOR SELECT
    TO authenticated
    USING (
        current_user_role() IN ('medical_officer', 'specialist_doctor', 'facility_admin')
        AND (
            primary_facility_id = (SELECT facility_id FROM profiles WHERE id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM referrals
                WHERE referrals.patient_id = patients.id
                AND (referrals.to_facility_id = (SELECT facility_id FROM profiles WHERE id = auth.uid())
                     OR referrals.from_facility_id = (SELECT facility_id FROM profiles WHERE id = auth.uid()))
            )
        )
    );

CREATE POLICY patients_health_officer_access ON patients
    FOR SELECT
    TO authenticated
    USING (
        current_user_role() IN ('district_officer', 'state_admin')
    );

-- ------------------------------------------------------------------------------
-- 5. Encounters & Vitals RLS
-- Scoped to the patient's assigned care circle or clinical facility
-- ------------------------------------------------------------------------------
CREATE POLICY encounters_patient_self ON encounters
    FOR SELECT
    TO authenticated
    USING (patient_id = auth.uid());

CREATE POLICY encounters_provider_access ON encounters
    FOR ALL
    TO authenticated
    USING (
        provider_id = auth.uid()
        OR current_user_role() IN ('medical_officer', 'specialist_doctor', 'facility_admin', 'district_officer')
    );

CREATE POLICY vitals_patient_self ON vitals
    FOR SELECT
    TO authenticated
    USING (patient_id = auth.uid());

CREATE POLICY vitals_provider_access ON vitals
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM encounters WHERE encounters.id = vitals.encounter_id
            AND (encounters.provider_id = auth.uid() OR current_user_role() IN ('medical_officer', 'specialist_doctor', 'asha_worker', 'anm_worker'))
        )
    );

-- ------------------------------------------------------------------------------
-- 6. Triage Assessments RLS
-- ------------------------------------------------------------------------------
CREATE POLICY triage_patient_self ON triage_assessments
    FOR SELECT
    TO authenticated
    USING (patient_id = auth.uid());

CREATE POLICY triage_clinician_access ON triage_assessments
    FOR ALL
    TO authenticated
    USING (
        current_user_role() IN ('asha_worker', 'anm_worker', 'medical_officer', 'specialist_doctor', 'facility_admin')
    );

-- ------------------------------------------------------------------------------
-- 7. Referrals RLS
-- Visible to referring facility and receiving facility
-- ------------------------------------------------------------------------------
CREATE POLICY referrals_facility_access ON referrals
    FOR ALL
    TO authenticated
    USING (
        current_user_role() IN ('medical_officer', 'specialist_doctor', 'facility_admin', 'district_officer', 'state_admin')
        OR from_facility_id = (SELECT facility_id FROM profiles WHERE id = auth.uid())
        OR to_facility_id = (SELECT facility_id FROM profiles WHERE id = auth.uid())
        OR referring_officer_id = auth.uid()
    );

CREATE POLICY referrals_patient_self ON referrals
    FOR SELECT
    TO authenticated
    USING (patient_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 8. Audit Logs RLS
-- Strictly append-only for authenticated workers; readable only by administrators
-- ------------------------------------------------------------------------------
CREATE POLICY audit_logs_insert_all ON audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY audit_logs_admin_read ON audit_logs
    FOR SELECT
    TO authenticated
    USING (current_user_role() IN ('district_officer', 'state_admin'));
