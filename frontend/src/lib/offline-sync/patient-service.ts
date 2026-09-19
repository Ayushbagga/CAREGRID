import { offlineDb } from './db';
import { SyncManager } from './sync-manager';
import type { Patient, Vitals } from '@/types/healthcare';

export interface LocalScreeningEncounter {
  id: string;
  patient_id: string;
  patient_name: string;
  encounter_type: 'asha_home_visit';
  vitals: Vitals;
  symptoms: string[];
  clinical_notes?: string;
  detected_danger_signs: string[];
  is_emergency: boolean;
  encounter_date: string;
  is_synced: boolean;
}

// Initial Seed Data for remote offline testing
const INITIAL_DEMO_PATIENTS: Patient[] = [
  {
    id: 'p-001',
    abha_id: 'HID-MH-4456-7890',
    full_name: 'अनिता ज्ञानेश्वर मेश्राम (Anita Meshram)',
    estimated_age: 26,
    gender: 'female',
    primary_phone: '9823001122',
    village: 'रेगुंठा (Reguntha)',
    taluka: 'सिरोंचा (Sironcha)',
    district: 'गडचिरोली (Gadchiroli)',
    primary_facility_id: '11111111-0000-0000-0000-000000000002',
    is_pregnant: true,
    gestational_age_weeks: 32,
    high_risk_pregnancy: true,
    chronic_conditions: ['सिकलसेल (Sickle Cell Trait)'],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'p-002',
    abha_id: 'HID-MH-8890-1234',
    full_name: 'बापूराव लिंगू आत्राम (Bapurao Atram)',
    estimated_age: 58,
    gender: 'male',
    primary_phone: '9421889900',
    village: 'रेगुंठा (Reguntha)',
    taluka: 'सिरोंचा (Sironcha)',
    district: 'गडचिरोली (Gadchiroli)',
    primary_facility_id: '11111111-0000-0000-0000-000000000002',
    is_pregnant: false,
    high_risk_pregnancy: false,
    chronic_conditions: ['उच्च रक्तदाब (Hypertension)'],
    created_at: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: 'p-003',
    full_name: 'सुनीता काळू कोवासे (Sunita Kowase)',
    estimated_age: 22,
    gender: 'female',
    primary_phone: '9765123456',
    village: 'रेगुंठा (Reguntha)',
    taluka: 'सिरोंचा (Sironcha)',
    district: 'गडचिरोली (Gadchiroli)',
    primary_facility_id: '11111111-0000-0000-0000-000000000002',
    is_pregnant: true,
    gestational_age_weeks: 18,
    high_risk_pregnancy: false,
    chronic_conditions: [],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

export class PatientService {
  /**
   * Initializes local database with demo patients if empty
   */
  public static async seedIfEmpty(): Promise<void> {
    if (typeof window === 'undefined') return;
    const count = await offlineDb.localPatients.count();
    if (count === 0) {
      await offlineDb.localPatients.bulkAdd(INITIAL_DEMO_PATIENTS);
    }
  }

  /**
   * Registers a patient locally in Dexie and enqueues for background sync
   */
  public static async registerPatient(patientData: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
    const id = crypto.randomUUID();
    const newPatient: Patient = {
      ...patientData,
      id,
      created_at: new Date().toISOString()
    };

    // 1. Save to local Dexie storage immediately (guarantees offline availability)
    await offlineDb.localPatients.add(newPatient);

    // 2. Add to Sync Queue
    await SyncManager.enqueue('patient', 'CREATE', newPatient);

    // 3. Attempt immediate online transmission if network is up
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      SyncManager.processQueue().catch(() => {});
    }

    return newPatient;
  }

  /**
   * Retrieves all local patients with search and filter
   */
  public static async getPatients(query: string = '', filter: 'all' | 'pregnant' | 'highRisk' | 'chronic' = 'all'): Promise<Patient[]> {
    await this.seedIfEmpty();
    let collection = await offlineDb.localPatients.toArray();

    if (filter === 'pregnant') {
      collection = collection.filter(p => p.is_pregnant);
    } else if (filter === 'highRisk') {
      collection = collection.filter(p => p.high_risk_pregnancy);
    } else if (filter === 'chronic') {
      collection = collection.filter(p => p.chronic_conditions && p.chronic_conditions.length > 0);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      collection = collection.filter(p => 
        p.full_name.toLowerCase().includes(q) ||
        p.village.toLowerCase().includes(q) ||
        p.primary_phone.includes(q)
      );
    }

    // Sort newest first
    return collection.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Evaluates vital sign anomalies locally on the device (Immediate front-line assist)
   */
  public static evaluateDangerSigns(vitals: Vitals, isPregnant: boolean, symptoms: string[]): {
    dangerSigns: string[];
    isEmergency: boolean;
  } {
    const dangerSigns: string[] = [];
    let isEmergency = false;

    // SpO2
    if (vitals.spo2_percentage !== undefined && vitals.spo2_percentage !== null) {
      if (vitals.spo2_percentage < 90) {
        dangerSigns.push(`गंभीर हायपोक्सिया (Severe Hypoxia): SpO2 ${vitals.spo2_percentage}% (< 90%)`);
        isEmergency = true;
      } else if (vitals.spo2_percentage <= 93) {
        dangerSigns.push(`कमी ऑक्सिजन (Low Oxygen): SpO2 ${vitals.spo2_percentage}% (90-93%)`);
      }
    }

    // Blood Pressure
    if (vitals.systolic_bp || vitals.diastolic_bp) {
      const sys = vitals.systolic_bp || 0;
      const dia = vitals.diastolic_bp || 0;

      if (isPregnant) {
        if (sys >= 160 || dia >= 110) {
          dangerSigns.push(`अति-गंभीर गर्भार रक्तदाब (Severe Pre-Eclampsia Alert): BP ${sys}/${dia} mmHg`);
          isEmergency = true;
        } else if (sys >= 140 || dia >= 90) {
          dangerSigns.push(`गर्भावस्थेतील उच्च रक्तदाब (Gestational Hypertension): BP ${sys}/${dia} mmHg`);
        }
      } else {
        if (sys >= 180 || dia >= 120) {
          dangerSigns.push(`अत्यंत उच्च रक्तदाब (Hypertensive Crisis): BP ${sys}/${dia} mmHg`);
          isEmergency = true;
        } else if (sys < 80 && sys > 0) {
          dangerSigns.push(`गंभीर अल्प रक्तदाब (Severe Hypotension / Shock): Systolic ${sys} mmHg (< 80)`);
          isEmergency = true;
        }
      }
    }

    // Heart Rate
    if (vitals.heart_rate_bpm) {
      if (vitals.heart_rate_bpm > 130) {
        dangerSigns.push(`अतिजलद नाडी (Severe Tachycardia): ${vitals.heart_rate_bpm} bpm (> 130)`);
        isEmergency = true;
      } else if (vitals.heart_rate_bpm < 40) {
        dangerSigns.push(`अतिसंत नाडी (Severe Bradycardia): ${vitals.heart_rate_bpm} bpm (< 40)`);
        isEmergency = true;
      }
    }

    // High Risk Symptoms
    if (symptoms.includes('chestPain')) {
      dangerSigns.push('तीव्र छातीत दुखणे (Acute Chest Pain Alert)');
      isEmergency = true;
    }
    if (symptoms.includes('convulsions')) {
      dangerSigns.push('फेफरे / झटके (Active Convulsion Danger Sign)');
      isEmergency = true;
    }
    if (symptoms.includes('bleeding')) {
      dangerSigns.push('तीव्र रक्तस्राव (Severe Bleeding / Hemorrhage)');
      isEmergency = true;
    }
    if (symptoms.includes('breathlessness')) {
      dangerSigns.push('तीव्र श्वसन कष्ट (Severe Respiratory Distress)');
      isEmergency = true;
    }

    return { dangerSigns, isEmergency };
  }

  /**
   * Records a field vitals & screening encounter
   */
  public static async recordEncounter(
    patientId: string,
    patientName: string,
    vitals: Vitals,
    symptoms: string[],
    clinicalNotes: string,
    isPregnant: boolean
  ): Promise<LocalScreeningEncounter> {
    const { dangerSigns, isEmergency } = this.evaluateDangerSigns(vitals, isPregnant, symptoms);
    const encounterId = crypto.randomUUID();

    const encounter: LocalScreeningEncounter = {
      id: encounterId,
      patient_id: patientId,
      patient_name: patientName,
      encounter_type: 'asha_home_visit',
      vitals,
      symptoms,
      clinical_notes: clinicalNotes,
      detected_danger_signs: dangerSigns,
      is_emergency: isEmergency,
      encounter_date: new Date().toISOString(),
      is_synced: false
    };

    // Save locally
    await offlineDb.localEncounters.add({
      id: encounterId,
      patient_id: patientId,
      encounter_type: 'asha_home_visit',
      chief_complaints: symptoms,
      vitals,
      clinical_notes: clinicalNotes,
      created_at: encounter.encounter_date,
      is_synced: false
    });

    // Enqueue for background sync
    await SyncManager.enqueue('encounter', 'CREATE', encounter);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      SyncManager.processQueue().catch(() => {});
    }

    return encounter;
  }
}
