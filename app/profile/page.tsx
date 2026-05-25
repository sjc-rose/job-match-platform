import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import {
  UserProfileForm,
  type UserProfileFormState,
} from "@/components/UserProfileForm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const emptyProfile: UserProfileFormState = {
  targetTitle: "",
  targetCity: "",
  expectedSalaryMin: "",
  expectedSalaryMax: "",
  education: "",
  experienceYears: "",
  skills: "",
  selfIntroduction: "",
};

function toFormState(profile: {
  targetTitle: string | null;
  targetCity: string | null;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  education: string | null;
  experienceYears: number | null;
  skills: string | null;
  selfIntroduction: string | null;
}): UserProfileFormState {
  return {
    targetTitle: profile.targetTitle ?? "",
    targetCity: profile.targetCity ?? "",
    expectedSalaryMin: profile.expectedSalaryMin ?? "",
    expectedSalaryMax: profile.expectedSalaryMax ?? "",
    education: profile.education ?? "",
    experienceYears: profile.experienceYears ?? "",
    skills: profile.skills ?? "",
    selfIntroduction: profile.selfIntroduction ?? "",
  };
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <PublicNav />
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-950">
          <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
            <h1 className="text-3xl font-bold tracking-tight">
              登录后编辑我的资料
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              求职偏好会按你的账号保存，用于后续职位匹配和推荐。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex justify-center rounded-md bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
                href="/login"
              >
                登录
              </Link>
              <Link
                className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-950/10"
                href="/signup"
              >
                注册
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  const profile = await prisma.userProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <section className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              我的资料
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              维护你的求职偏好，后续可以用于职位匹配评分和推荐。
            </p>
          </section>

          <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <UserProfileForm
              initialProfile={profile ? toFormState(profile) : emptyProfile}
            />
          </section>
        </div>
      </main>
    </>
  );
}
