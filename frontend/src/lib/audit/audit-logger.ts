import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export interface AuditEvent {
  userId?: string | null;
  action: string;
  entityName: string;
  recordId?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  diff?: Record<string, unknown> | null;
}

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'otp',
  'otpcode',
  'secret',
  'authorization',
  'cookie',
  'apikey',
  'api_key'
]);

/**
 * Sanitizes diff payload to prevent credential leakage or PII bloat
 * in append-only forensic audit logs.
 */
export function sanitizeAuditDiff(diff: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!diff || typeof diff !== 'object') return null;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(diff)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditDiff(value as Record<string, unknown>);
    } else if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = `${value.slice(0, 500)}...[TRUNCATED]`;
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Safely extracts client IP address from standard reverse-proxy headers.
 */
export function getClientIp(req?: NextRequest): string | null {
  if (!req) return null;
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  return req.headers.get('x-real-ip') || null;
}

export class AuditLogger {
  /**
   * Records a security-critical audit event directly into public.audit_logs.
   * Safe execution: Never throws unhandled errors or blocks primary API response.
   */
  public static async log(
    event: AuditEvent,
    clientOverride?: SupabaseClient
  ): Promise<boolean> {
    try {
      const supabase = clientOverride || (await createServerClient());
      if (!supabase) return false;

      const record: Record<string, unknown> = {
        action: event.action.toUpperCase(),
        entity_name: event.entityName.toLowerCase(),
        user_id: event.userId || null,
        record_id: event.recordId && event.recordId.length === 36 ? event.recordId : null,
        client_ip: event.clientIp || null,
        user_agent: event.userAgent ? event.userAgent.slice(0, 500) : null,
        diff: sanitizeAuditDiff(event.diff)
      };

      const { error } = await supabase.from('audit_logs').insert(record);
      if (error) {
        console.warn(`[AuditLogger] Insertion warning (${event.action}):`, error.message);
        return false;
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AuditLogger] Failed to write audit event (${event.action}):`, msg);
      return false;
    }
  }

  /**
   * Helper to log an event contextually extracted from an incoming NextRequest.
   */
  public static async logRequest(
    req: NextRequest,
    event: Omit<AuditEvent, 'clientIp' | 'userAgent'>,
    clientOverride?: SupabaseClient
  ): Promise<boolean> {
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get('user-agent');
    return this.log({ ...event, clientIp, userAgent }, clientOverride);
  }
}
