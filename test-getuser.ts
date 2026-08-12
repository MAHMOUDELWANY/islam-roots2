import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const client = createClient(url, "placeholder-key");

async function test() {
  // we need a real token to test
  console.log("URL:", url);
}
test();
