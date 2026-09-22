import type { User, Session } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Retrieve the current authenticated user from Next.js server context
 * (Server Components, Route Handlers, Server Actions).
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch (err) {
    console.error('Error fetching server user:', err);
    return null;
  }
}

/**
 * Retrieve the current active session from Next.js server context.
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const supabase = await createServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return null;
    }
    return session;
  } catch (err) {
    console.error('Error fetching server session:', err);
    return null;
  }
}
