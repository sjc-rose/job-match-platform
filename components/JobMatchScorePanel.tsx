"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  calculateMatchScore,
  type MatchScoreProfile,
  type MatchScoreResult,
} from "@/lib/matchScore";
import type { Job } from "@/lib/providers/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type ProfileState = "loading" | "unauthenticated" | "missing" | "ready";

type JobMatchScorePanelProps = {
  job: Job;
  maxReasons?: number;
};

export function JobMatchScorePanel({
  job,
  maxReasons,
}: JobMatchScorePanelProps) {
  const [profileState, setProfileState] = useState<ProfileState>(() =>
    isSupabaseConfigured() ? "loading" : "unauthenticated",
  );
  const [matchScore, setMatchScore] = useState<MatchScoreResult>({
    score: null,
    reasons: ["完善求职偏好后查看匹配度"],
  });

  useEffect(() => {
    let isActive = true;

    async function loadProfileAndScore() {
      if (!isSupabaseConfigured()) {
        return;
      }

      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (isActive) {
            setProfileState("unauthenticated");
          }
          return;
        }

        const response = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.status === 401) {
          if (isActive) {
            setProfileState("unauthenticated");
          }
          return;
        }

        if (!response.ok) {
          throw new Error("求职偏好加载失败");
        }

        const data = (await response.json()) as {
          profile: MatchScoreProfile | null;
        };
        const nextMatchScore = calculateMatchScore(job, data.profile);

        if (isActive) {
          setMatchScore(nextMatchScore);
          setProfileState(
            data.profile && nextMatchScore.score !== null ? "ready" : "missing",
          );
        }
      } catch {
        if (isActive) {
          setProfileState("missing");
        }
      }
    }

    void loadProfileAndScore();

    return () => {
      isActive = false;
    };
  }, [job]);

  const visibleReasons = maxReasons
    ? matchScore.reasons.slice(0, maxReasons)
    : matchScore.reasons;

  return (
    <section className="mt-5 rounded-md border border-teal-100 bg-teal-50 px-4 py-4">
      <h2 className="text-xl font-bold text-slate-950">个性化匹配度</h2>
      {profileState === "loading" ? (
        <p className="mt-2 text-sm font-semibold text-teal-700">
          正在计算匹配度...
        </p>
      ) : profileState === "unauthenticated" ? (
        <p className="mt-2 text-sm font-semibold text-teal-700">
          登录后查看匹配度
        </p>
      ) : profileState === "missing" || matchScore.score === null ? (
        <p className="mt-2 text-sm font-semibold text-teal-700">
          完善求职偏好后查看匹配度{" "}
          <Link
            className="underline decoration-teal-500 underline-offset-4"
            href="/profile"
          >
            去完善资料
          </Link>
        </p>
      ) : (
        <>
          <p className="mt-2 text-3xl font-bold text-teal-800">
            匹配度 {matchScore.score}%
          </p>
          <div className="mt-3">
            <p className="text-sm font-semibold text-teal-900">推荐理由：</p>
            <ul className="mt-2 space-y-2 text-sm text-teal-800">
              {visibleReasons.map((reason) => (
                <li className="rounded-md bg-white/70 px-3 py-2" key={reason}>
                  - {reason}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
