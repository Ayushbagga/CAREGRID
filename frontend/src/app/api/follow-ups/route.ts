import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';

const inMemoryTasks: Record<string, any>[] = [
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
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const ashaId = searchParams.get('asha_id');
    const patientId = searchParams.get('patient_id');

    let result = [...inMemoryTasks];
    if (ashaId) {
      result = result.filter(t => t.assigned_asha_id === ashaId);
    }
    if (patientId) {
      result = result.filter(t => t.patient_id === patientId);
    }

    return NextResponse.json({ success: true, tasks: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve follow-up tasks', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { patient_id, assigned_asha_id, task_type, due_date } = body;

    if (!patient_id || !assigned_asha_id || !due_date) {
      return NextResponse.json(
        { error: 'Missing mandatory follow-up task attributes' },
        { status: 400 }
      );
    }

    const newTask = {
      id: crypto.randomUUID(),
      patient_id,
      assigned_asha_id,
      originating_referral_id: body.originating_referral_id,
      task_type: task_type || 'routine_follow_up',
      due_date,
      status: 'pending'
    };

    inMemoryTasks.push(newTask);

    return NextResponse.json({ success: true, task: newTask });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create follow-up task', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, status, completion_notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const index = inMemoryTasks.findIndex(t => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = inMemoryTasks[index];
    if (status) task.status = status;
    if (completion_notes) task.completion_notes = completion_notes;
    if (status === 'completed') task.completed_at = new Date().toISOString();

    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update follow-up task', details: String(error) },
      { status: 500 }
    );
  }
}
