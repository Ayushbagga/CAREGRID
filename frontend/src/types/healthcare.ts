export type UserRole =
  | 'citizen'
  | 'asha_worker'
  | 'anm_worker'
  | 'medical_officer'
  | 'specialist_doctor'
  | 'facility_admin'
  | 'district_officer'
  | 'state_admin';

export type FacilityType =
  | 'sub_centre'
  | 'phc'
  | 'chc'
  | 'rural_hospital'
  | 'sub_district_hosp'
  | 'district_hospital';

export type UrgencyTier =
  | 'emergency_red'
  | 'urgent_amber'
  | 'routine_green';

export type ReferralStatus =
  | 'initiated'
  | 'acknowledged'
  | 'evaluated'
  | 'admitted'
  | 'discharged'
  | 'closed_loop';

export type AppointmentStatus =
  | 'scheduled'
  | 'in_queue'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type FollowUpStatus =
  | 'pending'
  | 'completed'
  | 'missed'
  | 'cancelled';

export interface Facility {
  id: string;
  facility_code: string;
  name: string;
  facility_type: FacilityType;
  district: string;
  taluka: string;
  village?: string;
  pincode?: string;
  contact_number: string;
  operating_hours: string;
  services_available: string[];
  specialties_available: string[];
  is_active: boolean;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone_number?: string;
  preferred_language: 'mr' | 'hi' | 'en';
  facility_id?: string;
  assigned_village?: string;
  assigned_taluka?: string;
  assigned_district?: string;
}

export interface Patient {
  id: string;
  abha_id?: string;
  full_name: string;
  date_of_birth?: string;
  estimated_age: number;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  primary_phone: string;
  village: string;
  taluka: string;
  district: string;
  assigned_asha_id?: string;
  primary_facility_id: string;
  is_pregnant: boolean;
  gestational_age_weeks?: number;
  high_risk_pregnancy: boolean;
  chronic_conditions: string[];
  created_at: string;
}

export interface Vitals {
  id?: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate_bpm?: number;
  respiratory_rate_bpm?: number;
  spo2_percentage?: number;
  body_temperature_f?: number;
  random_blood_glucose_mg_dl?: number;
  fetal_heart_rate_bpm?: number;
  recorded_at: string;
}

export interface Encounter {
  id: string;
  patient_id: string;
  facility_id?: string;
  provider_id?: string;
  encounter_type: 'asha_home_visit' | 'phc_opd' | 'teleconsultation';
  chief_complaints: string[];
  clinical_notes?: string;
  provisional_observations?: string;
  diagnostic_tests_ordered?: string[];
  advised_medications?: string[];
  encounter_date: string;
  is_synced_from_offline: boolean;
}

export interface TriageAssessment {
  id?: string;
  urgency_tier: UrgencyTier;
  priority_score: number; // 1 to 10
  detected_red_flags: string[];
  vital_anomalies: string[];
  transport_recommended: boolean;
  recommended_specialty?: string;
  clinical_rationale: string;
  non_diagnostic_disclaimer: string;
  assessed_at: string;
}

export interface Referral {
  id: string;
  referral_code: string;
  patient_id: string;
  encounter_id?: string;
  from_facility_id: string;
  to_facility_id: string;
  referring_officer_id: string;
  receiving_doctor_id?: string;
  referral_reason: string;
  required_specialty: string;
  urgency_tier: UrgencyTier;
  status: ReferralStatus;
  discharge_summary?: string;
  post_discharge_instructions_for_asha?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  facility_id: string;
  doctor_id?: string;
  token_number: number;
  queue_tier: UrgencyTier;
  appointment_type: 'physical_opd' | 'rural_teleconsultation';
  scheduled_date: string;
  status: AppointmentStatus;
  webrtc_room_id?: string;
  created_at: string;
}

export interface FollowUpTask {
  id: string;
  patient_id: string;
  assigned_asha_id: string;
  originating_referral_id?: string;
  task_type: 'post_referral_check' | 'maternal_anc_check' | 'chronic_vitals_check' | 'routine_follow_up';
  due_date: string;
  status: FollowUpStatus;
  completion_notes?: string;
  completed_at?: string;
}

export interface OfflineSyncItem {
  id: string;
  entity_type: 'patient' | 'encounter' | 'vitals' | 'referral' | 'follow_up';
  operation: 'CREATE' | 'UPDATE';
  payload: Record<string, any>;
  created_at: string;
  retry_count: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}
