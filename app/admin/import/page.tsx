"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ImportResult = {
  importedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: Array<{
    index: number;
    message: string;
  }>;
};

const jsonExample = [
  {
    title: "前端开发工程师",
    company: "示例科技有限公司",
    city: "上海",
    province: "上海",
    salaryMin: 15000,
    salaryMax: 25000,
    salaryText: "15k-25k 元/月",
    educationRequirement: "本科",
    experienceRequirement: 3,
    description: "负责招聘平台前端页面和组件开发。",
    applyUrl: "https://example.com/jobs/frontend",
    source: "manual-import",
    sourceJobId: "frontend-001",
    publishedAt: "2026-05-25",
  },
  {
    title: "数据分析师",
    company: "示例数据服务有限公司",
    city: "杭州",
    province: "浙江",
    salaryMin: 12000,
    salaryMax: 22000,
    salaryText: "12k-22k 元/月",
    educationRequirement: "本科",
    experienceRequirement: 1,
    description: "负责招聘数据分析、指标看板和业务洞察。",
    applyUrl: "https://example.com/jobs/data-analyst",
    source: "manual-import",
    sourceJobId: "data-001",
    publishedAt: "2026-05-25",
  },
];

const exampleText = JSON.stringify(jsonExample, null, 2);

export default function AdminImportPage() {
  const [jsonText, setJsonText] = useState(exampleText);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setResult(null);

    try {
      const parsedJobs = JSON.parse(jsonText) as unknown;

      if (!Array.isArray(parsedJobs)) {
        throw new Error("请粘贴 JSON 职位数组");
      }

      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedJobs),
      });

      if (!response.ok) {
        throw new Error("导入失败，请检查 JSON 内容后重试");
      }

      const importResult = (await response.json()) as ImportResult;
      setResult(importResult);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "导入失败，请稍后重试",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
      <div className="mx-auto max-w-5xl">
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
            导入职位
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            粘贴 JSON 职位数组，批量创建或更新数据库中的职位记录。
          </p>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <form onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  JSON 职位数组
                </span>
                <textarea
                  className="mt-2 min-h-[520px] w-full rounded-md border border-slate-300 bg-white px-3 py-3 font-mono text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                  onChange={(event) => setJsonText(event.target.value)}
                  value={jsonText}
                />
              </label>

              {errorMessage ? (
                <div className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {errorMessage}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "正在导入..." : "导入"}
                </button>
                <button
                  className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                  onClick={() => {
                    setJsonText(exampleText);
                    setResult(null);
                    setErrorMessage("");
                  }}
                  type="button"
                >
                  填入示例
                </button>
              </div>
            </form>
          </article>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <h2 className="text-xl font-bold text-slate-950">JSON 示例</h2>
              <pre className="mt-4 max-h-[360px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {exampleText}
              </pre>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <h2 className="text-xl font-bold text-slate-950">导入结果</h2>
              {result ? (
                <div className="mt-4 space-y-4">
                  <dl className="grid gap-3 text-sm">
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">新增数量</dt>
                      <dd className="mt-1 font-bold text-slate-950">
                        {result.importedCount}
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">更新数量</dt>
                      <dd className="mt-1 font-bold text-slate-950">
                        {result.updatedCount}
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">失败数量</dt>
                      <dd className="mt-1 font-bold text-slate-950">
                        {result.failedCount}
                      </dd>
                    </div>
                  </dl>

                  {result.errors.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        错误明细
                      </h3>
                      <ul className="mt-2 space-y-2 text-sm text-red-600">
                        {result.errors.map((error) => (
                          <li
                            className="rounded-md bg-red-50 px-3 py-2"
                            key={`${error.index}-${error.message}`}
                          >
                            第 {error.index + 1} 条：{error.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 rounded-md bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  提交导入后会在这里看到统计结果。
                </p>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
