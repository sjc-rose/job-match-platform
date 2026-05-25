import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const { anonKey, url } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
