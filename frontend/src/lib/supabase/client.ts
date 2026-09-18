import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    // Development fallback warning without throwing
    console.warn('Supabase URL and Anon Key are not yet configured in .env.local');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
