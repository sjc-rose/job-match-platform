"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Job } from "@/lib/providers/types";

type SearchHistoryItem = {
  id: string;
  visitorId: string;
  educationLevel: string;
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  city: string;
  keywords: string;
  experienceYears: number;
  source: string;
  resultCount: number;
  createdAt: string;
};

type FavoriteItem = {
  id: string;
  visitorId: string;
  jobId: string;
  createdAt: string;
  job: Job;
};

type AdminStatsResponse = {
  stats: {
    jobCount: number;
    favoriteCount: number;
    searchHistoryCount: number;
  };
  recentSearchHistories: SearchHistoryItem[];
  recentFavorites: FavoriteItem[];
};

const emptyStats: AdminStatsResponse = {
  stats: {
    jobCount: 0,
    favoriteCount: 0,
    searchHistoryCount: 0,
  },
  recentSearchHistories: [],
  recentFavorites: [],
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatExperience(years: number) {
  return years === 0 ? "经验不限" : `${years} 年经验`;
}

function formatSalary(min: number, max: number) {
  return `${min}-${max} 元/月`;
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminStatsResponse>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadAdminStats() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/admin/stats");

        if (!response.ok) {
          throw new Error("后台数据加载失败");
        }

        const statsData = (await response.json()) as AdminStatsResponse;

        if (isActive) {
          setData(statsData);
        }
      } catch (error) {
        if (isActive) {
          setData(emptyStats);
          setErrorMessage(
            error instanceof Error ? error.message : "后台数据加载失败",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadAdminStats();

    return () => {
      isActive = false;
    };
  }, []);

  const statCards = [
    {
      label: "职位总数",
      value: data.stats.jobCount,
    },
    {
      label: "收藏总数",
      value: data.stats.favoriteCount,
    },
    {
      label: "搜索记录总数",
      value: data.stats.searchHistoryCount,
    },
  ];

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex justify-end">
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-600/10"
            onClick={handleLogout}
            type="button"
          >
            退出登录
          </button>
        </div>

        <section className="text-center">
          <p className="mx-auto inline-flex rounded-md bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            仅开发测试使用
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            后台管理
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            查看职位、收藏和搜索记录的基础数据概览。
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
              href="/admin/stats"
            >
              统计面板
            </Link>
            <Link
              className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
              href="/admin/jobs"
            >
              职位管理
            </Link>
            <Link
              className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
              href="/admin/import"
            >
              导入职位
            </Link>
            <Link
              className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
              href="/admin/sources"
            >
              数据源管理
            </Link>
            <Link
              className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
              href="/admin/maintenance"
            >
              系统维护
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {statCards.map((card) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              key={card.label}
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-4xl font-bold text-slate-950">
                {isLoading ? "-" : card.value}
              </p>
            </article>
          ))}
        </section>

        {errorMessage ? (
          <section className="mt-8 rounded-2xl border border-red-200 bg-white p-6 text-center text-red-600 shadow-sm">
            {errorMessage}
          </section>
        ) : null}

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-950">
                最近 10 条搜索记录
              </h2>
              <Link
                className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                href="/search"
              >
                去搜索页
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <div className="rounded-md bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  正在加载搜索记录...
                </div>
              ) : data.recentSearchHistories.length > 0 ? (
                data.recentSearchHistories.map((history) => (
                  <div
                    className="rounded-md border border-slate-200 bg-slate-50 p-4"
                    key={history.id}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-bold text-slate-950">
                          {history.city || "不限城市"} ·{" "}
                          {history.keywords || "不限岗位"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {history.educationLevel} ·{" "}
                          {formatSalary(
                            history.expectedSalaryMin,
                            history.expectedSalaryMax,
                          )}{" "}
                          · {formatExperience(history.experienceYears)}
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          访客：{history.visitorId || "未知"} · 结果{" "}
                          {history.resultCount} 条
                        </p>
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {formatDateTime(history.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  暂无搜索记录
                </div>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-950">
                最近 10 条收藏记录
              </h2>
              <Link
                className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                href="/favorites"
              >
                去收藏页
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <div className="rounded-md bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  正在加载收藏记录...
                </div>
              ) : data.recentFavorites.length > 0 ? (
                data.recentFavorites.map((favorite) => (
                  <div
                    className="rounded-md border border-slate-200 bg-slate-50 p-4"
                    key={favorite.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-bold text-slate-950">
                          {favorite.job.title}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {favorite.job.company}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {favorite.job.city} ·{" "}
                          {favorite.job.salaryText ||
                            formatSalary(
                              favorite.job.salaryMin,
                              favorite.job.salaryMax,
                            )}
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          访客：{favorite.visitorId}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <span className="text-xs font-medium text-slate-500">
                          {formatDateTime(favorite.createdAt)}
                        </span>
                        <Link
                          className="inline-flex justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
                          href={`/jobs/${favorite.jobId}`}
                        >
                          查看职位
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  暂无收藏记录
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
