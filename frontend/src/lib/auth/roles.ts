import type { User } from '@supabase/supabase-js';

export type CareGridRole = 'citizen' | 'asha' | 'doctor' | 'admin';

/**
 * Normalizes any Supabase role string into one of the 4 canonical CAREGRID roles:
 * - citizen
 * - asha
 * - doctor
 * - admin
 */
export function normalizeRole(rawRole?: string | null): CareGridRole | null {
  if (!rawRole || typeof rawRole !== 'string') return null;
  const r = rawRole.toLowerCase().trim();

  // Citizen
  if (r === 'citizen' || r === 'patient') {
    return 'citizen';
  }

  // ASHA / ANM
  if (r === 'asha' || r === 'asha_worker' || r === 'anm' || r === 'anm_worker') {
    return 'asha';
  }

  // Doctor / Medical Officer
  if (r === 'doctor' || r === 'medical_officer' || r === 'specialist_doctor' || r === 'mo_doctor') {
    return 'doctor';
  }

  // Admin / Governance
  if (
    r === 'admin' ||
    r === 'facility_admin' ||
    r === 'district_officer' ||
    r === 'state_admin' ||
    r === 'admin_governance'
  ) {
    return 'admin';
  }

  return null;
}

/**
 * Derives the authoritative user role from authenticated Supabase user metadata.
 * Do NOT trust any client-supplied role parameter or header.
 * Priority: app_metadata.role > user_metadata.role > fallback 'citizen'.
 */
export function getRoleFromUser(user: User | null): CareGridRole {
  if (!user) return 'citizen';

  // 1. Prioritize app_metadata (secure server-assigned claims)
  const appRole = normalizeRole(user.app_metadata?.role || user.app_metadata?.user_role);
  if (appRole) return appRole;

  // 2. Inspect user_metadata (profile metadata)
  const userRole = normalizeRole(user.user_metadata?.role || user.user_metadata?.user_role);
  if (userRole) return userRole;

  // 3. Default fallback for authenticated users per database schema default
  return 'citizen';
}

/**
 * Checks whether a user role satisfies the required roles.
 * 'admin' has supervisory clearance across all roles and workspaces.
 */
export function isRoleAuthorized(userRole: CareGridRole, allowedRoles: CareGridRole[]): boolean {
  if (userRole === 'admin') return true;
  return allowedRoles.includes(userRole);
}

/**
 * Maps a canonical role to its primary dashboard workspace path.
 */
export function getWorkspaceForRole(role: CareGridRole): string {
  switch (role) {
    case 'asha':
      return '/asha';
    case 'doctor':
      return '/doctor';
    case 'admin':
      return '/admin';
    case 'citizen':
    default:
      return '/citizen';
  }
}
