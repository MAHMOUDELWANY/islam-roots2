import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

function cleanSupabaseUrl(url?: string): string {
  if (!url) return "https://placeholder.supabase.co";
  const cleaned = url.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
  return cleaned || "https://placeholder.supabase.co";
}

const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseUrl = cleanSupabaseUrl(rawUrl);
const supabaseServiceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "placeholder-service-key"
).trim();

export const isSupabaseAdminConfigured = Boolean(
  rawUrl &&
  supabaseUrl !== "https://placeholder.supabase.co" &&
  supabaseServiceRoleKey !== "placeholder-service-key",
);

if (!isSupabaseAdminConfigured) {
  console.error("[Supabase Admin] A private Supabase service-role or secret key is required for protected server routes.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
