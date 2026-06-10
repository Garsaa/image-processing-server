import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is required when Supabase is enabled");
  }

  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY is required when Supabase is enabled");
  }

  supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return supabaseClient;
}
