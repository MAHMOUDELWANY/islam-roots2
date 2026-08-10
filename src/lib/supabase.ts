/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

function cleanSupabaseUrl(url?: string): string {
  if (!url) return "https://placeholder.supabase.co";
  let cleaned = url.trim().replace(/\/+$/, "");
  cleaned = cleaned.replace(/\/rest\/v1$/i, "");
  return cleaned || "https://placeholder.supabase.co";
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseUrl = cleanSupabaseUrl(rawUrl);
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key").trim();

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  supabaseUrl !== "https://placeholder.supabase.co" &&
  supabaseAnonKey !== "placeholder-anon-key"
);

if (!isSupabaseConfigured) {
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment. Falling back to Guest mode."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



