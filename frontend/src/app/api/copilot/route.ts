import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';
import { errorResponse, successResponse } from '@/lib/api';
import { AuditLogger } from '@/lib/audit';
import { CopilotService, type UserRole } from '@/lib/copilot';

/**
 * POST /api/copilot
 * Role-authorized Care Copilot and Command Center query endpoint.
 * Protected roles: 'asha', 'doctor', 'admin'
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeRequest(req, ['asha', 'doctor', 'admin']);
  if (!auth.authorized) {
    return errorResponse(
      auth.error || 'Unauthorized: Care Copilot requires an authorized healthcare role',
      auth.status,
      auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const role = (auth.context?.role as UserRole) || 'doctor';
    const userId = auth.context?.user?.id;
    const supabase = auth.client;

    const response = await CopilotService.executeQuery(body, role, userId, supabase);

    // Audit log copilot query execution
    await AuditLogger.logRequest(
      req,
      {
        action: 'COPILOT_QUERY',
        entityName: 'copilot',
        userId,
        diff: {
          intent: response.intent,
          role,
          engine: response.engine,
          signals_count: response.protocol_signals.length
        }
      },
      supabase
    );

    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(
      'Failed to execute Care Copilot request',
      500,
      'INTERNAL_SERVER_ERROR',
      error
    );
  }
}
