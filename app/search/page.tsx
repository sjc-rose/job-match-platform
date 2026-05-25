"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PublicNav } from "@/components/PublicNav";
import type { JobMatch, UserProfile } from "@/lib/matching";
import { educationLevels } from "@/lib/providers/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const initialProfile: UserProfile = {
  educationLevel: "本科",
  expectedSalaryMin: 15000,
  expectedSalaryMax: 25000,
  city: "上海",
  keywords: "前端开发",
  experienceYears: 2,
};

type SearchResponse = {
  source: string;
  jobs: SearchResultMatch[];
};

type ProfileMatch = {
  state: "unauthenticated" | "missing" | "ready";
  score: number | null;
  reasons: string[];
};

type SearchResultMatch = JobMatch & {
  profileMatch?: ProfileMatch;
};

type SearchHistoryItem = UserProfile & {
  id: string;
  source: string;
  resultCount: number;
  createdAt: string;
};

type SearchHistoryResponse = {
  histories: SearchHistoryItem[];
};

type SaveSearchHistoryResponse = {
  history: SearchHistoryItem;
};

function formatSalary(match: JobMatch) {
  return match.job.salaryText || `${match.job.salaryMin}-${match.job.salaryMax} 元/月`;
}

function getSourceLabel(source: string) {
  if (["manual", "manual-import", "database"].includes(source)) {
    return "数据库职位";
  }

  if (source === "china-mock") {
    return "示例职位";
  }

  return `来源：${source}`;
}

function formatSearchTime(value: string) {
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

function toProfileFromHistory(history: SearchHistoryItem): UserProfile {
  return {
    educationLevel: history.educationLevel,
    expectedSalaryMin: history.expectedSalaryMin,
    expectedSalaryMax: history.expectedSalaryMax,
    city: history.city,
    keywords: history.keywords,
    experienceYears: history.experienceYears,
  };
}

async function getSearchRequestHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isSupabaseConfigured()) {
    return headers;
  }

  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

function renderProfileMatch(profileMatch: ProfileMatch | undefined) {
  if (!profileMatch || profileMatch.state === "unauthenticated") {
    return (
      <p className="mt-2 text-sm font-semibold text-teal-700">
        登录后查看匹配度
      </p>
    );
  }

  if (profileMatch.state === "missing" || profileMatch.score === null) {
    return (
      <p className="mt-2 text-sm font-semibold text-teal-700">
        完善求职偏好后查看匹配度{" "}
        <Link
          className="underline decoration-teal-500 underline-offset-4"
          href="/profile"
        >
          去完善资料
        </Link>
      </p>
    );
  }

  return (
    <>
      <p className="mt-2 text-2xl font-bold text-teal-800">
        匹配度 {profileMatch.score}%
      </p>
      <div className="mt-3">
        <p className="text-sm font-semibold text-teal-900">推荐理由：</p>
        <ul className="mt-2 space-y-2 text-sm text-teal-800">
          {profileMatch.reasons.slice(0, 2).map((reason) => (
            <li className="rounded-md bg-white/70 px-3 py-2" key={reason}>
              - {reason}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default function SearchPage() {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [matches, setMatches] = useState<SearchResultMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [searchHistories, setSearchHistories] = useState<SearchHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadSearchHistory() {
      setHistoryError("");

      try {
        const response = await fetch("/api/search-history");

        if (response.status === 401) {
          throw new Error("登录后可查看搜索记录");
        }

        if (!response.ok) {
          throw new Error("搜索记录加载失败");
        }

        const data = (await response.json()) as SearchHistoryResponse;

        if (isActive) {
          setSearchHistories(data.histories);
        }
      } catch (error) {
        if (isActive) {
          setSearchHistories([]);
          setHistoryError(
            error instanceof Error ? error.message : "搜索记录暂时不可用",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadSearchHistory();

    return () => {
      isActive = false;
    };
  }, []);

  function updateProfile<Field extends keyof UserProfile>(
    field: Field,
    value: UserProfile[Field],
  ) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  async function saveSearchHistory(
    searchProfile: UserProfile,
    result: SearchResponse,
  ) {
    try {
      const response = await fetch("/api/search-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...searchProfile,
          source: result.source,
          resultCount: result.jobs.length,
        }),
      });

      if (response.status === 401) {
        throw new Error("登录后可保存搜索记录");
      }

      if (!response.ok) {
        throw new Error("搜索记录保存失败");
      }

      const data = (await response.json()) as SaveSearchHistoryResponse;

      setSearchHistories((currentHistories) => [
        data.history,
        ...currentHistories
          .filter((history) => history.id !== data.history.id)
          .slice(0, 9),
      ]);
      setHistoryError("");
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "搜索记录保存失败，但职位匹配结果不受影响",
      );
    }
  }

  async function runSearch(
    searchProfile: UserProfile,
    options: { saveHistory?: boolean } = {},
  ) {
    const shouldSaveHistory = options.saveHistory ?? true;

    setIsSearching(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: await getSearchRequestHeaders(),
        body: JSON.stringify(searchProfile),
      });

      if (!response.ok) {
        throw new Error("职位搜索失败，请稍后重试");
      }

      const data = (await response.json()) as SearchResponse;

      setMatches(data.jobs);
      setDataSource(data.source);
      setHasSearched(true);

      if (shouldSaveHistory) {
        void saveSearchHistory(searchProfile, data);
      }
    } catch (error) {
      setMatches([]);
      setDataSource("");
      setErrorMessage(error instanceof Error ? error.message : "职位搜索失败");
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch(profile);
  }

  function handleHistoryClick(history: SearchHistoryItem) {
    const nextProfile = toProfileFromHistory(history);

    setProfile(nextProfile);
    void runSearch(nextProfile, { saveHistory: false });
  }

  async function handleClearHistory() {
    setHistoryError("");

    try {
      const response = await fetch("/api/search-history", {
        method: "DELETE",
      });

      if (response.status === 401) {
        throw new Error("登录后可清空搜索记录");
      }

      if (!response.ok) {
        throw new Error("清空搜索记录失败");
      }

      setSearchHistories([]);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "清空搜索记录失败，请稍后重试",
      );
    }
  }

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
        <div className="mx-auto max-w-6xl">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            填写求职条件
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            输入你的求职偏好，系统会根据关键词、城市、薪资、学历和经验进行职位匹配。
          </p>
          <p className="mt-3 text-sm font-medium text-teal-700">
            数据来源：国内示例数据
          </p>
        </section>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">最近搜索</h2>
              <p className="mt-1 text-sm text-slate-500">
                点击任意记录可自动填充条件并重新匹配职位。
              </p>
            </div>
            <button
              className="inline-flex justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoadingHistory || searchHistories.length === 0}
              onClick={handleClearHistory}
              type="button"
            >
              清空搜索记录
            </button>
          </div>

          {historyError ? (
            <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              {historyError}
            </p>
          ) : null}

          <div className="mt-5">
            {isLoadingHistory ? (
              <div className="rounded-md bg-slate-50 px-4 py-5 text-sm text-slate-500">
                正在加载搜索记录...
              </div>
            ) : searchHistories.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {searchHistories.map((history) => (
                  <button
                    className="rounded-md border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-teal-200 hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
                    key={history.id}
                    onClick={() => handleHistoryClick(history)}
                    type="button"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-bold text-slate-950">
                          {history.city || "不限城市"} ·{" "}
                          {history.keywords || "不限岗位"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {history.educationLevel} ·{" "}
                          {history.expectedSalaryMin}-
                          {history.expectedSalaryMax} 元/月 ·{" "}
                          {history.experienceYears === 0
                            ? "经验不限"
                            : `${history.experienceYears} 年经验`}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {formatSearchTime(history.createdAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-md bg-slate-50 px-4 py-5 text-sm text-slate-500">
                暂无搜索记录。完成一次搜索后，可以在这里快速复用条件。
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <form
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            onSubmit={handleSubmit}
          >
            <label className="block">
              <span className="text-sm font-medium text-slate-700">学历</span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                value={profile.educationLevel}
                onChange={(event) =>
                  updateProfile(
                    "educationLevel",
                    event.target.value as UserProfile["educationLevel"],
                  )
                }
              >
                {educationLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                期望最低薪资（元/月）
              </span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                min={0}
                type="number"
                value={profile.expectedSalaryMin}
                onChange={(event) =>
                  updateProfile("expectedSalaryMin", Number(event.target.value))
                }
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                期望最高薪资（元/月）
              </span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                min={0}
                type="number"
                value={profile.expectedSalaryMax}
                onChange={(event) =>
                  updateProfile("expectedSalaryMax", Number(event.target.value))
                }
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">城市</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                type="text"
                value={profile.city}
                onChange={(event) => updateProfile("city", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                岗位关键词
              </span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                type="text"
                value={profile.keywords}
                onChange={(event) => updateProfile("keywords", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                工作经验年限
              </span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                min={0}
                type="number"
                value={profile.experienceYears}
                onChange={(event) =>
                  updateProfile("experienceYears", Number(event.target.value))
                }
              />
            </label>

            <div className="md:col-span-2 lg:col-span-3">
              <button
                className="w-full rounded-md bg-teal-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 sm:w-auto"
                disabled={isSearching}
                type="submit"
              >
                {isSearching ? "正在匹配..." : "开始匹配职位"}
              </button>
            </div>
          </form>
        </section>

        {hasSearched ? (
          <section className="mt-10">
            {dataSource ? (
              <p className="mb-4 text-sm font-medium text-slate-500">
                数据来源：国内示例数据
              </p>
            ) : null}
            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-white p-8 text-center shadow-lg shadow-slate-200/60">
                <p className="text-base font-semibold text-red-600">
                  搜索暂时失败
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {errorMessage}
                </p>
              </div>
            ) : matches.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {matches.map((match) => {
                  const { job, matchScore, matchReasons } = match;

                  return (
                  <article
                    className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60"
                    key={job.id}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-950">
                          {job.title}
                        </h2>
                        <span className="mt-3 inline-flex rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {getSourceLabel(job.source)}
                        </span>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                          {job.company}
                        </p>
                      </div>
                      <div className="rounded-md bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700">
                        匹配分数 {matchScore}
                      </div>
                    </div>

                    <section className="mt-5 rounded-md border border-teal-100 bg-teal-50 px-4 py-4">
                      <h3 className="text-sm font-bold text-teal-900">
                        个性化匹配度
                      </h3>
                      {renderProfileMatch(match.profileMatch)}
                    </section>

                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-md bg-slate-50 px-4 py-3">
                        <dt className="text-slate-500">城市</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {job.city}
                        </dd>
                      </div>
                      <div className="rounded-md bg-slate-50 px-4 py-3">
                        <dt className="text-slate-500">薪资范围</dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {formatSalary(match)}
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
                    </dl>

                    <p className="mt-5 text-sm leading-6 text-slate-600">
                      {job.description}
                    </p>

                    <div className="mt-5">
                      <h3 className="text-sm font-semibold text-slate-900">
                        匹配理由
                      </h3>
                      <ul className="mt-2 space-y-2 text-sm text-slate-600">
                        {matchReasons.map((reason) => (
                          <li className="rounded-md bg-slate-50 px-3 py-2" key={reason}>
                            {reason}
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
                      <a
                        className="inline-flex justify-center rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-950/20"
                        href={job.applyUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        申请链接
                      </a>
                    </div>
                  </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-200/60">
                <p className="text-base font-semibold text-slate-900">
                  暂无匹配职位
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  可以尝试放宽薪资范围、减少关键词，或换一个城市继续搜索。
                </p>
              </div>
            )}
          </section>
        ) : null}
        </div>
      </main>
    </>
  );
}
