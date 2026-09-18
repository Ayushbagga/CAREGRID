import { offlineDb } from './db';
import type { Referral, ReferralStatus, UrgencyTier } from '@/types/healthcare';
import { FollowUpService } from './follow-up-service';

export interface CreateReferralInput {
  patient_id: string;
  encounter_id?: string;
  from_facility_id: string;
  to_facility_id: string;
  referring_officer_id: string;
  referral_reason: string;
  required_specialty: string;
  urgency_tier: UrgencyTier;
}

export class ReferralService {
  /**
   * Initializes demo referrals for rural Maharashtra if table is empty
   */
  public static async initializeSeedReferrals(): Promise<void> {
    if (typeof window === 'undefined') return;
    const count = await offlineDb.localReferrals.count();
    if (count === 0) {
      const demoReferrals: Referral[] = [
        {
          id: 'ref-001',
          referral_code: 'REF-MH-GAD-7821',
          patient_id: 'pat-001', // Sunita Gawade
          from_facility_id: 'fac-001', // Chamorshi PHC
          to_facility_id: 'fac-002', // Gadchiroli District Hospital
          referring_officer_id: 'doc-001',
          receiving_doctor_id: 'doc-dh-001',
          referral_reason: 'Severe gestational hypertension (160/110) at 34 weeks gestation requiring specialist Obstetrician management and fetal non-stress test.',
          required_specialty: 'Obstetrics & Gynecology',
          urgency_tier: 'emergency_red',
          status: 'acknowledged',
          created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
        },
        {
          id: 'ref-002',
          referral_code: 'REF-MH-NAS-4190',
          patient_id: 'pat-002', // Ramesh Jadhav
          from_facility_id: 'fac-001',
          to_facility_id: 'fac-003', // Dindori Rural Hospital
          referring_officer_id: 'doc-001',
          referral_reason: 'Uncontrolled Type 2 Diabetes with diabetic foot lesion requiring secondary wound care and specialist physician evaluation.',
          required_specialty: 'General Medicine / Surgery',
          urgency_tier: 'urgent_amber',
          status: 'initiated',
          created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
        }
      ];

      await offlineDb.localReferrals.bulkAdd(demoReferrals);
    }
  }

  /**
   * Retrieves referrals matching optional facility, patient or status filters
   */
  public static async getReferrals(filters?: {
    fromFacilityId?: string;
    toFacilityId?: string;
    patientId?: string;
    status?: ReferralStatus;
  }): Promise<Referral[]> {
    if (typeof window === 'undefined') return [];
    await this.initializeSeedReferrals();

    let query = offlineDb.localReferrals.toCollection();

    if (filters?.patientId) {
      return await offlineDb.localReferrals.where('patient_id').equals(filters.patientId).toArray();
    }
    if (filters?.toFacilityId) {
      return await offlineDb.localReferrals.where('to_facility_id').equals(filters.toFacilityId).toArray();
    }
    if (filters?.fromFacilityId) {
      return await offlineDb.localReferrals.where('from_facility_id').equals(filters.fromFacilityId).toArray();
    }

    const all = await query.toArray();
    if (filters?.status) {
      return all.filter(r => r.status === filters.status);
    }
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Creates and registers a new referral
   */
  public static async createReferral(input: CreateReferralInput): Promise<Referral> {
    const id = crypto.randomUUID();
    const shortCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `REF-MH-${shortCode}-${Date.now().toString().slice(-4)}`;

    const newReferral: Referral = {
      id,
      referral_code: referralCode,
      patient_id: input.patient_id,
      encounter_id: input.encounter_id,
      from_facility_id: input.from_facility_id,
      to_facility_id: input.to_facility_id,
      referring_officer_id: input.referring_officer_id,
      referral_reason: input.referral_reason,
      required_specialty: input.required_specialty,
      urgency_tier: input.urgency_tier,
      status: 'initiated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      await offlineDb.localReferrals.add(newReferral);
      await offlineDb.syncQueue.add({
        id: crypto.randomUUID(),
        entity_type: 'referral',
        operation: 'CREATE',
        payload: newReferral,
        created_at: new Date().toISOString(),
        retry_count: 0,
        status: 'PENDING'
      });
    }

    return newReferral;
  }

  /**
   * Receiving facility acknowledges referral intake
   */
  public static async acknowledgeReferral(referralId: string, receivingDoctorId?: string): Promise<Referral> {
    const referral = await offlineDb.localReferrals.get(referralId);
    if (!referral) throw new Error('Referral not found');

    const updated: Referral = {
      ...referral,
      status: 'acknowledged',
      receiving_doctor_id: receivingDoctorId || 'doc-dh-001',
      updated_at: new Date().toISOString()
    };

    await offlineDb.localReferrals.put(updated);
    await offlineDb.syncQueue.add({
      id: crypto.randomUUID(),
      entity_type: 'referral',
      operation: 'UPDATE',
      payload: updated,
      created_at: new Date().toISOString(),
      retry_count: 0,
      status: 'PENDING'
    });

    return updated;
  }

  /**
   * Updates clinical evaluation or in-progress care status at receiving facility
   */
  public static async updateReferralEvaluation(referralId: string, notes: string): Promise<Referral> {
    const referral = await offlineDb.localReferrals.get(referralId);
    if (!referral) throw new Error('Referral not found');

    const updated: Referral = {
      ...referral,
      status: 'evaluated',
      discharge_summary: notes,
      updated_at: new Date().toISOString()
    };

    await offlineDb.localReferrals.put(updated);
    await offlineDb.syncQueue.add({
      id: crypto.randomUUID(),
      entity_type: 'referral',
      operation: 'UPDATE',
      payload: updated,
      created_at: new Date().toISOString(),
      retry_count: 0,
      status: 'PENDING'
    });

    return updated;
  }

  /**
   * Completes the referral lifecycle at hospital discharge and automatically
   * creates an assigned follow-up home visit task for the village ASHA
   */
  public static async completeReferral(
    referralId: string,
    dischargeSummary: string,
    instructionsForAsha: string
  ): Promise<{ referral: Referral; followUpTaskId: string }> {
    const referral = await offlineDb.localReferrals.get(referralId);
    if (!referral) throw new Error('Referral not found');

    const now = new Date().toISOString();
    const updated: Referral = {
      ...referral,
      status: 'closed_loop',
      discharge_summary: dischargeSummary,
      post_discharge_instructions_for_asha: instructionsForAsha,
      closed_at: now,
      updated_at: now
    };

    await offlineDb.localReferrals.put(updated);

    // Look up patient to obtain assigned ASHA
    const patient = await offlineDb.localPatients.get(referral.patient_id);
    const assignedAshaId = patient?.assigned_asha_id || 'asha-001';

    // Due date = 3 days post-discharge
    const dueDate = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0];

    // Automatically generate assigned follow-up task for the ASHA worker
    const followUp = await FollowUpService.createTask({
      patient_id: referral.patient_id,
      assigned_asha_id: assignedAshaId,
      originating_referral_id: referral.id,
      task_type: 'post_referral_check',
      due_date: dueDate
    });

    await offlineDb.syncQueue.add({
      id: crypto.randomUUID(),
      entity_type: 'referral',
      operation: 'UPDATE',
      payload: updated,
      created_at: now,
      retry_count: 0,
      status: 'PENDING'
    });

    return { referral: updated, followUpTaskId: followUp.id };
  }
}
