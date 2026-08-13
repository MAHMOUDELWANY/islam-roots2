import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

function cleanSupabaseUrl(url?: string): string | null {
  if (!url) return null;
  const cleaned = url.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
  return cleaned || null;
}

const supabaseUrl = cleanSupabaseUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const supabaseServiceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
)?.trim() || null;

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

if (!isSupabaseAdminConfigured) {
  console.error("[Supabase Admin] Private server configuration is unavailable.");
}

export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured && supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
