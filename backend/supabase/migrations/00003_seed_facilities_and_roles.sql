-- ==============================================================================
-- CAREGRID: Migration 00003 - Public Facilities & Realistic Seed Data
-- SIH26133: Accessibility & Quality of Public Healthcare in Rural/Underserved Areas
-- Target: Government of Maharashtra (Public Health Department / Arogya Vibhag)
-- NOTE: ALL PATIENT & CLINICAL DATA BELOW IS SYNTHETIC DUMMY DATA FOR TESTING ONLY.
-- ZERO REAL PATIENT IDENTIFIABLE INFORMATION (PII) IS CONTAINED HEREIN.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Seed Public Health Facilities across Maharashtra Districts
-- ------------------------------------------------------------------------------

-- Gadchiroli District (Tribal / Forest / Remote Belts)
INSERT INTO facilities (id, facility_code, name, facility_type, district, taluka, village, pincode, latitude, longitude, total_beds, available_beds, contact_number, emergency_ambulance_number, specialties_available)
VALUES 
(
    '11111111-0000-0000-0000-000000000001',
    'MAH-GAD-SC-01',
    'Sub-Centre Reguntha (Arogya Mandir)',
    'sub_centre',
    'Gadchiroli',
    'Sironcha',
    'Reguntha',
    '442504',
    18.8682,
    79.9725,
    2,
    2,
    '07138-230001',
    '108',
    '["Basic First Aid", "ANC Screening", "Immunization", "Rapid Malaria/Sickle Cell Testing"]'::jsonb
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
    10,
    4,
    '07134-220012',
    '108',
    '["General Medicine", "24/7 Normal Delivery", "Basic Lab Testing", "Emergency Stabilization", "Teleconsultation Room"]'::jsonb
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
    50,
    18,
    '07133-272044',
    '108',
    '["Obstetrics & Gynecology", "Pediatrics", "Emergency Surgery", "Blood Storage Unit", "Ultrasound", "Digital X-Ray"]'::jsonb
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
    300,
    64,
    '07132-222061',
    '108',
    '["ICU / CCU", "NICU / SNCU", "Trauma & Orthopedics", "General Surgery", "Dialysis", "Pathology / CT Scan"]'::jsonb
)
ON CONFLICT (facility_code) DO NOTHING;

-- Nashik District (Hilly / Rural / Tribal Blocks)
INSERT INTO facilities (id, facility_code, name, facility_type, district, taluka, village, pincode, latitude, longitude, total_beds, available_beds, contact_number, emergency_ambulance_number, specialties_available)
VALUES
(
    '22222222-0000-0000-0000-000000000001',
    'MAH-NSK-SC-01',
    'Sub-Centre Harsul (Arogya Mandir)',
    'sub_centre',
    'Nashik',
    'Trimbakeshwar',
    'Harsul',
    '422204',
    20.0831,
    73.4735,
    2,
    1,
    '02594-240010',
    '108',
    '["MCH Checkups", "NCD Vitals Screening", "Oral Rehydration", "Child Weighing"]'::jsonb
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
    12,
    5,
    '02557-221234',
    '108',
    '["Primary OPD", "Labor Room", "Cold Chain Immunization", "Sputum Testing", "Basic Biochemistry"]'::jsonb
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
    100,
    32,
    '02592-222345',
    '108',
    '["Emergency Medicine", "General Surgery", "Gynecology & C-Section", "Pediatric Inpatient", "Radiology"]'::jsonb
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
    500,
    110,
    '0253-2576106',
    '108',
    '["Super Specialty Referral", "Cardiology", "Trauma Center", "Comprehensive Emergency Obstetric and Newborn Care - CEmONC", "Oncology Unit"]'::jsonb
)
ON CONFLICT (facility_code) DO NOTHING;

-- Pune Rural District
INSERT INTO facilities (id, facility_code, name, facility_type, district, taluka, village, pincode, latitude, longitude, total_beds, available_beds, contact_number, emergency_ambulance_number, specialties_available)
VALUES
(
    '33333333-0000-0000-0000-000000000001',
    'MAH-PUN-PHC-01',
    'Primary Health Centre Junnar',
    'phc',
    'Pune',
    'Junnar',
    'Junnar Rural',
    '410502',
    19.2081,
    73.8761,
    10,
    6,
    '02132-222111',
    '108',
    '["Outpatient Care", "NCD Screening", "Normal Delivery", "DOTS TB Center", "Telemedicine"]'::jsonb
),
(
    '33333333-0000-0000-0000-000000000002',
    'MAH-PUN-RH-01',
    'Rural Hospital Manchar',
    'rural_hospital',
    'Pune',
    'Ambegaon',
    'Manchar',
    '410503',
    19.0064,
    73.9427,
    30,
    9,
    '02133-223400',
    '108',
    '["Secondary Care", "Obstetrics & Gynecology", "Pediatrics", "Surgical OPD", "Blood Bank"]'::jsonb
)
ON CONFLICT (facility_code) DO NOTHING;
