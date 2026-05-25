"use client";

import { FormEvent, useState } from "react";
import { educationLevels } from "@/lib/providers/types";

export type UserProfileFormState = {
  targetTitle: string;
  targetCity: string;
  expectedSalaryMin: number | "";
  expectedSalaryMax: number | "";
  education: string;
  experienceYears: number | "";
  skills: string;
  selfIntroduction: string;
};

type UserProfileFormProps = {
  initialProfile: UserProfileFormState;
};

const inputClassName =
  "mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15";

const textareaClassName =
  "mt-2 min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15";

function toNumberOrEmpty(value: string): number | "" {
  if (value === "") {
    return "";
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : "";
}

export function UserProfileForm({ initialProfile }: UserProfileFormProps) {
  const [formState, setFormState] =
    useState<UserProfileFormState>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function updateForm<Field extends keyof UserProfileFormState>(
    field: Field,
    value: UserProfileFormState[Field],
  ) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (response.status === 401) {
        throw new Error("请先登录后保存资料");
      }

      if (!response.ok) {
        throw new Error(data.error || "保存资料失败");
      }

      setMessage("资料已保存，推荐职位和匹配度会使用最新偏好重新计算。");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存资料失败");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
      {message ? (
        <div className="rounded-md bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700 md:col-span-2">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 md:col-span-2">
          {errorMessage}
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">目标岗位</span>
        <input
          className={inputClassName}
          onChange={(event) => updateForm("targetTitle", event.target.value)}
          placeholder="例如 前端开发"
          type="text"
          value={formState.targetTitle}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">目标城市</span>
        <input
          className={inputClassName}
          onChange={(event) => updateForm("targetCity", event.target.value)}
          placeholder="例如 上海"
          type="text"
          value={formState.targetCity}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          期望最低薪资
        </span>
        <input
          className={inputClassName}
          min={0}
          onChange={(event) =>
            updateForm("expectedSalaryMin", toNumberOrEmpty(event.target.value))
          }
          placeholder="元/月"
          type="number"
          value={formState.expectedSalaryMin}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          期望最高薪资
        </span>
        <input
          className={inputClassName}
          min={0}
          onChange={(event) =>
            updateForm("expectedSalaryMax", toNumberOrEmpty(event.target.value))
          }
          placeholder="元/月"
          type="number"
          value={formState.expectedSalaryMax}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">学历</span>
        <select
          className={inputClassName}
          onChange={(event) => updateForm("education", event.target.value)}
          value={formState.education}
        >
          <option value="">暂不设置</option>
          {educationLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          工作经验年限
        </span>
        <input
          className={inputClassName}
          min={0}
          onChange={(event) =>
            updateForm("experienceYears", toNumberOrEmpty(event.target.value))
          }
          type="number"
          value={formState.experienceYears}
        />
      </label>

      <label className="block md:col-span-2">
        <span className="text-sm font-medium text-slate-700">技能关键词</span>
        <textarea
          className={textareaClassName}
          onChange={(event) => updateForm("skills", event.target.value)}
          placeholder="例如 React, Next.js, TypeScript, 数据分析"
          value={formState.skills}
        />
      </label>

      <label className="block md:col-span-2">
        <span className="text-sm font-medium text-slate-700">自我介绍</span>
        <textarea
          className={textareaClassName}
          onChange={(event) => updateForm("selfIntroduction", event.target.value)}
          placeholder="简要描述你的经验、优势和求职偏好"
          value={formState.selfIntroduction}
        />
      </label>

      <div className="md:col-span-2">
        <button
          className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "正在保存..." : "保存资料"}
        </button>
      </div>
    </form>
  );
}
