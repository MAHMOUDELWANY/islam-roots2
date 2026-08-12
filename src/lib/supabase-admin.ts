import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

function cleanSupabaseUrl(url?: string): string {
  if (!url) return "https://placeholder.supabase.co";
  let cleaned = url.trim().replace(/\/+$/, "");
  cleaned = cleaned.replace(/\/rest\/v1$/i, "");
  return cleaned || "https://placeholder.supabase.co";
}

// Strictly use the frontend variables first to avoid cross-project mixing
// if a Vercel integration injected different backend keys.
const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseUrl = cleanSupabaseUrl(rawUrl);

let supabaseServiceRoleKey = "placeholder-service-key";

// If the URL is the VITE_ one, try to use VITE_ keys to match projects
if (rawUrl === process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
  supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
} else {
  // Otherwise use the integration keys
  supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || "placeholder-service-key";
}

supabaseServiceRoleKey = supabaseServiceRoleKey.trim();

export const isSupabaseAdminConfigured = Boolean(
  rawUrl &&
  supabaseUrl !== "https://placeholder.supabase.co" &&
  supabaseServiceRoleKey !== "placeholder-service-key"
);

if (!isSupabaseAdminConfigured) {
  console.warn("[Supabase Admin] Missing Supabase environment variables.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
