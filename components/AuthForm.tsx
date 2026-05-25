"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase Auth 环境变量尚未配置");
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = isLogin
        ? await supabase.auth.signInWithPassword({
            email,
            password,
          })
        : await supabase.auth.signUp({
            email,
            password,
          });

      if (error) {
        throw new Error(error.message);
      }

      if (isLogin) {
        router.push("/");
        router.refresh();
        return;
      }

      setMessage("注册成功，请检查邮箱确认账号后登录。");
      setPassword("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "认证失败，请稍后重试",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      {errorMessage ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {errorMessage}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-md bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
          {message}
        </div>
      ) : null}

      <label className="block text-left">
        <span className="text-sm font-medium text-slate-700">邮箱</span>
        <input
          className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <label className="block text-left">
        <span className="text-sm font-medium text-slate-700">密码</span>
        <input
          className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      <button
        className="inline-flex w-full justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "处理中..." : isLogin ? "登录" : "注册"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isLogin ? "还没有账号？" : "已有账号？"}
        <Link
          className="ml-2 font-semibold text-teal-700 transition hover:text-teal-800"
          href={isLogin ? "/signup" : "/login"}
        >
          {isLogin ? "去注册" : "去登录"}
        </Link>
      </p>
    </form>
  );
}
