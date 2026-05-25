import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const { anonKey, url } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can read auth cookies but cannot always write them.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export async function getCurrentUserFromRequest(request?: Request) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const authorization = request?.headers.get("authorization") ?? "";
  const token = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const {
    data: { user },
    error,
  } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}
