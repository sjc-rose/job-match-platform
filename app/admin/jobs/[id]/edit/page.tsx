"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { educationLevels } from "@/lib/providers/types";

type JobFormState = {
  title: string;
  company: string;
  city: string;
  province: string;
  salaryMin: number;
  salaryMax: number;
  salaryText: string;
  educationRequirement: string;
  experienceRequirement: number;
  description: string;
  applyUrl: string;
  source: string;
};

type AdminJobResponse = {
  job: JobFormState & {
    id: string;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
  };
};

const initialFormState: JobFormState = {
  title: "",
  company: "",
  city: "",
  province: "",
  salaryMin: 0,
  salaryMax: 0,
  salaryText: "",
  educationRequirement: "本科",
  experienceRequirement: 0,
  description: "",
  applyUrl: "",
  source: "manual",
};

const inputClassName =
  "mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15";

const textareaClassName =
  "mt-2 min-h-36 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function toFormState(data: AdminJobResponse): JobFormState {
  return {
    title: data.job.title,
    company: data.job.company,
    city: data.job.city,
    province: data.job.province,
    salaryMin: data.job.salaryMin,
    salaryMax: data.job.salaryMax,
    salaryText: data.job.salaryText,
    educationRequirement: data.job.educationRequirement,
    experienceRequirement: data.job.experienceRequirement,
    description: data.job.description,
    applyUrl: data.job.applyUrl,
    source: data.job.source,
  };
}

export default function EditAdminJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = getParamValue(params.id);
  const [formState, setFormState] = useState<JobFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadJob() {
      if (!jobId) {
        setErrorMessage("职位 ID 不存在");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `/api/admin/jobs/${encodeURIComponent(jobId)}`,
        );

        if (!response.ok) {
          throw new Error("职位详情加载失败");
        }

        const data = (await response.json()) as AdminJobResponse;

        if (isActive) {
          setFormState(toFormState(data));
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : "职位详情加载失败",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadJob();

    return () => {
      isActive = false;
    };
  }, [jobId]);

  function updateForm<Field extends keyof JobFormState>(
    field: Field,
    value: JobFormState[Field],
  ) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!jobId) {
      setErrorMessage("职位 ID 不存在");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/jobs/${encodeURIComponent(jobId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formState),
        },
      );

      if (!response.ok) {
        throw new Error("保存职位失败，请检查表单后重试");
      }

      router.push("/admin/jobs");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "保存职位失败，请稍后重试",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <section className="text-center">
          <Link
            className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            href="/admin/jobs"
          >
            返回职位管理
          </Link>
          <p className="mx-auto mt-5 inline-flex rounded-md bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            仅开发测试使用
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            编辑职位
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            修改职位信息并保存到数据库 jobs 表。
          </p>
        </section>

        <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          {errorMessage ? (
            <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-md bg-slate-50 px-4 py-5 text-sm text-slate-500">
              正在加载职位详情...
            </div>
          ) : (
            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  职位标题
                </span>
                <input
                  className={inputClassName}
                  onChange={(event) => updateForm("title", event.target.value)}
                  required
                  type="text"
                  value={formState.title}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">公司</span>
                <input
                  className={inputClassName}
                  onChange={(event) => updateForm("company", event.target.value)}
                  required
                  type="text"
                  value={formState.company}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">城市</span>
                <input
                  className={inputClassName}
                  onChange={(event) => updateForm("city", event.target.value)}
                  required
                  type="text"
                  value={formState.city}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">省份</span>
                <input
                  className={inputClassName}
                  onChange={(event) => updateForm("province", event.target.value)}
                  required
                  type="text"
                  value={formState.province}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  薪资下限
                </span>
                <input
                  className={inputClassName}
                  min={0}
                  onChange={(event) =>
                    updateForm("salaryMin", Number(event.target.value))
                  }
                  required
                  type="number"
                  value={formState.salaryMin}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  薪资上限
                </span>
                <input
                  className={inputClassName}
                  min={0}
                  onChange={(event) =>
                    updateForm("salaryMax", Number(event.target.value))
                  }
                  required
                  type="number"
                  value={formState.salaryMax}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  薪资文本
                </span>
                <input
                  className={inputClassName}
                  onChange={(event) => updateForm("salaryText", event.target.value)}
                  placeholder="例如 15k-25k 元/月"
                  type="text"
                  value={formState.salaryText}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  学历要求
                </span>
                <select
                  className={inputClassName}
                  onChange={(event) =>
                    updateForm("educationRequirement", event.target.value)
                  }
                  value={formState.educationRequirement}
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
                  经验要求
                </span>
                <input
                  className={inputClassName}
                  min={0}
                  onChange={(event) =>
                    updateForm("experienceRequirement", Number(event.target.value))
                  }
                  required
                  type="number"
                  value={formState.experienceRequirement}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">来源</span>
                <input
                  className={inputClassName}
                  onChange={(event) => updateForm("source", event.target.value)}
                  required
                  type="text"
                  value={formState.source}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  职位描述
                </span>
                <textarea
                  className={textareaClassName}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  required
                  value={formState.description}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  申请链接
                </span>
                <input
                  className={inputClassName}
                  onChange={(event) => updateForm("applyUrl", event.target.value)}
                  required
                  type="url"
                  value={formState.applyUrl}
                />
              </label>

              <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
                <button
                  className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "正在保存..." : "保存修改"}
                </button>
                <Link
                  className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                  href="/admin/jobs"
                >
                  取消
                </Link>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
