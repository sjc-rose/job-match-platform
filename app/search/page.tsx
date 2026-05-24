"use client";

import { FormEvent, useState } from "react";
import { calculateJobMatches, type JobMatch, type UserProfile } from "@/lib/matching";
import { educationLevels } from "@/lib/mockJobs";
import { mockJobs } from "@/lib/mockJobs";

const initialProfile: UserProfile = {
  educationLevel: "本科",
  expectedSalaryMin: 15000,
  expectedSalaryMax: 25000,
  city: "上海",
  keywords: "前端 React",
  experienceYears: 2,
};

function formatSalary(min: number, max: number) {
  return `${Math.round(min / 1000)}k-${Math.round(max / 1000)}k`;
}

export default function SearchPage() {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  function updateProfile<Field extends keyof UserProfile>(
    field: Field,
    value: UserProfile[Field],
  ) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const results = calculateJobMatches(profile, mockJobs).filter(
      (result) => result.matchScore > 0,
    );

    setMatches(results);
    setHasSearched(true);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            填写求职条件
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            输入你的求职偏好，系统会根据关键词、城市、薪资、学历和经验进行职位匹配。
          </p>
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
                期望最低薪资
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
                期望最高薪资
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
                type="submit"
              >
                开始匹配职位
              </button>
            </div>
          </form>
        </section>

        {hasSearched ? (
          <section className="mt-10">
            {matches.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {matches.map(({ job, matchScore, matchReasons }) => (
                  <article
                    className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60"
                    key={job.id}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-950">
                          {job.title}
                        </h2>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                          {job.company}
                        </p>
                      </div>
                      <div className="rounded-md bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700">
                        匹配分数 {matchScore}
                      </div>
                    </div>

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
                          {formatSalary(job.salaryMin, job.salaryMax)}
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
                          {job.experienceRequirement} 年以上
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

                    <a
                      className="mt-6 inline-flex rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-950/20"
                      href={job.applyUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      申请链接
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-lg shadow-slate-200/60">
                暂无匹配职位
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
