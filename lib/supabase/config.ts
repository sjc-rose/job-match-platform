export function getSupabaseConfig() {
  return {
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  };
}

export function isSupabaseConfigured() {
  const { anonKey, url } = getSupabaseConfig();
  return Boolean(anonKey && url);
}
