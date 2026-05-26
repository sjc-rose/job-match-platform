"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MaintenanceResult = {
  authEnv?: "error" | "ok";
  checks?: {
    abnormalJobs: number;
    cityEmpty: number;
    sourceEmpty: number;
  };
  counts?: {
    activeJobs: number;
    applications: number;
    expiredJobs: number;
    favorites: number;
    inactiveJobs: number;
    jobs: number;
    userProfiles: number;
  };
  database?: "error" | "ok";
  expiresAtMaintenance?: "skipped";
  message?: string;
  ok: boolean;
  timestamp: string;
};

const emptyResult: MaintenanceResult = {
  ok: false,
  timestamp: "",
};

function formatDateTime(value: string) {
  if (!value) {
    return "尚未检查";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function StatusBadge({ status }: { status?: "error" | "ok" }) {
  const isOk = status === "ok";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        isOk ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {isOk ? "正常" : "异常"}
    </span>
  );
}

export default function AdminMaintenancePage() {
  const [result, setResult] = useState<MaintenanceResult>(emptyResult);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadMaintenance(method: "GET" | "POST" = "GET") {
    if (method === "POST") {
      setIsRunning(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/maintenance", {
        method,
      });
      const data = (await response.json().catch(() => null)) as
        | MaintenanceResult
        | { error?: string }
        | null;

      if (!response.ok) {
        const message =
          data && "error" in data && data.error
            ? data.error
            : "维护检查失败";
        throw new Error(message);
      }

      setResult(data as MaintenanceResult);
    } catch (error) {
      setResult(emptyResult);
      setErrorMessage(
        error instanceof Error ? error.message : "维护检查失败，请稍后重试",
      );
    } finally {
      if (method === "POST") {
        setIsRunning(false);
      } else {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialMaintenance() {
      try {
        const response = await fetch("/api/admin/maintenance");
        const data = (await response.json().catch(() => null)) as
          | MaintenanceResult
          | { error?: string }
          | null;

        if (!response.ok) {
          const message =
            data && "error" in data && data.error
              ? data.error
              : "维护检查失败";
          throw new Error(message);
        }

        if (isActive) {
          setResult(data as MaintenanceResult);
        }
      } catch (error) {
        if (isActive) {
          setResult(emptyResult);
          setErrorMessage(
            error instanceof Error ? error.message : "维护检查失败，请稍后重试",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialMaintenance();

    return () => {
      isActive = false;
    };
  }, []);

  const countCards = [
    {
      label: "职位总数",
      value: result.counts?.jobs ?? 0,
    },
    {
      label: "active",
      value: result.counts?.activeJobs ?? 0,
    },
    {
      label: "inactive",
      value: result.counts?.inactiveJobs ?? 0,
    },
    {
      label: "expired",
      value: result.counts?.expiredJobs ?? 0,
    },
  ];
  const qualityCards = [
    {
      label: "source 为空",
      value: result.checks?.sourceEmpty ?? 0,
    },
    {
      label: "city 为空",
      value: result.checks?.cityEmpty ?? 0,
    },
    {
      label: "异常数据",
      value: result.checks?.abnormalJobs ?? 0,
    },
  ];

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
            系统维护
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            检查生产环境数据库连接、核心数据量和职位数据质量。
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">健康状态</h2>
              <p className="mt-2 text-sm text-slate-500">
                最近一次检查：{formatDateTime(result.timestamp)}
              </p>
            </div>
            <button
              className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || isRunning}
              onClick={() => void loadMaintenance("POST")}
              type="button"
            >
              {isRunning ? "正在检查..." : "立即执行维护检查"}
            </button>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm font-medium text-slate-500">数据库连接</p>
              <div className="mt-3">
                <StatusBadge status={result.database} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm font-medium text-slate-500">
                Auth 环境变量
              </p>
              <div className="mt-3">
                <StatusBadge status={result.authEnv} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {countCards.map((card) => (
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

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {qualityCards.map((card) => (
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

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">最近一次检查结果</h2>
          <pre className="mt-4 max-h-[420px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
