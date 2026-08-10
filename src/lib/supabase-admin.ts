import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

export const isSupabaseAdminConfigured = Boolean(
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
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

