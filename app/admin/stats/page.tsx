import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const jobStatusLabels: Record<string, string> = {
  active: "active 职位",
  inactive: "inactive 职位",
  expired: "expired 职位",
};

type CountGroup = {
  label: string;
  count: number;
};

function formatDateTime(value: Date) {
  return value.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizeLabel(value: string | null | undefined) {
  const label = value?.trim();
  return label || "未设置";
}

async function getAdminStats() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalJobs,
    activeJobs,
    inactiveJobs,
    expiredJobs,
    recentSevenDayJobs,
    sourceGroups,
    cityGroups,
    recentJobs,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({
      where: {
        status: "active",
      },
    }),
    prisma.job.count({
      where: {
        status: "inactive",
      },
    }),
    prisma.job.count({
      where: {
        status: "expired",
      },
    }),
    prisma.job.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    }),
    prisma.job.groupBy({
      by: ["source"],
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          source: "desc",
        },
      },
    }),
    prisma.job.groupBy({
      by: ["city"],
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          city: "desc",
        },
      },
      take: 10,
    }),
    prisma.job.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        company: true,
        city: true,
        source: true,
        status: true,
        createdAt: true,
      },
      take: 10,
    }),
  ]);

  return {
    summaryCards: [
      {
        label: "总职位数",
        value: totalJobs,
      },
      {
        label: jobStatusLabels.active,
        value: activeJobs,
      },
      {
        label: jobStatusLabels.inactive,
        value: inactiveJobs,
      },
      {
        label: jobStatusLabels.expired,
        value: expiredJobs,
      },
      {
        label: "最近 7 天新增职位",
        value: recentSevenDayJobs,
      },
    ],
    sourceStats: sourceGroups.map<CountGroup>((group) => ({
      label: normalizeLabel(group.source),
      count: group._count._all,
    })),
    cityStats: cityGroups.map<CountGroup>((group) => ({
      label: normalizeLabel(group.city),
      count: group._count._all,
    })),
    recentJobs,
  };
}

function getStatusLabel(status: string | null | undefined) {
  const normalizedStatus = status?.trim() || "active";

  if (normalizedStatus === "active") {
    return "active";
  }

  if (normalizedStatus === "inactive") {
    return "inactive";
  }

  if (normalizedStatus === "expired") {
    return "expired";
  }

  return "未设置";
}

function getStatusClassName(status: string | null | undefined) {
  const normalizedStatus = status?.trim() || "active";

  if (normalizedStatus === "active") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus === "expired") {
    return "bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "inactive") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-red-50 text-red-600";
}

function RankingList({
  emptyText,
  items,
}: {
  emptyText: string;
  items: CountGroup[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md bg-slate-50 px-4 py-5 text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
          key={item.label}
        >
          <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
            {item.label}
          </span>
          <span className="rounded-md bg-white px-3 py-1 text-sm font-bold text-slate-950">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminStatsPage() {
  const stats = await getAdminStats();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="text-center">
          <Link
            className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            href="/admin"
          >
            返回后台首页
          </Link>
          <p className="mx-auto mt-5 inline-flex rounded-md bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            仅开发测试使用
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            统计面板
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            查看职位状态、数据来源、城市分布和最近新增职位。
          </p>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {stats.summaryCards.map((card) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60"
              key={card.label}
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-4xl font-bold text-slate-950">
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <h2 className="text-xl font-bold text-slate-950">
              按 source 统计
            </h2>
            <div className="mt-5">
              <RankingList emptyText="暂无来源统计" items={stats.sourceStats} />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <h2 className="text-xl font-bold text-slate-950">
              按 city 统计（前 10）
            </h2>
            <div className="mt-5">
              <RankingList emptyText="暂无城市统计" items={stats.cityStats} />
            </div>
          </article>
        </section>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                最近新增职位
              </h2>
              <p className="mt-1 text-sm text-slate-500">最多显示 10 条</p>
            </div>
            <Link
              className="inline-flex justify-center rounded-md bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
              href="/admin/jobs"
            >
              查看职位管理
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">职位标题</th>
                  <th className="px-6 py-4 font-semibold">公司</th>
                  <th className="px-6 py-4 font-semibold">城市</th>
                  <th className="px-6 py-4 font-semibold">来源</th>
                  <th className="px-6 py-4 font-semibold">状态</th>
                  <th className="px-6 py-4 font-semibold">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {stats.recentJobs.length > 0 ? (
                  stats.recentJobs.map((job) => (
                    <tr className="transition hover:bg-slate-50" key={job.id}>
                      <td className="max-w-xs px-6 py-4 font-semibold text-slate-950">
                        <Link
                          className="text-teal-700 transition hover:text-teal-800"
                          href={`/admin/jobs/${job.id}/edit`}
                        >
                          {job.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {job.company}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {normalizeLabel(job.city)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {normalizeLabel(job.source)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${getStatusClassName(
                            job.status,
                          )}`}
                        >
                          {getStatusLabel(job.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDateTime(job.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-slate-500"
                      colSpan={6}
                    >
                      暂无新增职位
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
