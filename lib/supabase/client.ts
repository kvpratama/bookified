import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabaseKey } from "./env";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
