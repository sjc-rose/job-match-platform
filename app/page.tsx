import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { getCurrentUser } from "@/lib/supabase/server";

const featureCards = [
  {
    title: "偏好驱动匹配",
    description: "结合目标岗位、城市、技能和薪资预期，给出匹配度与推荐理由。",
  },
  {
    title: "申请进度跟踪",
    description: "记录已申请、面试中、Offer、拒绝等状态，让求职过程更清晰。",
  },
  {
    title: "数据可管理",
    description: "支持后台导入、去重、筛选和数据源管理，方便持续维护职位库。",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <>
      <PublicNav />
      <main className="min-h-[calc(100vh-96px)] bg-slate-50 px-6 py-14 text-slate-950 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                AI Job Match Platform
              </h1>
              <p className="mt-5 text-2xl font-semibold text-slate-900 sm:text-3xl">
                招聘匹配平台
              </p>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                基于求职偏好、职位信息和申请记录推荐更适合你的职位。
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/search"
                  className="inline-flex justify-center rounded-md bg-teal-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
                >
                  开始搜索
                </Link>
                <Link
                  href="/recommendations"
                  className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-7 py-3 text-base font-semibold text-slate-900 transition hover:border-teal-500 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
                >
                  推荐职位
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-7 py-3 text-base font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                >
                  我的资料
                </Link>
                <Link
                  href="/applications"
                  className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-7 py-3 text-base font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                >
                  我的申请
                </Link>
              </div>
              <p className="mt-6 text-sm font-medium text-slate-500">
                {user
                  ? "已登录，可直接使用个性化推荐、收藏和申请记录。"
                  : "未登录也可浏览职位；登录或注册后可保存收藏、资料和申请进度。"}
              </p>
              {!user ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                    href="/login"
                  >
                    登录
                  </Link>
                  <Link
                    className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                    href="/signup"
                  >
                    注册
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="rounded-md bg-slate-950 px-5 py-4 text-white">
                <p className="text-sm font-semibold text-teal-200">
                  今日求职工作台
                </p>
                <p className="mt-3 text-3xl font-bold">搜索 · 推荐 · 跟踪</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  从职位发现到申请状态管理，围绕一个求职者账号沉淀完整流程。
                </p>
              </div>
              <div className="mt-5 grid gap-3">
                {featureCards.map((card) => (
                  <article
                    className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4"
                    key={card.title}
                  >
                    <h2 className="text-base font-bold text-slate-950">
                      {card.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {card.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {["职位搜索", "匹配评分", "申请统计"].map((label) => (
              <div
                className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-center shadow-lg shadow-slate-200/50"
                key={label}
              >
                <p className="text-sm font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
