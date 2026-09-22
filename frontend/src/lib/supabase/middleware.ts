import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { CareGridRole, getRoleFromUser, isRoleAuthorized } from '@/lib/auth/roles';

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set({ name, value, ...options })
        );
      },
    },
  });

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could cause session desync.
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected frontend areas and their authorized roles
  // Note: 'admin' inherently satisfies isRoleAuthorized for all areas
  const protectedAreas: Record<string, CareGridRole[]> = {
    '/admin': ['admin'],
    '/doctor': ['doctor'],
    '/asha': ['asha'],
    '/citizen': ['citizen'],
    '/referrals': ['asha', 'doctor'],
  };

  const matchedArea = Object.keys(protectedAreas).find(
    (area) => pathname === area || pathname.startsWith(`${area}/`)
  );

  if (matchedArea) {
    // 1. Unauthenticated users -> redirect to /login
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      supabaseResponse.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, c);
      });
      return redirectResponse;
    }

    // 2. Derive authoritative user role from Supabase metadata
    const userRole = getRoleFromUser(user);
    const allowedRoles = protectedAreas[matchedArea];

    // 3. Verify role authorization
    if (!isRoleAuthorized(userRole, allowedRoles)) {
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = '/unauthorized';
      unauthorizedUrl.searchParams.set('role', userRole);
      unauthorizedUrl.searchParams.set('required', allowedRoles.join(', '));
      unauthorizedUrl.searchParams.set('path', pathname);
      const redirectResponse = NextResponse.redirect(unauthorizedUrl);
      supabaseResponse.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, c);
      });
      return redirectResponse;
    }
  }

  return supabaseResponse;
}
