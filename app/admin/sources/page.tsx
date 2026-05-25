"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type DataSourceItem = {
  id: string;
  name: string;
  code: string;
  type: string;
  websiteUrl: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DataSourcesResponse = {
  sources: DataSourceItem[];
};

type SourceFormState = {
  name: string;
  code: string;
  type: string;
  websiteUrl: string;
  description: string;
};

const initialFormState: SourceFormState = {
  name: "",
  code: "",
  type: "manual",
  websiteUrl: "",
  description: "",
};

const inputClassName =
  "mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function normalizeCode(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [formState, setFormState] = useState<SourceFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutatingSourceId, setMutatingSourceId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadSources() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/sources");

      if (!response.ok) {
        throw new Error("数据源列表加载失败");
      }

      const data = (await response.json()) as DataSourcesResponse;
      setSources(data.sources);
    } catch (error) {
      setSources([]);
      setErrorMessage(
        error instanceof Error ? error.message : "数据源列表加载失败",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialSources() {
      try {
        const response = await fetch("/api/admin/sources");

        if (!response.ok) {
          throw new Error("数据源列表加载失败");
        }

        const data = (await response.json()) as DataSourcesResponse;

        if (isActive) {
          setSources(data.sources);
        }
      } catch (error) {
        if (isActive) {
          setSources([]);
          setErrorMessage(
            error instanceof Error ? error.message : "数据源列表加载失败",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialSources();

    return () => {
      isActive = false;
    };
  }, []);

  function updateForm<Field extends keyof SourceFormState>(
    field: Field,
    value: SourceFormState[Field],
  ) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formState,
          code: normalizeCode(formState.code),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "新增数据源失败");
      }

      setFormState(initialFormState);
      await loadSources();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "新增数据源失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateSource(source: DataSourceItem, isActive: boolean) {
    setMutatingSourceId(source.id);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/sources", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: source.id,
          name: source.name,
          code: source.code,
          type: source.type,
          websiteUrl: source.websiteUrl,
          description: source.description,
          isActive,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "更新数据源失败");
      }

      await loadSources();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "更新数据源失败");
    } finally {
      setMutatingSourceId("");
    }
  }

  async function deleteSource(source: DataSourceItem) {
    const confirmed = window.confirm(`确认删除数据源“${source.name}”？`);

    if (!confirmed) {
      return;
    }

    setMutatingSourceId(source.id);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/sources", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: source.id,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "删除数据源失败");
      }

      await loadSources();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除数据源失败");
    } finally {
      setMutatingSourceId("");
    }
  }

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
            数据源管理
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            维护未来接入中国招聘数据源的基础配置。
          </p>
        </section>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <h2 className="text-xl font-bold text-slate-950">新增数据源</h2>
          <form
            className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            onSubmit={handleSubmit}
          >
            <label className="block">
              <span className="text-sm font-medium text-slate-700">名称</span>
              <input
                className={inputClassName}
                onChange={(event) => updateForm("name", event.target.value)}
                required
                type="text"
                value={formState.name}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Code</span>
              <input
                className={inputClassName}
                onChange={(event) =>
                  updateForm("code", normalizeCode(event.target.value))
                }
                placeholder="boss-zhipin"
                required
                type="text"
                value={formState.code}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">类型</span>
              <input
                className={inputClassName}
                onChange={(event) => updateForm("type", event.target.value)}
                required
                type="text"
                value={formState.type}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                网站地址
              </span>
              <input
                className={inputClassName}
                onChange={(event) =>
                  updateForm("websiteUrl", event.target.value)
                }
                type="url"
                value={formState.websiteUrl}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">描述</span>
              <input
                className={inputClassName}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                type="text"
                value={formState.description}
              />
            </label>

            <div className="lg:col-span-3">
              <button
                className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "正在保存..." : "新增数据源"}
              </button>
            </div>
          </form>
        </section>

        {errorMessage ? (
          <section className="mt-8 rounded-lg border border-red-200 bg-white p-6 text-center text-red-600 shadow-lg shadow-slate-200/60">
            {errorMessage}
          </section>
        ) : null}

        <section className="mt-10 rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-950">数据源列表</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isLoading ? "正在加载数据源..." : `共 ${sources.length} 个数据源`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">名称</th>
                  <th className="px-6 py-4 font-semibold">Code</th>
                  <th className="px-6 py-4 font-semibold">类型</th>
                  <th className="px-6 py-4 font-semibold">网站地址</th>
                  <th className="px-6 py-4 font-semibold">状态</th>
                  <th className="px-6 py-4 font-semibold">创建时间</th>
                  <th className="px-6 py-4 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={7}>
                      正在加载数据源...
                    </td>
                  </tr>
                ) : sources.length > 0 ? (
                  sources.map((source) => (
                    <tr className="transition hover:bg-slate-50" key={source.id}>
                      <td className="px-6 py-4 font-semibold text-slate-950">
                        {source.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {source.code}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {source.type}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {source.websiteUrl ? (
                          <a
                            className="font-semibold text-teal-700 transition hover:text-teal-800"
                            href={source.websiteUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {source.websiteUrl}
                          </a>
                        ) : (
                          "未填写"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${
                            source.isActive
                              ? "bg-teal-50 text-teal-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {source.isActive ? "已启用" : "已停用"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDate(source.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            className="font-semibold text-teal-700 transition hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={mutatingSourceId === source.id}
                            onClick={() => updateSource(source, !source.isActive)}
                            type="button"
                          >
                            {source.isActive ? "停用" : "启用"}
                          </button>
                          <button
                            className="font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={mutatingSourceId === source.id}
                            onClick={() => deleteSource(source)}
                            type="button"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={7}>
                      暂无数据源
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
