import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

/**
 * Retrieve the current authenticated user from browser context.
 * Safe to call in any client-side component or utility.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createBrowserClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch (err) {
    console.error('Error fetching current browser user:', err);
    return null;
  }
}

/**
 * Retrieve the current active session from browser context.
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const supabase = createBrowserClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return null;
    }
    return session;
  } catch (err) {
    console.error('Error fetching current browser session:', err);
    return null;
  }
}

/**
 * Sign out the currently authenticated user from browser context.
 * Clears session cookies handled by @supabase/ssr.
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();
    return { error: error ? new Error(error.message) : null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sign out failed';
    return { error: new Error(message) };
  }
}

/**
 * React hook to observe authentication state and session changes reactively in client components.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createBrowserClient();
      const { data: { user: currentUser }, error: userErr } = await supabase.auth.getUser();
      if (userErr && userErr.message && !userErr.message.includes('Auth session missing')) {
        setError(userErr.message);
      } else {
        setError(null);
      }
      setUser(currentUser ?? null);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession ?? null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to refresh session';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = createBrowserClient();

    // 1. Initial check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession ?? null);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setLoading(false);
    });

    // 2. Subscribe to auth state changes (e.g. sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        if (!mounted) return;
        setSession(updatedSession ?? null);
        setUser(updatedSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    const { error: signOutError } = await signOut();
    if (signOutError) {
      setError(signOutError.message);
    } else {
      setUser(null);
      setSession(null);
      setError(null);
    }
    setLoading(false);
  }, []);

  return {
    user,
    session,
    isAuthenticated: Boolean(user),
    loading,
    error,
    refresh,
    signOut: handleSignOut,
  };
}
