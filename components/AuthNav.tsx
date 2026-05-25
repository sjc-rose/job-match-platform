"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogoutButton } from "@/components/LogoutButton";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const linkClassName =
  "rounded-md border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-900 transition hover:border-teal-500 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/15";

const logoutClassName =
  "rounded-md border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-900 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-600/10";

export function AuthNav() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let isActive = true;

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (isActive) {
        setUser(currentUser);
        setIsLoading(false);
      }
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return null;
  }

  if (user) {
    return (
      <>
        <Link className={linkClassName} href="/applications">
          我的申请
        </Link>
        <Link className={linkClassName} href="/favorites">
          收藏
        </Link>
        <LogoutButton className={logoutClassName} />
      </>
    );
  }

  return (
    <>
      <Link className={linkClassName} href="/login">
        登录
      </Link>
      <Link className={linkClassName} href="/signup">
        注册
      </Link>
    </>
  );
}
