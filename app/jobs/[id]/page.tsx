import Link from "next/link";
import { ApplicationTracker } from "@/components/ApplicationTracker";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JobMatchScorePanel } from "@/components/JobMatchScorePanel";
import { PublicNav } from "@/components/PublicNav";
import { prisma } from "@/lib/prisma";
import { chinaMockProvider } from "@/lib/providers/chinaMockProvider";
import type { Job } from "@/lib/providers/types";

type JobDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type JobDetail = Job & {
  status: string;
  isDatabaseJob: boolean;
};

function formatSalary(min: number, max: number) {
  if (min === 0 && max === 0) {
    return "薪资面议";
  }

  if (min === 0 || max === 0) {
    return `${min || max} 元/月`;
  }

  return `${min}-${max} 元/月`;
}

function formatLocation(province: string, city: string) {
  return province === city ? city : `${province} · ${city}`;
}

function formatPublishedAt(value: string) {
  if (!value) {
    return "未发布";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatSource(source: string) {
  return source === "china-mock" ? "国内示例数据" : source;
}

function getStatusLabel(status: string) {
  if (status === "inactive") {
    return "已下线";
  }

  if (status === "expired") {
    return "已过期";
  }

  return "招聘中";
}

async function getDatabaseJob(id: string): Promise<JobDetail | null> {
  const job = await prisma.job.findUnique({
    where: {
      id,
    },
  });

  if (!job) {
    return null;
  }

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
    educationRequirement: job.educationRequirement as Job["educationRequirement"],
    experienceRequirement: job.experienceRequirement ?? 0,
    description: job.description,
    applyUrl: job.applyUrl,
    publishedAt: job.publishedAt?.toISOString() ?? "",
    isDatabaseJob: true,
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const databaseJob = await getDatabaseJob(id);
  const mockJob = databaseJob ? undefined : await chinaMockProvider.getJobById(id);
  const job: JobDetail | null = databaseJob
    ? databaseJob
    : mockJob
      ? {
          ...mockJob,
          status: "active",
          isDatabaseJob: false,
        }
      : null;

  if (!job) {
    return (
      <>
        <PublicNav />
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-950">
          <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight">职位不存在</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              这个职位可能已下线，或当前国内示例数据中没有对应记录。
            </p>
            <Link
              className="mt-8 inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
              href="/search"
            >
              返回搜索页
            </Link>
            <Link
              className="mt-3 inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-teal-500 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
              href="/recommendations"
            >
              查看推荐职位
            </Link>
          </section>
        </main>
      </>
    );
  }

  const isUnavailable = job.isDatabaseJob && job.status !== "active";
  const canApplyExternally = Boolean(job.applyUrl && job.applyUrl !== "#");

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
        <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
            {job.salaryText || formatSalary(job.salaryMin, job.salaryMax)}
          </div>
        </div>

        {isUnavailable ? (
          <div className="mt-6 rounded-md bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-700">
            该职位已下线或已过期，暂不支持收藏或申请。
          </div>
        ) : null}

        <JobMatchScorePanel job={job} />

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 px-4 py-4">
            <dt className="text-sm text-slate-500">城市</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">
              {formatLocation(job.province, job.city)}
            </dd>
          </div>
          <div className="rounded-md bg-slate-50 px-4 py-4">
            <dt className="text-sm text-slate-500">薪资范围</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">
              {job.salaryText || formatSalary(job.salaryMin, job.salaryMax)}
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
              {job.experienceRequirement === 0
                ? "经验不限"
                : `${job.experienceRequirement} 年以上`}
            </dd>
          </div>
          <div className="rounded-md bg-slate-50 px-4 py-4">
            <dt className="text-sm text-slate-500">职位状态</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">
              {getStatusLabel(job.status)}
            </dd>
          </div>
        </dl>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-950">职位描述</h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            {job.description}
          </p>
        </section>

        <p className="mt-6 text-sm text-slate-500">
          数据来源：{formatSource(job.source)} · 发布日期：
          {formatPublishedAt(job.publishedAt)}
        </p>

        <ApplicationTracker
          applyUrl={canApplyExternally ? job.applyUrl : undefined}
          disabled={!job.isDatabaseJob || isUnavailable}
          disabledMessage={
            isUnavailable
              ? "该职位已下线或已过期，暂不支持申请状态管理。"
              : "示例职位暂不支持申请状态管理。"
          }
          jobId={job.id}
        />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {isUnavailable ? (
            <>
              <span className="inline-flex cursor-not-allowed justify-center rounded-md border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-400">
                收藏不可用
              </span>
              <span className="inline-flex cursor-not-allowed justify-center rounded-md bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500">
                去申请不可用
              </span>
            </>
          ) : (
            <>
              <FavoriteButton jobId={job.id} />
              {canApplyExternally ? (
                <a
                  className="inline-flex justify-center rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-950/20"
                  href={job.applyUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  去申请
                </a>
              ) : null}
            </>
          )}
          <Link
            className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
            href="/search"
          >
            返回搜索页
          </Link>
        </div>
        </article>
      </main>
    </>
  );
}
