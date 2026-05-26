"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogoutButton } from "@/components/LogoutButton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const navLinkClassName =
  "inline-flex justify-center rounded-md px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/10";

const logoutClassName =
  "inline-flex justify-center rounded-md px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-60";

export function PublicNav() {
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

  return (
    <header className="bg-slate-50 px-6 pt-6 text-slate-950 sm:px-10">
      <nav className="mx-auto flex max-w-6xl flex-col gap-3 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="text-base font-bold text-slate-950 transition hover:text-teal-700"
          href="/"
        >
          智能招聘匹配平台
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link className={navLinkClassName} href="/">
            首页
          </Link>
          <Link className={navLinkClassName} href="/search">
            搜索
          </Link>
          <Link className={navLinkClassName} href="/recommendations">
            推荐职位
          </Link>
          {isLoading ? null : user ? (
            <>
              <Link className={navLinkClassName} href="/profile">
                我的资料
              </Link>
              <Link className={navLinkClassName} href="/applications">
                求职进度
              </Link>
              <Link className={navLinkClassName} href="/favorites">
                收藏
              </Link>
              <LogoutButton className={logoutClassName} />
            </>
          ) : (
            <>
              <Link className={navLinkClassName} href="/login">
                登录
              </Link>
              <Link className={navLinkClassName} href="/signup">
                注册
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
