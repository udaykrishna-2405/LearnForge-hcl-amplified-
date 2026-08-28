import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase now backs authentication, so it is required rather than optional.
 * The failure is surfaced as a flag instead of a bare module-level throw: a
 * throw here aborts the whole bundle and the user gets a blank page, which is
 * the opposite of a clear error. App.jsx renders a readable setup screen.
 */
export const configError = supabaseUrl && supabaseAnonKey
  ? null
  : 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file, then restart the dev server.';

export const supabase = configError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // Required for the OAuth redirect to complete.
      },
    });
