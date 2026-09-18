-- ==============================================================================
-- CAREGRID: Migration 00003 - Public Facilities Directory Seeds (Revised MVP)
-- SIH26133: Accessibility & Quality of Public Healthcare in Rural/Underserved Areas
-- Target: Government of Maharashtra (Public Health Department / Arogya Vibhag)
-- NOTE: ALL DATA BELOW IS SYNTHETIC TEST SEED DATA. NO REAL PATIENT PII.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Gadchiroli District Public Facilities (Tribal / Remote Belts)
-- ------------------------------------------------------------------------------
INSERT INTO facilities (id, facility_code, name, facility_type, district, taluka, village, pincode, latitude, longitude, contact_number, operating_hours, services_available, specialties_available)
VALUES 
(
    '11111111-0000-0000-0000-000000000001',
    'MAH-GAD-SC-01',
    'Sub-Centre Reguntha (Ayushman Arogya Mandir)',
    'sub_centre',
    'Gadchiroli',
    'Sironcha',
    'Reguntha',
    '442504',
    18.8682,
    79.9725,
    '07138-230001',
    '9:00 AM - 4:00 PM (Monday - Saturday)',
    '["MCH Screening", "Immunization", "NCD Vitals Check", "Rapid Diagnostic Kits"]'::jsonb,
    '["Primary Community Health"]'::jsonb
),
(
    '11111111-0000-0000-0000-000000000002',
    'MAH-GAD-PHC-01',
    'Primary Health Centre Bhamragad',
    'phc',
    'Gadchiroli',
    'Bhamragad',
    'Bhamragad',
    '442710',
    19.3908,
    80.3622,
    '07134-220012',
    '24x7 Emergency & Normal Delivery, 9:00 AM - 4:00 PM OPD',
    '["General OPD", "24/7 Normal Delivery", "Basic Lab Testing", "Teleconsultation Room", "Emergency Stabilization"]'::jsonb,
    '["General Medicine", "Obstetrics & Normal Delivery"]'::jsonb
),
(
    '11111111-0000-0000-0000-000000000003',
    'MAH-GAD-CHC-01',
    'Sub-District Hospital Aheri (CHC)',
    'chc',
    'Gadchiroli',
    'Aheri',
    'Aheri',
    '442705',
    19.4121,
    79.9882,
    '07133-272044',
    '24x7 Inpatient, Emergency & Surgery',
    '["Specialist OPD", "Emergency Care", "Ultrasound", "Digital X-Ray", "Blood Storage Unit"]'::jsonb,
    '["Obstetrics & Gynecology", "Pediatrics", "General Surgery"]'::jsonb
),
(
    '11111111-0000-0000-0000-000000000004',
    'MAH-GAD-DH-01',
    'District General Hospital Gadchiroli',
    'district_hospital',
    'Gadchiroli',
    'Gadchiroli',
    'Gadchiroli Town',
    '442605',
    20.1849,
    80.0030,
    '07132-222061',
    '24x7 Multi-Specialty Hospital',
    '["Intensive Care Unit (ICU)", "Newborn Care (SNCU)", "Emergency Trauma", "Diagnostic Pathology", "Dialysis Unit"]'::jsonb,
    '["General Medicine", "Pediatrics", "Gynecology & Obstetrics", "General Surgery", "Orthopedics"]'::jsonb
)
ON CONFLICT (facility_code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Nashik District Public Facilities (Hilly / Rural Belts)
-- ------------------------------------------------------------------------------
INSERT INTO facilities (id, facility_code, name, facility_type, district, taluka, village, pincode, latitude, longitude, contact_number, operating_hours, services_available, specialties_available)
VALUES
(
    '22222222-0000-0000-0000-000000000001',
    'MAH-NSK-SC-01',
    'Sub-Centre Harsul (Ayushman Arogya Mandir)',
    'sub_centre',
    'Nashik',
    'Trimbakeshwar',
    'Harsul',
    '422204',
    20.0831,
    73.4735,
    '02594-240010',
    '9:00 AM - 4:00 PM (Monday - Saturday)',
    '["ANC Checkup", "Infant Weight Tracking", "NCD Screening", "Essential Drug Dispensing"]'::jsonb,
    '["Community Healthcare"]'::jsonb
),
(
    '22222222-0000-0000-0000-000000000002',
    'MAH-NSK-PHC-01',
    'Primary Health Centre Vani',
    'phc',
    'Nashik',
    'Dindori',
    'Vani',
    '422215',
    20.3275,
    73.8966,
    '02557-221234',
    '24x7 Emergency & Delivery, 9:00 AM - 4:00 PM OPD',
    '["Primary OPD", "Labor Room", "Immunization Cold Chain", "Diagnostic Sputum & Blood Testing", "Telemedicine"]'::jsonb,
    '["General Medicine", "Maternal Care"]'::jsonb
),
(
    '22222222-0000-0000-0000-000000000003',
    'MAH-NSK-CHC-01',
    'Sub-District Hospital Kalwan',
    'sub_district_hosp',
    'Nashik',
    'Kalwan',
    'Kalwan',
    '423501',
    20.4902,
    74.0264,
    '02592-222345',
    '24x7 Secondary Hospital',
    '["Emergency Medicine", "Cesarean Delivery", "Pediatric Inpatient Unit", "Diagnostic Radiology"]'::jsonb,
    '["Obstetrics & Gynecology", "Pediatrics", "General Surgery"]'::jsonb
),
(
    '22222222-0000-0000-0000-000000000004',
    'MAH-NSK-DH-01',
    'District Civil Hospital Nashik',
    'district_hospital',
    'Nashik',
    'Nashik',
    'Nashik City',
    '422002',
    19.9975,
    73.7898,
    '0253-2576106',
    '24x7 Tertiary Hospital',
    '["Emergency Resuscitation", "CEmONC", "ICU / SNCU", "Advanced Diagnostic Lab", "Specialist OPD"]'::jsonb,
    '["Cardiology", "Neurology", "Pediatrics", "Obstetrics & Gynecology", "General Surgery", "Orthopedics"]'::jsonb
)
ON CONFLICT (facility_code) DO NOTHING;
