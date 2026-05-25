"use client";

import { useEffect, useState } from "react";
import {
  applicationStatuses,
  applicationStatusLabels,
  toApplicationStatus,
  type ApplicationStatus,
} from "@/lib/applicationStatus";

type ApplicationRecord = {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  note: string;
  appliedAt: string;
  updatedAt: string;
};

type ApplicationTrackerProps = {
  disabled?: boolean;
  disabledMessage?: string;
  jobId: string;
};

function toDateInputValue(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDateTime(value: string) {
  if (!value) {
    return "尚未保存";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "尚未保存";
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ApplicationTracker({
  disabled = false,
  disabledMessage = "当前职位暂不支持申请状态管理。",
  jobId,
}: ApplicationTrackerProps) {
  const [status, setStatus] = useState<ApplicationStatus>("not_applied");
  const [note, setNote] = useState("");
  const [appliedAt, setAppliedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (disabled) {
      return;
    }

    let isActive = true;

    async function loadApplication() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `/api/applications?jobId=${encodeURIComponent(jobId)}`,
        );

        if (!response.ok) {
          throw new Error("申请状态加载失败");
        }

        const data = (await response.json()) as {
          applications: ApplicationRecord[];
        };
        const application = data.applications[0];

        if (isActive && application) {
          setStatus(toApplicationStatus(application.status));
          setNote(application.note);
          setAppliedAt(toDateInputValue(application.appliedAt));
          setUpdatedAt(application.updatedAt);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : "申请状态加载失败",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadApplication();

    return () => {
      isActive = false;
    };
  }, [disabled, jobId]);

  async function handleSave() {
    if (disabled) {
      return;
    }

    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/applications/${encodeURIComponent(jobId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          note,
          appliedAt,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        application?: ApplicationRecord;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "申请状态保存失败");
      }

      if (data.application) {
        setStatus(toApplicationStatus(data.application.status));
        setNote(data.application.note);
        setAppliedAt(toDateInputValue(data.application.appliedAt));
        setUpdatedAt(data.application.updatedAt);
      }

      setMessage("申请状态已保存");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "申请状态保存失败",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">申请状态</h2>
          <p className="mt-1 text-sm text-slate-500">
            当前状态：{applicationStatusLabels[status]} · 最近更新：
            {formatDateTime(updatedAt)}
          </p>
        </div>
      </div>

      {disabled ? (
        <div className="mt-5 rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {disabledMessage}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">状态</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
              disabled={isLoading || isSaving}
              onChange={(event) =>
                setStatus(toApplicationStatus(event.target.value))
              }
              value={status}
            >
              {applicationStatuses.map((applicationStatus) => (
                <option key={applicationStatus} value={applicationStatus}>
                  {applicationStatusLabels[applicationStatus]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">申请日期</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
              disabled={isLoading || isSaving}
              onChange={(event) => setAppliedAt(event.target.value)}
              type="date"
              value={appliedAt}
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-slate-700">备注</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
              disabled={isLoading || isSaving}
              onChange={(event) => setNote(event.target.value)}
              placeholder="记录投递渠道、面试时间、联系人等信息"
              value={note}
            />
          </label>

          <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
            <button
              className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || isSaving}
              onClick={handleSave}
              type="button"
            >
              {isSaving ? "正在保存..." : "保存申请状态"}
            </button>
            {message ? (
              <span className="text-sm font-semibold text-teal-700">{message}</span>
            ) : null}
            {errorMessage ? (
              <span className="text-sm font-semibold text-red-600">
                {errorMessage}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
