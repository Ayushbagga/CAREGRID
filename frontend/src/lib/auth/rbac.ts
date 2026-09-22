import { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { 
  CareGridRole, 
  normalizeRole, 
  getRoleFromUser, 
  isRoleAuthorized, 
  getWorkspaceForRole 
} from './roles';

export { normalizeRole, getRoleFromUser, isRoleAuthorized, getWorkspaceForRole };
export type { CareGridRole };

export interface AuthContext {
  user: User;
  role: CareGridRole;
}

export interface AuthResult {
  authorized: boolean;
  status: 200 | 401 | 403;
  error?: string;
  context?: AuthContext;
}

/**
 * Single reusable server-side authorization helper for Next.js Route Handlers and Server Components.
 * Inspects both session cookies and Authorization: Bearer <token> headers.
 * 
 * Returns:
 * - { authorized: true, status: 200, context: { user, role } }
 * - { authorized: false, status: 401, error: 'Unauthorized: ...' }
 * - { authorized: false, status: 403, error: 'Forbidden: ...' }
 */
export async function authorizeRequest(
  req: NextRequest | undefined,
  allowedRoles: CareGridRole[]
): Promise<AuthResult> {
  try {
    const supabase = await createServerClient();
    let user: User | null = null;

    // 1. Inspect Authorization Bearer token if request header is present
    const authHeader = req?.headers?.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        const { data: bearerData, error: bearerErr } = await supabase.auth.getUser(token);
        if (!bearerErr && bearerData?.user) {
          user = bearerData.user;
        }
      }
    }

    // 2. Fall back to secure session cookies if no valid Bearer token
    if (!user) {
      const { data: cookieData, error: cookieErr } = await supabase.auth.getUser();
      if (!cookieErr && cookieData?.user) {
        user = cookieData.user;
      }
    }

    // 3. Unauthenticated session check
    if (!user) {
      return {
        authorized: false,
        status: 401,
        error: 'Unauthorized: Authentication session required'
      };
    }

    // 4. Derive authoritative role from authenticated metadata (never from query/body)
    const userRole = getRoleFromUser(user);

    // 5. Evaluate role authorization
    if (!isRoleAuthorized(userRole, allowedRoles)) {
      return {
        authorized: false,
        status: 403,
        error: `Forbidden: Role '${userRole}' is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`,
        context: { user, role: userRole }
      };
    }

    return {
      authorized: true,
      status: 200,
      context: { user, role: userRole }
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authorization check failed';
    return {
      authorized: false,
      status: 500 as 401 | 403,
      error: `Internal authorization error: ${message}`
    };
  }
}
