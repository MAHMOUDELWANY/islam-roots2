import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking duplicate query...");
  const { data: existingUser, error: checkErr } = await supabase
      .from('teachers')
      .select('username')
      .ilike('username', 'testadmin123')
      .maybeSingle();
      
  console.log("Query result:", existingUser, "Error:", checkErr);

  console.log("Attempting signup...");
  const authEmail = 'testadmin123@system.local';
  const { data, error } = await supabase.auth.signUp({
    email: authEmail,
    password: 'Password123!',
    options: { data: { full_name: 'Test Admin', username: 'testadmin123' } }
  });
  console.log("Signup error:", error);
}

test();
