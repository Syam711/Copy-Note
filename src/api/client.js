import { createClient } from '@supabase/supabase-js';

// Every other file in /api imports THIS client rather than calling
// createClient() itself — one instance, one source of truth for the
// current session. If we ever swap auth providers, this is the only
// file that needs to change.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly at startup instead of silently breaking every
  // network call later — much easier to debug.
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in your project URL + anon key.'
  );
}

// persistSession + storage: the SDK keeps the login session in
// localStorage by default (not cookies) — this line is just being
// explicit about that so it's not a mystery later.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    autoRefreshToken: true,
  },
});
