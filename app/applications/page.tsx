import Link from "next/link";
import {
  getApplicationStatusLabel,
  type ApplicationStatus,
} from "@/lib/applicationStatus";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export default async function ApplicationsPage() {
  const applications = await prisma.applicationRecord.findMany({
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

  return (
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
                        {application.job.company}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {application.job.city}
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
                打开职位详情页，保存申请状态后会出现在这里。
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
  );
}
