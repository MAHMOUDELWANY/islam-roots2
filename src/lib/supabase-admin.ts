import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

function cleanSupabaseUrl(url?: string): string {
  if (!url) return "https://placeholder.supabase.co";
  let cleaned = url.trim().replace(/\/+$/, "");
  cleaned = cleaned.replace(/\/rest\/v1$/i, "");
  return cleaned || "https://placeholder.supabase.co";
}

const rawUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = cleanSupabaseUrl(rawUrl);
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key").trim();

export const isSupabaseAdminConfigured = Boolean(
  rawUrl &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  supabaseUrl !== "https://placeholder.supabase.co" &&
  supabaseServiceRoleKey !== "placeholder-service-key"
);

if (!isSupabaseAdminConfigured) {
  console.warn(
    "[Supabase Admin] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

