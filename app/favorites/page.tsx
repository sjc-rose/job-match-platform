"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PublicNav } from "@/components/PublicNav";
import {
  getApplicationStatusLabel,
  toApplicationStatus,
  type ApplicationStatus,
} from "@/lib/applicationStatus";
import {
  FAVORITES_CHANGED_EVENT,
  getFavoriteJobIds,
  setFavoriteJobIds as saveFavoriteJobIds,
} from "@/lib/favorites";
import { chinaMockJobs } from "@/lib/providers/chinaMockProvider";
import type { Job } from "@/lib/providers/types";

type ApplicationRecord = {
  jobId: string;
  status: ApplicationStatus;
};

function formatLocation(province: string, city: string) {
  return province === city ? city : `${province} · ${city}`;
}

function getStatusClassName(status: ApplicationStatus) {
  if (status === "offer") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "interviewing") {
    return "bg-teal-50 text-teal-700";
  }

  if (status === "applied") {
    return "bg-sky-50 text-sky-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function FavoritesPage() {
  const [favoriteJobIds, setFavoriteJobIdsState] = useState<string[]>([]);
  const [databaseFavoriteJobs, setDatabaseFavoriteJobs] = useState<Job[]>([]);
  const [applicationStatusByJobId, setApplicationStatusByJobId] = useState<
    Record<string, ApplicationStatus>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isLoginRequired, setIsLoginRequired] = useState(false);

  useEffect(() => {
    function syncFavorites() {
      setFavoriteJobIdsState(getFavoriteJobIds());
    }

    async function loadFavorites() {
      setIsLoading(true);

      try {
        const [response, applicationsResponse] = await Promise.all([
          fetch("/api/favorites"),
          fetch("/api/applications"),
        ]);

        if (!response.ok) {
          if (response.status === 401) {
            setIsLoginRequired(true);
            setDatabaseFavoriteJobs([]);
            setFavoriteJobIdsState([]);
            return;
          }

          throw new Error("Failed to fetch favorite jobs");
        }

        const data = (await response.json()) as { jobIds: string[]; jobs: Job[] };
        saveFavoriteJobIds(data.jobIds);
        setDatabaseFavoriteJobs(data.jobs);
        setFavoriteJobIdsState(data.jobIds);

        if (applicationsResponse.ok) {
          const applicationsData = (await applicationsResponse.json()) as {
            applications: ApplicationRecord[];
          };
        setApplicationStatusByJobId(
            Object.fromEntries(
              applicationsData.applications.map((application) => [
                application.jobId,
                toApplicationStatus(application.status),
              ]),
            ),
          );
        } else {
          setApplicationStatusByJobId({});
        }

        setIsUsingFallback(false);
        setIsLoginRequired(false);
      } catch {
        syncFavorites();
        setDatabaseFavoriteJobs([]);
        setApplicationStatusByJobId({});
        setIsUsingFallback(true);
        setIsLoginRequired(false);
      } finally {
        setIsLoading(false);
      }
    }

    syncFavorites();
    void loadFavorites();
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavorites);
    window.addEventListener("storage", syncFavorites);

    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);

  const favoriteJobs = useMemo(
    () => {
      if (!isUsingFallback) {
        return databaseFavoriteJobs.filter((job) => favoriteJobIds.includes(job.id));
      }

      return favoriteJobIds
        .map((jobId) => chinaMockJobs.find((job) => job.id === jobId))
        .filter((job): job is (typeof chinaMockJobs)[number] => Boolean(job));
    },
    [databaseFavoriteJobs, favoriteJobIds, isUsingFallback],
  );

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
        <div className="mx-auto max-w-6xl">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            我的收藏
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            这里会优先显示数据库中保存的收藏职位，网络异常时会使用本机收藏缓存。
          </p>
        </section>

        <section className="mt-10">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
              正在加载收藏职位，请稍候...
            </div>
          ) : isLoginRequired ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-base font-semibold text-slate-900">
                登录后查看收藏职位
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                收藏职位会按你的账号保存，换设备也能继续查看。
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
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
            </div>
          ) : favoriteJobs.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {favoriteJobs.map((job) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
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
                    <div className="rounded-md bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700">
                      {job.salaryText}
                    </div>
                  </div>

                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">城市</dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        {formatLocation(job.province, job.city)}
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">学历要求</dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        {job.educationRequirement}
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">经验要求</dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        {job.experienceRequirement === 0
                          ? "经验不限"
                          : `${job.experienceRequirement} 年以上`}
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">数据来源</dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        国内示例数据
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">申请状态</dt>
                      <dd className="mt-2">
                        {(() => {
                          const applicationStatus =
                            applicationStatusByJobId[job.id] ?? "not_applied";

                          return (
                            <span
                              className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${getStatusClassName(
                                applicationStatus,
                              )}`}
                            >
                              {getApplicationStatusLabel(applicationStatus)}
                            </span>
                          );
                        })()}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-5 text-sm leading-6 text-slate-600">
                    {job.description}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <FavoriteButton jobId={job.id} />
                    <Link
                      className="inline-flex justify-center rounded-md bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
                      href={`/jobs/${job.id}`}
                    >
                      查看详情
                    </Link>
                    <a
                      className="inline-flex justify-center rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-950/20"
                      href={job.applyUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      去申请
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-base font-semibold text-slate-900">
                暂无收藏职位
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                遇到感兴趣的职位先收藏起来，稍后可以统一比较和跟进。
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
