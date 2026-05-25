"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type LogoutButtonProps = {
  className?: string;
};

const defaultClassName =
  "rounded-md border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-900 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-60";

export function LogoutButton({ className = defaultClassName }: LogoutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);

    if (isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <button
      className={className}
      disabled={isSigningOut}
      onClick={handleLogout}
      type="button"
    >
      {isSigningOut ? "正在退出..." : "退出"}
    </button>
  );
}
