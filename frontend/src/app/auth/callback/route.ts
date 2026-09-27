import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRoleFromUser, getWorkspaceForRole } from '@/lib/auth/roles';

/**
 * Route handler for Supabase OAuth callbacks (e.g., Google OAuth).
 * Exchanges the temporary authorization code for a secure, persisted session
 * using @supabase/ssr cookie handling.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Fetch authenticated user to derive authoritative role
        const { data: { user } } = await supabase.auth.getUser();
        const role = getRoleFromUser(user);

        // Determine destination: validate 'next' to avoid open-redirects
        let destination = getWorkspaceForRole(role);
        if (
          next &&
          next.startsWith('/') &&
          !next.startsWith('//') &&
          next !== '/' &&
          next !== '/login'
        ) {
          destination = next;
        }

        return NextResponse.redirect(new URL(destination, origin));
      }

      console.error('OAuth code exchange failed:', error.message);
    } catch (err: unknown) {
      console.error('Unexpected error during OAuth callback:', err);
    }
  }

  // Redirect to login page with clear error parameter
  const redirectUrl = new URL('/login', origin);
  redirectUrl.searchParams.set('error', 'oauth_exchange_failed');
  return NextResponse.redirect(redirectUrl);
}
