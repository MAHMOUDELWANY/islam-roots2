/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

if (!isSupabaseConfigured) {
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment. Falling back to Guest mode."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

