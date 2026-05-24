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
        <button
          type="button"
          className="mt-10 rounded-md bg-teal-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
        >
          开始匹配
        </button>
      </section>
    </main>
  );
}
