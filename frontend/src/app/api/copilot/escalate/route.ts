import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';
import { errorResponse, successResponse } from '@/lib/api';
import { AuditLogger } from '@/lib/audit';

interface EscalatePayload {
  task_id: string;
  action: 'ESCALATE_OVERDUE' | 'PRIORITIZE_REFERRAL' | 'SCHEDULE_URGENT_VISIT';
  reason?: string;
  confirm: boolean;
  idempotency_key?: string;
}

/**
 * POST /api/copilot/escalate
 * Consequential action endpoint for automated/recommended follow-up escalations.
 * Requires:
 * 1. Role authorization ('asha', 'doctor', 'admin')
 * 2. Explicit confirmation flag (confirm: true)
 * 3. Idempotency tracking
 * 4. Forensic security audit logging
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeRequest(req, ['asha', 'doctor', 'admin']);
  if (!auth.authorized) {
    return errorResponse(
      auth.error || 'Unauthorized: Follow-up escalation requires an authorized role',
      auth.status,
      auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
    );
  }

  try {
    const payload: EscalatePayload = await req.json().catch(() => null);

    if (!payload || !payload.task_id) {
      return errorResponse('task_id is required for escalation', 400, 'BAD_REQUEST');
    }

    // Safety guardrail: Require explicit human-in-the-loop confirmation
    if (payload.confirm !== true) {
      return errorResponse(
        'Consequential action requires explicit human user confirmation (confirm: true).',
        400,
        'CONFIRMATION_REQUIRED'
      );
    }

    const idempotencyKey = payload.idempotency_key || `esc_${payload.task_id}_${new Date().toISOString().split('T')[0]}`;
    const supabase = auth.client;
    const userId = auth.context?.user?.id;

    let updated = false;

    const userRole = auth.context?.role || 'authorized_staff';

    if (supabase) {
      try {
        // Attempt update in follow_ups
        const { error: err1 } = await supabase
          .from('follow_ups')
          .update({
            status: 'scheduled',
            completion_notes: `[ESCALATED by ${userRole}]: ${payload.reason || 'Overdue visit escalation requested'}`
          })
          .eq('id', payload.task_id);

        if (!err1) {
          updated = true;
        } else {
          // Fallback to follow_up_tasks
          const { error: err2 } = await supabase
            .from('follow_up_tasks')
            .update({
              status: 'scheduled',
              completion_notes: `[ESCALATED by ${userRole}]: ${payload.reason || 'Overdue visit escalation requested'}`
            })
            .eq('id', payload.task_id);

          if (!err2) {
            updated = true;
          }
        }
      } catch (err) {
        console.warn('[Copilot Escalate] Database update warning:', err);
      }
    }

    // Mandatory forensic audit log
    await AuditLogger.logRequest(
      req,
      {
        action: 'COPILOT_ACTION_ESCALATE',
        entityName: 'follow_ups',
        recordId: payload.task_id.length === 36 ? payload.task_id : null,
        userId,
        diff: {
          action: payload.action,
          idempotency_key: idempotencyKey,
          confirmed_by_user: true,
          role: userRole,
          database_updated: updated
        }
      },
      supabase
    );

    return successResponse(
      {
        task_id: payload.task_id,
        action: payload.action,
        status: 'escalated',
        idempotency_key: idempotencyKey,
        database_updated: updated
      },
      200,
      'copilot_escalate'
    );
  } catch (error) {
    return errorResponse(
      'Failed to execute follow-up escalation',
      500,
      'INTERNAL_SERVER_ERROR',
      error
    );
  }
}
