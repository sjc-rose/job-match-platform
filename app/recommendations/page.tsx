import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PublicNav } from "@/components/PublicNav";
import { calculateMatchScore, type MatchScoreProfile } from "@/lib/matchScore";
import { prisma } from "@/lib/prisma";
import type { EducationLevel, Job } from "@/lib/providers/types";
import { educationLevels } from "@/lib/providers/types";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const excludedApplicationStatuses = [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
];

function toEducationLevel(value: string): EducationLevel {
  return educationLevels.includes(value as EducationLevel)
    ? (value as EducationLevel)
    : "不限";
}

function toJob(job: {
  id: string;
  source: string;
  title: string;
  company: string;
  city: string;
  province: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryText: string | null;
  educationRequirement: string;
  experienceRequirement: number | null;
  description: string;
  applyUrl: string;
  publishedAt: Date | null;
}): Job {
  return {
    id: job.id,
    source: job.source,
    title: job.title,
    company: job.company,
    city: job.city,
    province: job.province,
    status: job.status,
    salaryMin: job.salaryMin ?? 0,
    salaryMax: job.salaryMax ?? 0,
    salaryText: job.salaryText ?? "",
    educationRequirement: toEducationLevel(job.educationRequirement),
    experienceRequirement: job.experienceRequirement ?? 0,
    description: job.description,
    applyUrl: job.applyUrl,
    publishedAt: job.publishedAt?.toISOString() ?? "",
  };
}

function formatSalary(job: Job) {
  if (job.salaryText) {
    return job.salaryText;
  }

  if (job.salaryMin === 0 && job.salaryMax === 0) {
    return "薪资面议";
  }

  return `${job.salaryMin}-${job.salaryMax} 元/月`;
}

function formatSource(source: string) {
  if (["manual", "manual-import", "database"].includes(source)) {
    return "数据库职位";
  }

  if (source === "china-mock") {
    return "示例职位";
  }

  return `来源：${source}`;
}

function getStatusLabel(status: string) {
  if (status === "active") {
    return "招聘中";
  }

  if (status === "inactive") {
    return "已下线";
  }

  if (status === "expired") {
    return "已过期";
  }

  return status || "未设置";
}

export default async function RecommendationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <PublicNav />
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-950">
          <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
            <h1 className="text-3xl font-bold tracking-tight">
              登录后查看推荐职位
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              登录后系统会根据你的求职偏好计算职位匹配度。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
                href="/login"
              >
                登录
              </Link>
              <Link
                className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                href="/signup"
              >
                注册
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  const profile = await prisma.userProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!profile) {
    return (
      <>
        <PublicNav />
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-950">
          <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
            <h1 className="text-3xl font-bold tracking-tight">
              完善求职偏好后查看推荐
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              填写目标岗位、城市、技能和薪资后，系统会为你排序推荐职位。
            </p>
            <Link
              className="mt-8 inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
              href="/profile"
            >
              去完善资料
            </Link>
          </section>
        </main>
      </>
    );
  }

  const [jobs, applicationRecords] = await Promise.all([
    prisma.job.findMany({
      where: {
        status: "active",
      },
      orderBy: [
        {
          publishedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 100,
    }),
    prisma.applicationRecord.findMany({
      where: {
        userId: user.id,
        status: {
          in: excludedApplicationStatuses,
        },
      },
      select: {
        jobId: true,
      },
    }),
  ]);
  const excludedJobIds = new Set(
    applicationRecords.map((applicationRecord) => applicationRecord.jobId),
  );
  const recommendations = jobs
    .map(toJob)
    .filter((job) => !excludedJobIds.has(job.id))
    .map((job) => ({
      job,
      match: calculateMatchScore(job, profile satisfies MatchScoreProfile),
    }))
    .sort((firstItem, secondItem) => {
      const firstScore = firstItem.match.score ?? 0;
      const secondScore = secondItem.match.score ?? 0;

      return secondScore - firstScore;
    })
    .slice(0, 20);
  const hasHighMatch = recommendations.some(
    (recommendation) => (recommendation.match.score ?? 0) >= 30,
  );

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <section className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              推荐职位
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              根据你的求职偏好和职位信息计算匹配度。
            </p>
            <Link
              className="mt-6 inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-teal-500 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
              href="/profile"
            >
              编辑求职偏好
            </Link>
          </section>

          <section className="mt-10">
            {jobs.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-lg shadow-slate-200/60">
                暂无可推荐职位
              </div>
            ) : recommendations.length === 0 || !hasHighMatch ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-200/60">
                <p className="text-base font-semibold text-slate-900">
                  暂无高匹配职位，可以尝试完善求职偏好
                </p>
                <Link
                  className="mt-6 inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
                  href="/profile"
                >
                  去完善资料
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {recommendations.map(({ job, match }) => (
                  <article
                    className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60"
                    key={job.id}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-950">
                          {job.title}
                        </h2>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                          {job.company}
                        </p>
                      </div>
                      <div className="rounded-md bg-teal-50 px-4 py-3 text-sm font-bold text-teal-700">
                        匹配度 {match.score ?? 0}%
                      </div>
                    </div>

                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-md bg-slate-50 px-4 py-3">
                        <dt className="text-slate-500">城市</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {job.city}
                        </dd>
                      </div>
                      <div className="rounded-md bg-slate-50 px-4 py-3">
                        <dt className="text-slate-500">薪资</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {formatSalary(job)}
                        </dd>
                      </div>
                      <div className="rounded-md bg-slate-50 px-4 py-3">
                        <dt className="text-slate-500">来源</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {formatSource(job.source)}
                        </dd>
                      </div>
                      <div className="rounded-md bg-slate-50 px-4 py-3">
                        <dt className="text-slate-500">状态</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {getStatusLabel(job.status ?? "active")}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 rounded-md border border-teal-100 bg-teal-50 px-4 py-4">
                      <h3 className="text-sm font-bold text-teal-900">
                        推荐理由
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm text-teal-800">
                        {match.reasons.slice(0, 3).map((reason) => (
                          <li className="rounded-md bg-white/70 px-3 py-2" key={reason}>
                            - {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <FavoriteButton
                        activeLabel="取消收藏"
                        inactiveLabel="收藏"
                        jobId={job.id}
                      />
                      <Link
                        className="inline-flex justify-center rounded-md bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
                        href={`/jobs/${job.id}`}
                      >
                        查看详情
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
