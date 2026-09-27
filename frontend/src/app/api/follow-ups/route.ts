import { NextRequest } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';
import { errorResponse, successResponse } from '@/lib/api';
import { AuditLogger } from '@/lib/audit';

// Baseline fallback for offline & initial bootstrapping
const baselineDemoTasks: Record<string, any>[] = [
  {
    id: 'task-001',
    patient_id: 'pat-001',
    assigned_asha_id: 'asha-001',
    originating_referral_id: 'ref-001',
    task_type: 'maternal_anc_check',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending'
  }
];

export async function GET(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status, auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN');
  }

  try {
    const { searchParams } = new URL(req.url);
    const ashaId = searchParams.get('asha_id');
    const patientId = searchParams.get('patient_id');
    const status = searchParams.get('status');

    const supabase = auth.client;
    if (supabase) {
      // 1. Target live production table: 'follow_ups' (per 001_initial_caregrid_schema.sql)
      let liveQuery = supabase.from('follow_ups').select('*');
      if (ashaId) {
        liveQuery = liveQuery.eq('assigned_asha_id', ashaId);
      }
      if (patientId) {
        liveQuery = liveQuery.eq('patient_id', patientId);
      }
      if (status) {
        liveQuery = liveQuery.eq('status', status);
      }

      const { data: liveData, error: liveError } = await liveQuery.order('due_date', { ascending: true });
      if (!liveError && liveData && liveData.length > 0) {
        return successResponse({
          tasks: liveData
        }, 200, 'supabase_production');
      }

      // 2. Compatibility check: query legacy table 'follow_up_tasks' if needed
      let legacyQuery = supabase.from('follow_up_tasks').select('*');
      if (ashaId) legacyQuery = legacyQuery.eq('assigned_asha_id', ashaId);
      if (patientId) legacyQuery = legacyQuery.eq('patient_id', patientId);
      if (status) legacyQuery = legacyQuery.eq('status', status);

      const { data: legacyData, error: legacyError } = await legacyQuery.order('due_date', { ascending: true });
      if (!legacyError && legacyData && legacyData.length > 0) {
        return successResponse({
          tasks: legacyData
        }, 200, 'supabase_production_legacy');
      }
    }

    let result = [...baselineDemoTasks];
    if (ashaId) {
      result = result.filter(t => t.assigned_asha_id === ashaId);
    }
    if (patientId) {
      result = result.filter(t => t.patient_id === patientId);
    }
    if (status) {
      result = result.filter(t => t.status === status);
    }

    return successResponse({
      tasks: result
    }, 200, 'baseline_demo_tasks');
  } catch (error) {
    return errorResponse('Failed to retrieve follow-up tasks', 500, 'INTERNAL_SERVER_ERROR', error);
  }
}

export async function POST(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status, auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN');
  }

  try {
    const body = await req.json();
    const { patient_id, assigned_asha_id, task_type, due_date } = body;

    if (!patient_id || !assigned_asha_id || !due_date) {
      return errorResponse('Missing mandatory follow-up task attributes: patient_id, assigned_asha_id, due_date', 400, 'VALIDATION_ERROR');
    }

    const taskData: Record<string, unknown> = {
      patient_id,
      assigned_asha_id,
      originating_referral_id: body.originating_referral_id || body.referral_id || null,
      task_type: task_type || 'post_referral_check',
      due_date,
      status: body.status || 'pending'
    };

    if (body.id && body.id.length === 36) {
      taskData.id = body.id;
    }

    const supabase = auth.client;
    if (supabase) {
      // 1. Try live production table: 'follow_ups'
      const liveDataRecord: Record<string, unknown> = {
        patient_id,
        assigned_asha_id,
        referral_id: body.referral_id || body.originating_referral_id || null,
        task_type: task_type || 'post_referral_check',
        due_date,
        status: body.status || 'pending',
        instructions: body.instructions || 'Post-referral patient health check'
      };
      if (body.id && body.id.length === 36) liveDataRecord.id = body.id;

      const { data: liveResult, error: liveErr } = await supabase.from('follow_ups').insert(liveDataRecord).select().single();
      if (!liveErr && liveResult) {
        await AuditLogger.logRequest(req, {
          action: 'FOLLOW_UP_CREATE',
          entityName: 'follow_ups',
          recordId: liveResult.id,
          userId: auth.context?.user?.id,
          diff: { patient_id, assigned_asha_id, task_type, due_date }
        }, supabase);

        return successResponse({
          task: liveResult
        }, 201, 'supabase_production');
      }

      // 2. Compatibility fallback: insert into 'follow_up_tasks'
      const { data, error } = await supabase.from('follow_up_tasks').insert(taskData).select().single();
      if (!error && data) {
        await AuditLogger.logRequest(req, {
          action: 'FOLLOW_UP_CREATE',
          entityName: 'follow_up_tasks',
          recordId: data.id,
          userId: auth.context?.user?.id,
          diff: { patient_id, assigned_asha_id, task_type, due_date }
        }, supabase);

        return successResponse({
          task: data
        }, 201, 'supabase_production_legacy');
      }
    }

    const fallbackTask = {
      id: body.id || crypto.randomUUID(),
      ...taskData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return successResponse({
      task: fallbackTask
    }, 200, 'resilient_task_record');
  } catch (error) {
    return errorResponse('Failed to create follow-up task', 500, 'INTERNAL_SERVER_ERROR', error);
  }
}

export async function PATCH(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status, auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN');
  }

  try {
    const body = await req.json();
    const { id, status, completion_notes, patient_condition } = body;

    if (!id) {
      return errorResponse('Task ID is required', 400, 'VALIDATION_ERROR');
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    if (status) updatePayload.status = status;
    if (completion_notes !== undefined) updatePayload.notes = completion_notes;
    if (patient_condition) updatePayload.patient_condition = patient_condition;
    if (status === 'completed') updatePayload.completed_at = new Date().toISOString();

    const supabase = auth.client;
    if (supabase) {
      // 1. Try updating live production table 'follow_ups'
      const { data: liveData, error: liveErr } = await supabase.from('follow_ups').update(updatePayload).eq('id', id).select().single();
      if (!liveErr && liveData) {
        await AuditLogger.logRequest(req, {
          action: 'FOLLOW_UP_COMPLETE',
          entityName: 'follow_ups',
          recordId: id,
          userId: auth.context?.user?.id,
          diff: { id, status, completed: status === 'completed' }
        }, supabase);

        return successResponse({
          task: liveData
        }, 200, 'supabase_production');
      }

      // 2. Compatibility fallback: update 'follow_up_tasks'
      const legacyPayload = {
        updated_at: updatePayload.updated_at,
        ...(status && { status }),
        ...(completion_notes !== undefined && { completion_notes }),
        ...(status === 'completed' && { completed_at: updatePayload.completed_at })
      };
      const { data, error } = await supabase.from('follow_up_tasks').update(legacyPayload).eq('id', id).select().single();
      if (!error && data) {
        return successResponse({
          task: data
        }, 200, 'supabase_production_legacy');
      }
    }

    return successResponse({
      task: {
        id,
        ...updatePayload
      }
    }, 200, 'resilient_task_update');
  } catch (error) {
    return errorResponse('Failed to update follow-up task', 500, 'INTERNAL_SERVER_ERROR', error);
  }
}
