import { offlineDb } from './db';
import { SyncManager } from './sync-manager';
import type { Appointment, UrgencyTier, AppointmentStatus } from '@/types/healthcare';

const INITIAL_DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    patient_id: 'p-001', // Anita Meshram (Pre-eclamptic / high risk pregnancy)
    facility_id: '11111111-0000-0000-0000-000000000002', // PHC Bhamragad
    token_number: 104,
    queue_tier: 'emergency_red',
    appointment_type: 'physical_opd',
    scheduled_date: new Date().toISOString().split('T')[0],
    status: 'in_queue',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'apt-002',
    patient_id: 'p-002', // Bapurao Atram (Hypertension checkup)
    facility_id: '11111111-0000-0000-0000-000000000002',
    token_number: 101,
    queue_tier: 'urgent_amber',
    appointment_type: 'physical_opd',
    scheduled_date: new Date().toISOString().split('T')[0],
    status: 'in_queue',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'apt-003',
    patient_id: 'p-003', // Sunita Kowase (Routine antenatal visit)
    facility_id: '11111111-0000-0000-0000-000000000002',
    token_number: 102,
    queue_tier: 'routine_green',
    appointment_type: 'physical_opd',
    scheduled_date: new Date().toISOString().split('T')[0],
    status: 'in_queue',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

export class QueueService {
  /**
   * Seeds demo queue appointments if empty
   */
  public static async seedIfEmpty(): Promise<void> {
    if (typeof window === 'undefined') return;
    const count = await offlineDb.localAppointments.count();
    if (count === 0) {
      await offlineDb.localAppointments.bulkAdd(INITIAL_DEMO_APPOINTMENTS);
    }
  }

  /**
   * Generates a new appointment token with clinical urgency tier
   */
  public static async generateToken(params: {
    patient_id: string;
    facility_id: string;
    appointment_type?: 'physical_opd' | 'rural_teleconsultation';
    queue_tier?: UrgencyTier;
    webrtc_room_id?: string;
  }): Promise<Appointment> {
    await this.seedIfEmpty();
    const today = new Date().toISOString().split('T')[0];
    const existing = await offlineDb.localAppointments
      .where('facility_id')
      .equals(params.facility_id)
      .toArray();

    const todayTokens = existing.filter(a => a.scheduled_date === today);
    const maxToken = todayTokens.reduce((max, a) => (a.token_number > max ? a.token_number : max), 100);
    const nextTokenNumber = maxToken + 1;

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      patient_id: params.patient_id,
      facility_id: params.facility_id,
      token_number: nextTokenNumber,
      queue_tier: params.queue_tier || 'routine_green',
      appointment_type: params.appointment_type || 'physical_opd',
      scheduled_date: today,
      status: 'in_queue',
      webrtc_room_id: params.webrtc_room_id,
      created_at: new Date().toISOString()
    };

    await offlineDb.localAppointments.add(newAppointment);
    await SyncManager.enqueue('appointment' as any, 'CREATE', newAppointment);

    return newAppointment;
  }

  /**
   * Retrieves OPD Queue for facility, sorted strictly by clinical urgency:
   * 1. emergency_red
   * 2. urgent_amber
   * 3. routine_green
   * within same tier, ordered by token_number / arrival time
   */
  public static async getFacilityQueue(facilityId: string, date?: string): Promise<Appointment[]> {
    await this.seedIfEmpty();
    const targetDate = date || new Date().toISOString().split('T')[0];

    const list = await offlineDb.localAppointments
      .where('facility_id')
      .equals(facilityId)
      .toArray();

    const filtered = list.filter(a => a.scheduled_date === targetDate && a.status !== 'completed' && a.status !== 'cancelled');

    const tierWeight: Record<UrgencyTier, number> = {
      emergency_red: 1,
      urgent_amber: 2,
      routine_green: 3
    };

    return filtered.sort((a, b) => {
      const weightA = tierWeight[a.queue_tier] || 3;
      const weightB = tierWeight[b.queue_tier] || 3;

      if (weightA !== weightB) {
        return weightA - weightB; // Lower weight = higher urgency
      }
      return a.token_number - b.token_number;
    });
  }

  /**
   * Updates status of an appointment in queue
   */
  public static async updateStatus(id: string, status: AppointmentStatus): Promise<void> {
    await offlineDb.localAppointments.update(id, { status });
    await SyncManager.enqueue('appointment' as any, 'UPDATE', { id, status });
  }
}
