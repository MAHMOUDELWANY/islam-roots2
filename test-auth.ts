import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://placeholder.supabase.co";
const supabaseAnonKey = "placeholder-key";
const client = createClient(supabaseUrl, supabaseAnonKey);
client.auth.getUser("random-token").then(console.log).catch(console.error);
