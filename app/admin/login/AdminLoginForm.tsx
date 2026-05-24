"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AdminLoginResponse = {
  ok?: boolean;
  error?: string;
};

type AdminLoginFormProps = {
  defaultPassword: string;
  nextPath: string;
  showDefaultPassword: boolean;
};

export function AdminLoginForm({
  defaultPassword,
  nextPath,
  showDefaultPassword,
}: AdminLoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => ({}))) as AdminLoginResponse;

      if (!response.ok) {
        throw new Error(data.error === "Invalid password" ? "管理员密码错误" : "登录失败");
      }

      router.push(nextPath.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "登录失败，请稍后重试",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="text-center">
          <p className="mx-auto inline-flex rounded-md bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            仅开发测试使用
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            后台登录
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            请输入管理员密码后继续访问后台管理功能。
          </p>
          {showDefaultPassword ? (
            <p className="mt-3 rounded-md bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              当前使用开发默认密码：{defaultPassword}
            </p>
          ) : null}
        </div>

        <form className="mt-8" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              管理员密码
            </span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {errorMessage ? (
            <div className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <button
            className="mt-6 w-full rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "正在登录..." : "登录后台"}
          </button>
        </form>
      </section>
    </main>
  );
}
