import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

function cleanSupabaseUrl(url) {
  if (!url) return "https://placeholder.supabase.co";
  let cleaned = url.trim().replace(/\/+$/, "");
  cleaned = cleaned.replace(/\/rest\/v1$/i, "");
  return cleaned || "https://placeholder.supabase.co";
}

const supabaseUrl = cleanSupabaseUrl(process.env.VITE_SUPABASE_URL);
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Attempting signup...");
  const authEmail = 'testadmin12345@system.local';
  const { data, error } = await supabase.auth.signUp({
    email: authEmail,
    password: 'Password123!',
    options: { data: { full_name: 'Test Admin', username: 'testadmin12345' } }
  });
  console.log("Signup error:", error);
}

test();
