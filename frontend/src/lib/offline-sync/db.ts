import Dexie, { type Table } from 'dexie';
import type { Patient, Vitals, Facility, Referral, FollowUpTask, Appointment, OfflineSyncItem } from '@/types/healthcare';

export interface LocalEncounter {
  id: string;
  patient_id: string;
  encounter_type: string;
  chief_complaints: string[];
  vitals?: Vitals;
  clinical_notes?: string;
  created_at: string;
  is_synced: boolean;
}

export class CareGridOfflineDatabase extends Dexie {
  localPatients!: Table<Patient, string>;
  localEncounters!: Table<LocalEncounter, string>;
  localAppointments!: Table<Appointment, string>;
  localReferrals!: Table<Referral, string>;
  localFollowUpTasks!: Table<FollowUpTask, string>;
  cachedFacilities!: Table<Facility, string>;
  syncQueue!: Table<OfflineSyncItem, string>;

  constructor() {
    super('CareGridOfflineDB');
    this.version(2).stores({
      localPatients: 'id, village, taluka, abha_id, is_pregnant',
      localEncounters: 'id, patient_id, created_at, is_synced',
      localAppointments: 'id, facility_id, patient_id, scheduled_date, queue_tier, status',
      localReferrals: 'id, referral_code, patient_id, status',
      localFollowUpTasks: 'id, patient_id, assigned_asha_id, status, due_date',
      cachedFacilities: 'id, district, facility_type',
      syncQueue: 'id, entity_type, status, created_at'
    });
  }
}

export const offlineDb = new CareGridOfflineDatabase();
