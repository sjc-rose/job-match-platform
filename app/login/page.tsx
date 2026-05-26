import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { PublicNav } from "@/components/PublicNav";

export default function LoginPage() {
  return (
    <>
      <PublicNav />
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-950">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <Link
              className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
              href="/"
            >
              返回首页
            </Link>
            <h1 className="mt-5 text-4xl font-bold tracking-tight">登录</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              登录后可以保存收藏、求职进度和搜索记录。
            </p>
          </div>
          <AuthForm mode="login" />
        </section>
      </main>
    </>
  );
}
