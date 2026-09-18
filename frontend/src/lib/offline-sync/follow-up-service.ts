import { offlineDb } from './db';
import type { FollowUpTask, FollowUpStatus, Vitals } from '@/types/healthcare';
import { PatientService } from './patient-service';

export interface CreateTaskInput {
  patient_id: string;
  assigned_asha_id: string;
  originating_referral_id?: string;
  task_type: FollowUpTask['task_type'];
  due_date: string;
}

export class FollowUpService {
  /**
   * Initializes demo follow-up tasks for rural field health workers if empty
   */
  public static async initializeSeedTasks(): Promise<void> {
    if (typeof window === 'undefined') return;
    const count = await offlineDb.localFollowUpTasks.count();
    if (count === 0) {
      const today = new Date().toISOString().split('T')[0];
      const overdueDate = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0];

      const demoTasks: FollowUpTask[] = [
        {
          id: 'task-001',
          patient_id: 'pat-001', // Sunita Gawade
          assigned_asha_id: 'asha-001',
          originating_referral_id: 'ref-001',
          task_type: 'maternal_anc_check',
          due_date: today,
          status: 'pending'
        },
        {
          id: 'task-002',
          patient_id: 'pat-002', // Ramesh Jadhav
          assigned_asha_id: 'asha-001',
          task_type: 'chronic_vitals_check',
          due_date: overdueDate,
          status: 'pending'
        },
        {
          id: 'task-003',
          patient_id: 'pat-003', // Anusaya Bai
          assigned_asha_id: 'asha-001',
          task_type: 'routine_follow_up',
          due_date: futureDate,
          status: 'pending'
        }
      ];

      await offlineDb.localFollowUpTasks.bulkAdd(demoTasks);
    }
  }

  /**
   * Retrieves follow-up tasks assigned to a specific ASHA worker
   */
  public static async getTasksForAsha(ashaId: string = 'asha-001'): Promise<{
    overdue: FollowUpTask[];
    dueToday: FollowUpTask[];
    upcoming: FollowUpTask[];
    all: FollowUpTask[];
  }> {
    if (typeof window === 'undefined') {
      return { overdue: [], dueToday: [], upcoming: [], all: [] };
    }
    await this.initializeSeedTasks();

    const tasks = await offlineDb.localFollowUpTasks
      .where('assigned_asha_id')
      .equals(ashaId)
      .toArray();

    const todayStr = new Date().toISOString().split('T')[0];
    const pendingTasks = tasks.filter(t => t.status === 'pending');

    const overdue = pendingTasks.filter(t => t.due_date < todayStr);
    const dueToday = pendingTasks.filter(t => t.due_date === todayStr);
    const upcoming = pendingTasks.filter(t => t.due_date > todayStr);

    return {
      overdue,
      dueToday,
      upcoming,
      all: tasks.sort((a, b) => a.due_date.localeCompare(b.due_date))
    };
  }

  /**
   * Creates a new assigned follow-up task
   */
  public static async createTask(input: CreateTaskInput): Promise<FollowUpTask> {
    const id = crypto.randomUUID();
    const task: FollowUpTask = {
      id,
      patient_id: input.patient_id,
      assigned_asha_id: input.assigned_asha_id,
      originating_referral_id: input.originating_referral_id,
      task_type: input.task_type,
      due_date: input.due_date,
      status: 'pending'
    };

    if (typeof window !== 'undefined') {
      await offlineDb.localFollowUpTasks.add(task);
      await offlineDb.syncQueue.add({
        id: crypto.randomUUID(),
        entity_type: 'follow_up',
        operation: 'CREATE',
        payload: task,
        created_at: new Date().toISOString(),
        retry_count: 0,
        status: 'PENDING'
      });
    }

    return task;
  }

  /**
   * Records completion of home visit with observations and optional vitals check
   */
  public static async completeTask(
    taskId: string,
    completionNotes: string,
    vitals?: Vitals
  ): Promise<FollowUpTask> {
    const task = await offlineDb.localFollowUpTasks.get(taskId);
    if (!task) throw new Error('Task not found');

    const now = new Date().toISOString();
    const updated: FollowUpTask = {
      ...task,
      status: 'completed',
      completion_notes: completionNotes,
      completed_at: now
    };

    await offlineDb.localFollowUpTasks.put(updated);

    // If vitals were recorded during this home visit, persist to patient's clinical history
    if (vitals && task.patient_id) {
      const patient = await offlineDb.localPatients.get(task.patient_id);
      await PatientService.recordEncounter(
        task.patient_id,
        patient?.full_name || 'Patient',
        vitals,
        ['Home visit follow-up screening'],
        completionNotes,
        Boolean(patient?.is_pregnant)
      );
    }

    await offlineDb.syncQueue.add({
      id: crypto.randomUUID(),
      entity_type: 'follow_up',
      operation: 'UPDATE',
      payload: updated,
      created_at: now,
      retry_count: 0,
      status: 'PENDING'
    });

    return updated;
  }

  /**
   * Retrieves active follow-up reminders for a citizen/patient
   */
  public static async getPatientReminders(patientId: string): Promise<{
    activeReminders: FollowUpTask[];
    completedVisits: FollowUpTask[];
  }> {
    if (typeof window === 'undefined') {
      return { activeReminders: [], completedVisits: [] };
    }
    await this.initializeSeedTasks();

    const tasks = await offlineDb.localFollowUpTasks
      .where('patient_id')
      .equals(patientId)
      .toArray();

    return {
      activeReminders: tasks.filter(t => t.status === 'pending'),
      completedVisits: tasks.filter(t => t.status === 'completed')
    };
  }
}
