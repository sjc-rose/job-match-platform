"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const DEFAULT_PAGE_SIZE = 20;

type AdminJob = {
  id: string;
  title: string;
  company: string;
  city: string;
  province: string;
  salaryMin: number;
  salaryMax: number;
  salaryText: string;
  educationRequirement: string;
  experienceRequirement: number;
  publishedAt: string;
};

type AdminJobsResponse = {
  jobs: AdminJob[];
  sources: string[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const emptyJobsResponse: AdminJobsResponse = {
  jobs: [],
  sources: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalPages: 1,
};

function formatDate(value: string) {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    return "未发布";
  }

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatExperience(years: number) {
  return years === 0 ? "经验不限" : `${years} 年以上`;
}

function formatSalary(job: AdminJob) {
  return job.salaryText || `${job.salaryMin}-${job.salaryMax} 元/月`;
}

function formatLocation(job: AdminJob) {
  return job.province === job.city ? job.city : `${job.province} · ${job.city}`;
}

function getInitialSource() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("source")?.trim() ?? "";
}

function getInitialQueryValue(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get(key)?.trim() ?? "";
}

function getInitialPage() {
  if (typeof window === "undefined") {
    return 1;
  }

  const page = Number(new URLSearchParams(window.location.search).get("page"));

  return Number.isInteger(page) && page > 0 ? page : 1;
}

type JobsQueryState = {
  keyword: string;
  city: string;
  company: string;
  source: string;
  page: number;
};

function buildJobsUrl(queryState: JobsQueryState) {
  const params = new URLSearchParams();

  if (queryState.source) {
    params.set("source", queryState.source);
  }

  if (queryState.keyword) {
    params.set("keyword", queryState.keyword);
  }

  if (queryState.city) {
    params.set("city", queryState.city);
  }

  if (queryState.company) {
    params.set("company", queryState.company);
  }

  params.set("page", String(queryState.page));

  return `/admin/jobs?${params.toString()}`;
}

export default function AdminJobsPage() {
  const [keywordInput, setKeywordInput] = useState(() =>
    getInitialQueryValue("keyword"),
  );
  const [cityInput, setCityInput] = useState(() => getInitialQueryValue("city"));
  const [companyInput, setCompanyInput] = useState(() =>
    getInitialQueryValue("company"),
  );
  const [keyword, setKeyword] = useState(() => getInitialQueryValue("keyword"));
  const [city, setCity] = useState(() => getInitialQueryValue("city"));
  const [company, setCompany] = useState(() => getInitialQueryValue("company"));
  const [source, setSource] = useState(getInitialSource);
  const [page, setPage] = useState(getInitialPage);
  const [data, setData] = useState<AdminJobsResponse>(emptyJobsResponse);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [deletingJobId, setDeletingJobId] = useState("");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadJobs() {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(DEFAULT_PAGE_SIZE),
      });

      if (keyword) {
        params.set("keyword", keyword);
      }

      if (city) {
        params.set("city", city);
      }

      if (company) {
        params.set("company", company);
      }

      if (source) {
        params.set("source", source);
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`/api/admin/jobs?${params.toString()}`);

        if (!response.ok) {
          throw new Error("职位列表加载失败");
        }

        const jobsData = (await response.json()) as AdminJobsResponse;

        if (isActive) {
          setData(jobsData);
          setSelectedJobIds((currentSelectedJobIds) =>
            currentSelectedJobIds.filter((jobId) =>
              jobsData.jobs.some((job) => job.id === jobId),
            ),
          );
        }
      } catch (error) {
        if (isActive) {
          setData(emptyJobsResponse);
          setErrorMessage(
            error instanceof Error ? error.message : "职位列表加载失败",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      isActive = false;
    };
  }, [city, company, keyword, page, refreshToken, source]);

  function updateJobsQuery(queryState: JobsQueryState) {
    window.history.pushState(null, "", buildJobsUrl(queryState));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextKeyword = keywordInput.trim();
    const nextCity = cityInput.trim();
    const nextCompany = companyInput.trim();

    setKeyword(nextKeyword);
    setCity(nextCity);
    setCompany(nextCompany);
    setPage(1);
    setSelectedJobIds([]);
    updateJobsQuery({
      keyword: nextKeyword,
      city: nextCity,
      company: nextCompany,
      source,
      page: 1,
    });
  }

  function handleReset() {
    setKeywordInput("");
    setCityInput("");
    setCompanyInput("");
    setKeyword("");
    setCity("");
    setCompany("");
    setSource("");
    setPage(1);
    setSelectedJobIds([]);
    window.history.pushState(null, "", "/admin/jobs");
  }

  function handleSourceChange(nextSource: string) {
    setSource(nextSource);
    setSelectedJobIds([]);
    setPage(1);
    updateJobsQuery({
      keyword,
      city,
      company,
      source: nextSource,
      page: 1,
    });
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    setSelectedJobIds([]);
    updateJobsQuery({
      keyword,
      city,
      company,
      source,
      page: nextPage,
    });
  }

  function toggleJobSelection(jobId: string) {
    setSelectedJobIds((currentSelectedJobIds) =>
      currentSelectedJobIds.includes(jobId)
        ? currentSelectedJobIds.filter((selectedJobId) => selectedJobId !== jobId)
        : [...currentSelectedJobIds, jobId],
    );
  }

  function toggleCurrentPageSelection() {
    const currentPageJobIds = data.jobs.map((job) => job.id);
    const isEveryCurrentPageJobSelected =
      currentPageJobIds.length > 0 &&
      currentPageJobIds.every((jobId) => selectedJobIds.includes(jobId));

    if (isEveryCurrentPageJobSelected) {
      setSelectedJobIds((currentSelectedJobIds) =>
        currentSelectedJobIds.filter(
          (jobId) => !currentPageJobIds.includes(jobId),
        ),
      );
      return;
    }

    setSelectedJobIds((currentSelectedJobIds) => [
      ...new Set([...currentSelectedJobIds, ...currentPageJobIds]),
    ]);
  }

  async function handleDeleteJob(job: AdminJob) {
    const confirmed = window.confirm(
      `确认删除职位“${job.title}”？关联收藏记录会一并删除。`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingJobId(job.id);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除职位失败，请稍后重试");
      }

      if (data.jobs.length === 1 && page > 1) {
        handlePageChange(Math.max(1, page - 1));
      } else {
        setRefreshToken((currentToken) => currentToken + 1);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "删除职位失败，请稍后重试",
      );
    } finally {
      setDeletingJobId("");
    }
  }

  async function handleBulkDeleteJobs() {
    if (selectedJobIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `确认删除选中的 ${selectedJobIds.length} 个职位？关联收藏记录会一并删除。`,
    );

    if (!confirmed) {
      return;
    }

    setIsBulkDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/jobs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobIds: selectedJobIds,
        }),
      });

      if (!response.ok) {
        throw new Error("批量删除职位失败，请稍后重试");
      }

      setSelectedJobIds([]);

      if (selectedJobIds.length >= data.jobs.length && page > 1) {
        handlePageChange(Math.max(1, page - 1));
      } else {
        setRefreshToken((currentToken) => currentToken + 1);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "批量删除职位失败，请稍后重试",
      );
    } finally {
      setIsBulkDeleting(false);
    }
  }

  const canGoPrevious = data.page > 1;
  const canGoNext = data.page < data.totalPages;
  const isEveryCurrentPageJobSelected =
    data.jobs.length > 0 &&
    data.jobs.every((job) => selectedJobIds.includes(job.id));

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
            职位管理
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            按关键词和城市筛选数据库中的职位记录。
          </p>
          <Link
            className="mt-6 inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
            href="/admin/jobs/new"
          >
            新增职位
          </Link>
        </section>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <form
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
            onSubmit={handleSubmit}
          >
            <label className="block">
              <span className="text-sm font-medium text-slate-700">关键词</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="职位标题、公司或描述"
                type="text"
                value={keywordInput}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">城市</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                onChange={(event) => setCityInput(event.target.value)}
                placeholder="例如 上海"
                type="text"
                value={cityInput}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">公司</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                onChange={(event) => setCompanyInput(event.target.value)}
                placeholder="例如 测试科技"
                type="text"
                value={companyInput}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                数据来源
              </span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                onChange={(event) => handleSourceChange(event.target.value)}
                value={source}
              >
                <option value="">全部来源</option>
                {data.sources.map((sourceValue) => (
                  <option key={sourceValue} value={sourceValue}>
                    {sourceValue}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-3">
              <button
                className="h-11 rounded-md bg-teal-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
                type="submit"
              >
                筛选
              </button>
              <button
                className="h-11 rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                onClick={handleReset}
                type="button"
              >
                清空筛选
              </button>
            </div>
          </form>
        </section>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">职位列表</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isLoading
                  ? "正在加载职位..."
                  : `共 ${data.total} 条记录，第 ${data.page} / ${data.totalPages} 页`}
              </p>
            </div>
            <button
              className="inline-flex justify-center rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectedJobIds.length === 0 || isBulkDeleting}
              onClick={handleBulkDeleteJobs}
              type="button"
            >
              {isBulkDeleting
                ? "正在删除..."
                : `批量删除选中职位${
                    selectedJobIds.length > 0 ? `（${selectedJobIds.length}）` : ""
                  }`}
            </button>
          </div>

          {errorMessage ? (
            <div className="p-6">
              <div className="rounded-md bg-red-50 px-4 py-5 text-center text-sm font-medium text-red-600">
                {errorMessage}
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    <input
                      aria-label="选择当前页全部职位"
                      checked={isEveryCurrentPageJobSelected}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                      disabled={isLoading || data.jobs.length === 0}
                      onChange={toggleCurrentPageSelection}
                      type="checkbox"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold">职位标题</th>
                  <th className="px-6 py-4 font-semibold">公司</th>
                  <th className="px-6 py-4 font-semibold">城市</th>
                  <th className="px-6 py-4 font-semibold">薪资</th>
                  <th className="px-6 py-4 font-semibold">学历要求</th>
                  <th className="px-6 py-4 font-semibold">经验要求</th>
                  <th className="px-6 py-4 font-semibold">发布时间</th>
                  <th className="px-6 py-4 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={9}>
                      正在加载职位...
                    </td>
                  </tr>
                ) : data.jobs.length > 0 ? (
                  data.jobs.map((job) => (
                    <tr className="transition hover:bg-slate-50" key={job.id}>
                      <td className="px-6 py-4">
                        <input
                          aria-label={`选择职位 ${job.title}`}
                          checked={selectedJobIds.includes(job.id)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                          onChange={() => toggleJobSelection(job.id)}
                          type="checkbox"
                        />
                      </td>
                      <td className="max-w-xs px-6 py-4 font-semibold text-slate-950">
                        {job.title}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{job.company}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatLocation(job)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatSalary(job)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {job.educationRequirement}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatExperience(job.experienceRequirement)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDate(job.publishedAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            className="font-semibold text-teal-700 transition hover:text-teal-800"
                            href={`/jobs/${job.id}`}
                          >
                            查看详情
                          </Link>
                          <Link
                            className="font-semibold text-slate-700 transition hover:text-slate-950"
                            href={`/admin/jobs/${job.id}/edit`}
                          >
                            编辑
                          </Link>
                          <button
                            className="font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={deletingJobId === job.id}
                            onClick={() => handleDeleteJob(job)}
                            type="button"
                          >
                            {deletingJobId === job.id ? "删除中..." : "删除"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={9}>
                      暂无职位记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              每页 {data.pageSize} 条，共 {data.totalPages} 页
            </p>
            <div className="flex gap-3">
              <button
                className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || !canGoPrevious}
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                type="button"
              >
                上一页
              </button>
              <button
                className="rounded-md bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || !canGoNext}
                onClick={() => handlePageChange(Math.min(data.totalPages, page + 1))}
                type="button"
              >
                下一页
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
