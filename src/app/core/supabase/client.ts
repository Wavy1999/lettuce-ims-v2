// ============================================================
//  AG Lettuce Be Fresh – Supabase Client
//  Singleton pattern matching Angular's providedIn: 'root'.
//  Import { supabase } anywhere; never instantiate directly.
// ============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "[SupabaseClient] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env",
  );
}

// Singleton (module-level, mirrors Angular singleton service)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
