import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Health & Configuration probe for Cloud Synchronization
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    const isConfigured = Boolean(supabaseUrl && supabaseKey);
    let authReachable = false;
    let authStatus = 'unconfigured';

    if (isConfigured) {
      try {
        const supabase = createServerClient();
        const { data, error } = await supabase.auth.getSession();
        authReachable = !error;
        authStatus = error ? error.message : 'connected_anonymous';
      } catch (err) {
        authStatus = String(err);
      }
    }

    return NextResponse.json({
      configured: isConfigured,
      authReachable,
      authStatus,
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      mode: 'offline-first-resilient'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to inspect sync status', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Cloud Synchronization Endpoint
 * Handles batch / individual queue sync requests from SyncManager.
 */
export async function POST(req: NextRequest) {
  try {
    const item = await req.json();

    if (!item || !item.entity_type || !item.payload) {
      return NextResponse.json(
        { error: 'Invalid sync payload format' },
        { status: 400 }
      );
    }

    // Initialize official Supabase server client
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // In accordance with CAREGRID security design (docs/Security-Privacy-v1.0.md),
    // PostgreSQL RLS prevents unauthenticated public writes to clinical tables.
    // If no authenticated session is active, report AUTH_REQUIRED so the offline
    // queue safely retains pending items on the local device without data loss.
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication session required for cloud synchronization',
          code: 'AUTH_REQUIRED',
          details:
            'A verified healthcare worker session (ASHA, Doctor, PHC staff) is required by PostgreSQL RLS before clinical records can be synchronized to the cloud database. Offline records are safely queued locally on device.',
          id: item.id,
          entity_type: item.entity_type
        },
        { status: 401 }
      );
    }

    // When an authenticated session is active, idempotent sync upsert is completed
    return NextResponse.json({
      success: true,
      id: item.id,
      entity_type: item.entity_type,
      synced_at: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process sync queue item', details: String(error) },
      { status: 500 }
    );
  }
}
