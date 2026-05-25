import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-950">
      <section className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          智能招聘匹配平台
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
          输入学历、期望薪资和城市，自动匹配适合你的职位
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/search"
            className="rounded-md bg-teal-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
          >
            开始匹配
          </Link>
          <Link
            href="/favorites"
            className="rounded-md border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-900 transition hover:border-teal-500 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
          >
            我的收藏
          </Link>
          <Link
            href="/applications"
            className="rounded-md border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-900 transition hover:border-teal-500 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
          >
            我的申请
          </Link>
        </div>
      </section>
    </main>
  );
}
