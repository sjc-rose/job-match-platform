"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createJobDedupKey, isInvalidImportJob } from "@/lib/importDedup";

type ImportResult = {
  total: number;
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  errors: number;
  errorDetails: Array<{
    index: number;
    message: string;
  }>;
  importedCount?: number;
  updatedCount?: number;
  failedCount?: number;
};

type ImportMode = "json" | "csv";
type ImportJob = Record<string, unknown>;
type PreviewStatus = "ready" | "duplicate" | "invalid";

type DataSourceItem = {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
};

type DataSourcesResponse = {
  sources: DataSourceItem[];
};

const csvHeaders = [
  "title",
  "company",
  "city",
  "province",
  "salaryMin",
  "salaryMax",
  "salaryText",
  "educationRequirement",
  "experienceRequirement",
  "description",
  "applyUrl",
  "source",
  "sourceJobId",
  "publishedAt",
] as const;

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
const csvExample = `${csvHeaders.join(",")}
前端开发工程师,示例科技有限公司,上海,上海,15000,25000,15k-25k 元/月,本科,3,负责招聘平台前端页面和组件开发。,https://example.com/jobs/frontend,manual-import,frontend-001,2026-05-25
数据分析师,示例数据服务有限公司,杭州,浙江,12000,22000,12k-22k 元/月,本科,1,负责招聘数据分析、指标看板和业务洞察。,https://example.com/jobs/data-analyst,manual-import,data-001,2026-05-25`;

function parseCsvRows(csvText: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let isInQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && isInQuotes && nextChar === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      isInQuotes = !isInQuotes;
      continue;
    }

    if (char === "," && !isInQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !isInQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentCell.trim());

      if (currentRow.some((cell) => cell !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell.trim());

  if (currentRow.some((cell) => cell !== "")) {
    rows.push(currentRow);
  }

  if (isInQuotes) {
    throw new Error("CSV 引号未闭合");
  }

  return rows;
}

function parseCsvJobs(csvText: string) {
  const rows = parseCsvRows(csvText);
  const [headerRow, ...dataRows] = rows;

  if (!headerRow || headerRow.length === 0) {
    throw new Error("CSV 第一行必须是表头");
  }

  return dataRows.map((row) =>
    headerRow.reduce<Record<string, string>>((job, header, index) => {
      const fieldName = header.trim();

      if (fieldName) {
        job[fieldName] = row[index] ?? "";
      }

      return job;
    }, {}),
  );
}

function isImportJob(value: unknown): value is ImportJob {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseJsonJobs(jsonText: string) {
  const parsedJobs = JSON.parse(jsonText) as unknown;

  if (!Array.isArray(parsedJobs)) {
    throw new Error("请粘贴 JSON 职位数组");
  }

  return parsedJobs.map((job, index) => {
    if (!isImportJob(job)) {
      throw new Error(`第 ${index + 1} 条职位必须是对象`);
    }

    return job;
  });
}

function parseImportJobs(importMode: ImportMode, text: string) {
  return importMode === "json" ? parseJsonJobs(text) : parseCsvJobs(text);
}

function getPreviewText(job: ImportJob, field: string) {
  const value = job[field];

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function formatPreviewSalary(job: ImportJob) {
  const salaryText = getPreviewText(job, "salaryText");

  if (salaryText) {
    return salaryText;
  }

  const salaryMin = getPreviewText(job, "salaryMin");
  const salaryMax = getPreviewText(job, "salaryMax");

  if (!salaryMin && !salaryMax) {
    return "未填写";
  }

  return `${salaryMin || "0"}-${salaryMax || "0"} 元/月`;
}

function applySelectedSource(jobs: ImportJob[], sourceCode: string) {
  return jobs.map((job) => ({
    ...job,
    source: sourceCode,
  }));
}

function getDedupInput(job: ImportJob) {
  return {
    city: getPreviewText(job, "city"),
    company: getPreviewText(job, "company"),
    source: getPreviewText(job, "source"),
    title: getPreviewText(job, "title"),
  };
}

function getPreviewSummary(jobs: ImportJob[]) {
  const seenKeys = new Set<string>();
  let importable = 0;
  let skippedDuplicates = 0;
  let skippedInvalid = 0;

  const rows = jobs.map((job, index) => {
    let status: PreviewStatus = "ready";
    const dedupInput = getDedupInput(job);

    if (isInvalidImportJob(dedupInput)) {
      status = "invalid";
      skippedInvalid += 1;
    } else {
      const dedupKey = createJobDedupKey(dedupInput);

      if (seenKeys.has(dedupKey)) {
        status = "duplicate";
        skippedDuplicates += 1;
      } else {
        seenKeys.add(dedupKey);
        importable += 1;
      }
    }

    return {
      index,
      job,
      status,
    };
  });

  return {
    importable,
    rows,
    skippedDuplicates,
    skippedInvalid,
    total: jobs.length,
  };
}

function getStatusLabel(status: PreviewStatus) {
  if (status === "invalid") {
    return "无效";
  }

  if (status === "duplicate") {
    return "可能重复";
  }

  return "可导入";
}

function getStatusClassName(status: PreviewStatus) {
  if (status === "invalid") {
    return "bg-red-50 text-red-700";
  }

  if (status === "duplicate") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

export default function AdminImportPage() {
  const [importMode, setImportMode] = useState<ImportMode>("json");
  const [jsonText, setJsonText] = useState(exampleText);
  const [csvText, setCsvText] = useState(csvExample);
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [selectedSourceCode, setSelectedSourceCode] = useState("");
  const [previewJobs, setPreviewJobs] = useState<ImportJob[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentText = importMode === "json" ? jsonText : csvText;
  const activeDataSources = dataSources.filter((source) => source.isActive);
  const previewSummary = getPreviewSummary(previewJobs);

  useEffect(() => {
    let isActive = true;

    async function loadDataSources() {
      try {
        const response = await fetch("/api/admin/sources");

        if (!response.ok) {
          throw new Error("数据源加载失败");
        }

        const data = (await response.json()) as DataSourcesResponse;

        if (isActive) {
          setDataSources(data.sources.filter((source) => source.isActive));
        }
      } catch (error) {
        if (isActive) {
          setDataSources([]);
          setErrorMessage(
            error instanceof Error ? error.message : "数据源加载失败",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingSources(false);
        }
      }
    }

    void loadDataSources();

    return () => {
      isActive = false;
    };
  }, []);

  function resetPreview() {
    setPreviewJobs([]);
    setIsPreviewReady(false);
    setResult(null);
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const fileText = await file.text();

      if (importMode === "json") {
        setJsonText(fileText);
      } else {
        setCsvText(fileText);
      }

      setSelectedFileName(file.name);
      setErrorMessage("");
      resetPreview();
    } catch {
      setErrorMessage("文件读取失败，请重新选择文件");
    }
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setResult(null);

    try {
      if (activeDataSources.length === 0) {
        throw new Error("请先到 /admin/sources 新增并启用数据源。");
      }

      if (!selectedSourceCode) {
        throw new Error("请选择数据源后再预览导入");
      }

      const parsedJobs = parseImportJobs(importMode, currentText);

      if (parsedJobs.length === 0) {
        throw new Error("没有可预览的职位数据");
      }

      setPreviewJobs(applySelectedSource(parsedJobs, selectedSourceCode));
      setIsPreviewReady(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "解析失败，请检查内容后重试",
      );
      resetPreview();
    }
  }

  async function handleConfirmImport() {
    if (previewJobs.length === 0) {
      setErrorMessage("请先预览导入内容");
      return;
    }

    if (!selectedSourceCode) {
      setErrorMessage("请选择数据源后再确认导入");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applySelectedSource(previewJobs, selectedSourceCode)),
      });

      if (!response.ok) {
        throw new Error("导入失败，请检查内容后重试");
      }

      const importResult = (await response.json()) as ImportResult;
      setResult(importResult);
      setIsPreviewReady(false);
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
            粘贴 JSON 职位数组或 CSV 文本，批量创建或更新数据库中的职位记录。
          </p>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <form onSubmit={handlePreview}>
              <div className="mb-5 inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
                <button
                  className={`rounded px-4 py-2 text-sm font-semibold transition ${
                    importMode === "json"
                      ? "bg-white text-teal-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                  onClick={() => {
                    setImportMode("json");
                    setSelectedFileName("");
                    setErrorMessage("");
                    resetPreview();
                  }}
                  type="button"
                >
                  JSON
                </button>
                <button
                  className={`rounded px-4 py-2 text-sm font-semibold transition ${
                    importMode === "csv"
                      ? "bg-white text-teal-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                  onClick={() => {
                    setImportMode("csv");
                    setSelectedFileName("");
                    setErrorMessage("");
                    resetPreview();
                  }}
                  type="button"
                >
                  CSV
                </button>
              </div>

              <label className="mb-5 block">
                <span className="text-sm font-medium text-slate-700">
                  数据源
                </span>
                <select
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  disabled={isLoadingSources || activeDataSources.length === 0}
                  onChange={(event) => {
                    setSelectedSourceCode(event.target.value);
                    resetPreview();
                    setErrorMessage("");
                  }}
                  value={selectedSourceCode}
                >
                  <option value="">
                    {isLoadingSources ? "正在加载数据源..." : "请选择数据源"}
                  </option>
                  {activeDataSources.map((source) => (
                    <option key={source.id} value={source.code}>
                      {source.name}（{source.code}）
                    </option>
                  ))}
                </select>
                {!isLoadingSources && activeDataSources.length === 0 ? (
                  <span className="mt-2 block text-sm text-amber-700">
                    请先到{" "}
                    <Link
                      className="font-semibold text-teal-700 transition hover:text-teal-800"
                      href="/admin/sources"
                    >
                      /admin/sources
                    </Link>{" "}
                    新增并启用数据源。
                  </span>
                ) : null}
              </label>

              <label className="mb-5 block">
                <span className="text-sm font-medium text-slate-700">
                  选择 {importMode === "json" ? "JSON" : "CSV"} 文件
                </span>
                <input
                  accept={importMode === "json" ? ".json,application/json" : ".csv,text/csv"}
                  className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
                  onChange={(event) => {
                    void handleFileChange(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
                {selectedFileName ? (
                  <span className="mt-2 block text-xs font-medium text-slate-500">
                    已选择：{selectedFileName}
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {importMode === "json" ? "JSON 职位数组" : "CSV 职位数据"}
                </span>
                <textarea
                  className="mt-2 min-h-[520px] w-full rounded-md border border-slate-300 bg-white px-3 py-3 font-mono text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                  onChange={(event) => {
                    if (importMode === "json") {
                      setJsonText(event.target.value);
                    } else {
                      setCsvText(event.target.value);
                    }

                    setErrorMessage("");
                    resetPreview();
                  }}
                  value={currentText}
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
                  disabled={
                    isSubmitting ||
                    isLoadingSources ||
                    activeDataSources.length === 0
                  }
                  type="submit"
                >
                  预览导入
                </button>
                <button
                  className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                  onClick={() => {
                    if (importMode === "json") {
                      setJsonText(exampleText);
                    } else {
                      setCsvText(csvExample);
                    }

                    setSelectedFileName("");
                    setErrorMessage("");
                    resetPreview();
                  }}
                  type="button"
                >
                  填入示例
                </button>
                {isPreviewReady ? (
                  <button
                    className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                    onClick={resetPreview}
                    type="button"
                  >
                    取消预览
                  </button>
                ) : null}
              </div>
            </form>
          </article>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <h2 className="text-xl font-bold text-slate-950">
                {importMode === "json" ? "JSON 示例" : "CSV 示例"}
              </h2>
              <pre className="mt-4 max-h-[360px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {importMode === "json" ? exampleText : csvExample}
              </pre>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <h2 className="text-xl font-bold text-slate-950">导入结果</h2>
              {result ? (
                <div className="mt-4 space-y-4">
                  <dl className="grid gap-3 text-sm">
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">总读取数量</dt>
                      <dd className="mt-1 font-bold text-slate-950">
                        {result.total}
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">成功导入</dt>
                      <dd className="mt-1 font-bold text-slate-950">
                        {result.imported}
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">跳过重复</dt>
                      <dd className="mt-1 font-bold text-slate-950">
                        {result.skippedDuplicates}
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">跳过无效</dt>
                      <dd className="mt-1 font-bold text-slate-950">
                        {result.skippedInvalid}
                      </dd>
                    </div>
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">错误数量</dt>
                      <dd className="mt-1 font-bold text-slate-950">
                        {result.errors}
                      </dd>
                    </div>
                  </dl>

                  {result.errorDetails.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        错误详情（最多显示前 10 条）
                      </h3>
                      <ul className="mt-2 space-y-2 text-sm text-red-600">
                        {result.errorDetails.map((error) => (
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

        {previewJobs.length > 0 ? (
          <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">导入预览</h2>
                <p className="mt-1 text-sm text-slate-500">
                  读取 {previewSummary.total} 条，预计可导入{" "}
                  {previewSummary.importable} 条，预计跳过重复{" "}
                  {previewSummary.skippedDuplicates} 条，预计跳过无效{" "}
                  {previewSummary.skippedInvalid} 条。下面展示前{" "}
                  {Math.min(previewSummary.total, 20)} 条。
                </p>
              </div>
              <button
                className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={handleConfirmImport}
                type="button"
              >
                {isSubmitting ? "正在导入..." : "确认导入"}
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">职位标题</th>
                    <th className="px-4 py-3 font-semibold">公司</th>
                    <th className="px-4 py-3 font-semibold">城市</th>
                    <th className="px-4 py-3 font-semibold">省份</th>
                    <th className="px-4 py-3 font-semibold">薪资</th>
                    <th className="px-4 py-3 font-semibold">来源</th>
                    <th className="px-4 py-3 font-semibold">预览状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {previewSummary.rows.slice(0, 20).map(({ index, job, status }) => (
                    <tr className="transition hover:bg-slate-50" key={index}>
                      <td className="max-w-xs px-4 py-3 font-semibold text-slate-950">
                        {getPreviewText(job, "title") || "未填写"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {getPreviewText(job, "company") || "未填写"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {getPreviewText(job, "city") || "未填写"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {getPreviewText(job, "province") || "未填写"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatPreviewSalary(job)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {getPreviewText(job, "source") || "manual-import"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
