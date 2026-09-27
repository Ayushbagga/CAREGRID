import { NextRequest } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';
import { errorResponse, successResponse } from '@/lib/api';

/**
 * Health & Configuration probe for Cloud Synchronization
 */
export async function GET(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status, auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN');
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    const isConfigured = Boolean(supabaseUrl && supabaseKey);

    return successResponse({
      configured: isConfigured,
      authReachable: true,
      authStatus: 'authenticated',
      userRole: auth.context?.role,
      userId: auth.context?.user.id,
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      mode: 'offline-first-resilient'
    }, 200, 'sync_probe');
  } catch (error) {
    return errorResponse('Failed to inspect sync status', 500, 'INTERNAL_SERVER_ERROR', error);
  }
}

/**
 * Cloud Synchronization Endpoint
 * Handles batch / individual queue sync requests from SyncManager.
 * Guaranteed idempotent via client UUID tracking.
 */
export async function POST(req: NextRequest) {
  // Authorize request: required role is asha or doctor (admin inherits)
  const auth = await authorizeRequest(req, ['asha', 'doctor']);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status, auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN');
  }

  try {
    const item = await req.json();

    if (!item || !item.entity_type || !item.payload) {
      return errorResponse('Invalid sync payload format: entity_type and payload required', 400, 'VALIDATION_ERROR');
    }

    const supabase = auth.client;
    let cloudSynced = false;

    if (supabase && item.payload) {
      try {
        switch (item.entity_type) {
          case 'patient': {
            const p = item.payload;
            const patientData: Record<string, unknown> = {
              full_name: p.full_name,
              estimated_age: p.estimated_age ?? p.age ?? null,
              gender: p.gender || 'female',
              primary_phone: p.primary_phone,
              village: p.village,
              taluka: p.taluka || 'Sironcha',
              district: p.district || 'Gadchiroli',
              primary_facility_id: p.primary_facility_id || '11111111-0000-0000-0000-000000000002',
              is_pregnant: Boolean(p.is_pregnant),
              high_risk_pregnancy: Boolean(p.high_risk_pregnancy),
              chronic_conditions: Array.isArray(p.chronic_conditions) ? p.chronic_conditions : [],
              created_by: auth.context?.user?.id || null
            };
            if (p.id && p.id.length === 36) patientData.id = p.id;
            if (p.abha_id) patientData.abha_id = p.abha_id;

            const { error } = await supabase.from('patients').upsert(patientData);
            if (!error) cloudSynced = true;
            break;
          }
          case 'encounter': {
            const e = item.payload;
            const encounterData: Record<string, unknown> = {
              patient_id: e.patient_id,
              encounter_type: e.encounter_type || 'asha_home_visit',
              clinical_notes: e.clinical_notes || null,
              client_offline_id: item.id,
              is_synced_from_offline: true,
              encounter_date: e.encounter_date || new Date().toISOString()
            };
            if (e.id && e.id.length === 36) encounterData.id = e.id;
            const { error } = await supabase.from('encounters').upsert(encounterData);
            if (!error) cloudSynced = true;
            break;
          }
          case 'vitals': {
            const v = item.payload;
            const vitalsData: Record<string, unknown> = {
              patient_id: v.patient_id,
              encounter_id: v.encounter_id,
              systolic_bp: v.systolic_bp || null,
              diastolic_bp: v.diastolic_bp || null,
              heart_rate_bpm: v.heart_rate_bpm || null,
              spo2_percentage: v.spo2_percentage || null,
              body_temperature_f: v.body_temperature_f || null,
              recorded_at: v.recorded_at || new Date().toISOString()
            };
            if (v.id && v.id.length === 36) vitalsData.id = v.id;
            const { error } = await supabase.from('vitals').upsert(vitalsData);
            if (!error) cloudSynced = true;
            break;
          }
          case 'referral': {
            const r = item.payload;
            const referralData: Record<string, unknown> = {
              referral_code: r.referral_code || `REF-SYNC-${item.id?.slice(0, 8) || '0000'}`,
              patient_id: r.patient_id,
              from_facility_id: r.from_facility_id,
              to_facility_id: r.to_facility_id,
              referral_reason: r.referral_reason,
              required_specialty: r.required_specialty,
              urgency_tier: r.urgency_tier || 'urgent_amber',
              status: r.status || 'initiated',
              referring_officer_id: auth.context?.user?.id || null
            };
            if (r.id && r.id.length === 36) referralData.id = r.id;
            const { error } = await supabase.from('referrals').upsert(referralData);
            if (!error) cloudSynced = true;
            break;
          }
          case 'follow_up':
          case 'follow_up_tasks': {
            const f = item.payload;
            const liveFollowUp: Record<string, unknown> = {
              patient_id: f.patient_id,
              assigned_asha_id: f.assigned_asha_id,
              referral_id: f.referral_id || f.originating_referral_id || null,
              task_type: f.task_type || 'routine_follow_up',
              due_date: f.due_date,
              status: f.status || 'pending',
              instructions: f.instructions || 'Routine community follow-up visit'
            };
            if (f.id && f.id.length === 36) liveFollowUp.id = f.id;

            // 1. Try upserting to live 'follow_ups'
            const { error: liveErr } = await supabase.from('follow_ups').upsert(liveFollowUp);
            if (!liveErr) {
              cloudSynced = true;
            } else {
              // 2. Compatibility fallback: upsert to legacy 'follow_up_tasks'
              const legacyFollowUp: Record<string, unknown> = {
                patient_id: f.patient_id,
                assigned_asha_id: f.assigned_asha_id,
                task_type: f.task_type || 'routine_follow_up',
                due_date: f.due_date,
                status: f.status || 'pending'
              };
              if (f.id && f.id.length === 36) legacyFollowUp.id = f.id;
              const { error: legacyErr } = await supabase.from('follow_up_tasks').upsert(legacyFollowUp);
              if (!legacyErr) cloudSynced = true;
            }
            break;
          }
        }
      } catch (err) {
        console.warn('Direct Supabase sync upsert deferred to offline receipt:', err);
      }
    }

    // Acknowledge sync item idempotently with telemetry
    // Records in local Dexie storage remain 100% preserved
    return successResponse({
      id: item.id,
      entity_type: item.entity_type,
      synced_at: new Date().toISOString(),
      sync_mode: 'authenticated_cloud_upsert',
      cloud_synced: cloudSynced,
      idempotency_key: item.id,
      authorized_role: auth.context?.role
    }, 200, 'sync_receipt');
  } catch (error) {
    return errorResponse('Failed to process sync queue item', 500, 'INTERNAL_SERVER_ERROR', error);
  }
}
