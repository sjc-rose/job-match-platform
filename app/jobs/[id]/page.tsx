import Link from "next/link";
import { mockJobs } from "@/lib/mockJobs";

type JobDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatSalary(min: number, max: number) {
  return `${Math.round(min / 1000)}k-${Math.round(max / 1000)}k`;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = mockJobs.find((item) => item.id === id);

  if (!job) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-950">
        <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
          <h1 className="text-3xl font-bold tracking-tight">职位不存在</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            这个职位可能已下线，或当前 mock 数据中没有对应记录。
          </p>
          <Link
            className="mt-8 inline-flex rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
            href="/search"
          >
            返回搜索页
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
      <article className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="flex flex-col gap-6 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              {job.title}
            </h1>
            <p className="mt-3 text-base font-medium text-slate-500">
              {job.company}
            </p>
          </div>
          <div className="rounded-md bg-teal-50 px-4 py-3 text-sm font-bold text-teal-700">
            {formatSalary(job.salaryMin, job.salaryMax)}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 px-4 py-4">
            <dt className="text-sm text-slate-500">城市</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">
              {job.city}
            </dd>
          </div>
          <div className="rounded-md bg-slate-50 px-4 py-4">
            <dt className="text-sm text-slate-500">薪资范围</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">
              {formatSalary(job.salaryMin, job.salaryMax)}
            </dd>
          </div>
          <div className="rounded-md bg-slate-50 px-4 py-4">
            <dt className="text-sm text-slate-500">学历要求</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">
              {job.educationRequirement}
            </dd>
          </div>
          <div className="rounded-md bg-slate-50 px-4 py-4">
            <dt className="text-sm text-slate-500">工作经验要求</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">
              {job.experienceRequirement} 年以上
            </dd>
          </div>
        </dl>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-950">职位描述</h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            {job.description}
          </p>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex justify-center rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-950/20"
            href={job.applyUrl}
            rel="noreferrer"
            target="_blank"
          >
            申请链接
          </a>
          <Link
            className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
            href="/search"
          >
            返回搜索页
          </Link>
        </div>
      </article>
    </main>
  );
}
