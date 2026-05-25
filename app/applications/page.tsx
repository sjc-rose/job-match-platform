import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import {
  applicationStatuses,
  applicationStatusLabels,
  getApplicationStatusLabel,
  toApplicationStatus,
  type ApplicationStatus,
} from "@/lib/applicationStatus";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CountGroup = {
  label: string;
  count: number;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "未设置";
  }

  return value.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

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

function getStatusClassName(status: ApplicationStatus | string) {
  if (status === "offer") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "interviewing") {
    return "bg-teal-50 text-teal-700";
  }

  if (status === "rejected" || status === "withdrawn") {
    return "bg-slate-100 text-slate-600";
  }

  if (status === "applied") {
    return "bg-sky-50 text-sky-700";
  }

  return "bg-amber-50 text-amber-700";
}

function normalizeLabel(value: string | null | undefined) {
  const label = value?.trim();
  return label || "未设置";
}

function getTopGroups(values: string[]) {
  const groupMap = new Map<string, number>();

  values.forEach((value) => {
    const label = normalizeLabel(value);
    groupMap.set(label, (groupMap.get(label) ?? 0) + 1);
  });

  return [...groupMap.entries()]
    .map<CountGroup>(([label, count]) => ({
      label,
      count,
    }))
    .sort((firstItem, secondItem) => {
      if (secondItem.count !== firstItem.count) {
        return secondItem.count - firstItem.count;
      }

      return firstItem.label.localeCompare(secondItem.label, "zh-CN");
    })
    .slice(0, 10);
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

export default async function ApplicationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <PublicNav />
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-950">
          <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
            <h1 className="text-3xl font-bold tracking-tight">
              登录后查看我的申请
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              申请进度会按你的账号保存，登录后可以查看和管理所有申请记录。
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

  const applications = await prisma.applicationRecord.findMany({
    where: {
      userId: user.id,
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          city: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const statusCounts = Object.fromEntries(
    applicationStatuses.map((status) => [status, 0]),
  ) as Record<ApplicationStatus, number>;

  applications.forEach((application) => {
    const status = toApplicationStatus(application.status);
    statusCounts[status] += 1;
  });

  const recentSevenDayCount = applications.filter(
    (application) => application.updatedAt >= sevenDaysAgo,
  ).length;
  const recentApplications = applications.slice(0, 5);
  const cityStats = getTopGroups(
    applications.map((application) => application.job.city),
  );
  const companyStats = getTopGroups(
    applications.map((application) => application.job.company),
  );
  const summaryCards = [
    {
      label: "总申请记录数",
      value: applications.length,
    },
    ...applicationStatuses.map((status) => ({
      label: `${applicationStatusLabels[status]}数量`,
      value: statusCounts[status],
    })),
    {
      label: "最近 7 天更新",
      value: recentSevenDayCount,
    },
  ];

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
        <div className="mx-auto max-w-6xl">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            我的申请
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            跟踪已关注职位的申请进度、投递日期和备注。
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
              href="/search"
            >
              去搜索职位
            </Link>
            <Link
              className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
              href="/favorites"
            >
              我的收藏
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
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

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <h2 className="text-xl font-bold text-slate-950">
              最近更新的 5 条
            </h2>
            <div className="mt-5 space-y-3">
              {recentApplications.length > 0 ? (
                recentApplications.map((application) => (
                  <div
                    className="rounded-md border border-slate-200 bg-slate-50 p-4"
                    key={application.id}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          className="block truncate text-base font-bold text-teal-700 transition hover:text-teal-800"
                          href={`/jobs/${application.jobId}`}
                        >
                          {application.job.title}
                        </Link>
                        <p className="mt-1 text-sm text-slate-600">
                          {normalizeLabel(application.job.company)} ·{" "}
                          {normalizeLabel(application.job.city)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-md px-3 py-1 text-xs font-semibold ${getStatusClassName(
                          application.status,
                        )}`}
                      >
                        {getApplicationStatusLabel(application.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      更新于 {formatDateTime(application.updatedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-md bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  暂无最近更新记录
                </div>
              )}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <h2 className="text-xl font-bold text-slate-950">
              按 city 统计（前 10）
            </h2>
            <div className="mt-5">
              <RankingList emptyText="暂无城市统计" items={cityStats} />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <h2 className="text-xl font-bold text-slate-950">
              按 company 统计（前 10）
            </h2>
            <div className="mt-5">
              <RankingList emptyText="暂无公司统计" items={companyStats} />
            </div>
          </article>
        </section>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-950">申请记录</h2>
            <p className="mt-1 text-sm text-slate-500">
              共 {applications.length} 条记录，按更新时间倒序排列
            </p>
          </div>

          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">职位</th>
                    <th className="px-6 py-4 font-semibold">公司</th>
                    <th className="px-6 py-4 font-semibold">城市</th>
                    <th className="px-6 py-4 font-semibold">申请状态</th>
                    <th className="px-6 py-4 font-semibold">申请日期</th>
                    <th className="px-6 py-4 font-semibold">备注</th>
                    <th className="px-6 py-4 font-semibold">更新时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {applications.map((application) => (
                    <tr className="transition hover:bg-slate-50" key={application.id}>
                      <td className="max-w-xs px-6 py-4 font-semibold text-slate-950">
                        <Link
                          className="text-teal-700 transition hover:text-teal-800"
                          href={`/jobs/${application.jobId}`}
                        >
                          {application.job.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {normalizeLabel(application.job.company)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {normalizeLabel(application.job.city)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${getStatusClassName(
                            application.status,
                          )}`}
                        >
                          {getApplicationStatusLabel(application.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDate(application.appliedAt)}
                      </td>
                      <td className="max-w-sm px-6 py-4 text-slate-600">
                        {application.note || "无备注"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDateTime(application.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-base font-semibold text-slate-900">
                暂无申请记录
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                打开职位详情页，把申请状态保存为已申请、面试中或其他进度后，这里会自动形成你的求职看板。
              </p>
              <Link
                className="mt-6 inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
                href="/search"
              >
                去搜索职位
              </Link>
            </div>
          )}
        </section>
        </div>
      </main>
    </>
  );
}
