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

console.log("Cleaned URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking duplicate query...");
  const { data: existingUser, error: checkErr } = await supabase
      .from('teachers')
      .select('username')
      .ilike('username', 'testadmin123')
      .maybeSingle();
      
  console.log("Query result:", existingUser, "Error:", checkErr);
}

test();
