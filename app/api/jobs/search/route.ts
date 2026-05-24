import { NextResponse } from "next/server";
import { calculateJobMatches } from "@/lib/matching";
import { chinaMockProvider } from "@/lib/providers/chinaMockProvider";
import type { EducationLevel, SearchJobsParams } from "@/lib/providers/types";
import { educationLevels } from "@/lib/providers/types";

function toNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function toEducationLevel(value: unknown): EducationLevel {
  return educationLevels.includes(value as EducationLevel)
    ? (value as EducationLevel)
    : "不限";
}

function parseSearchParams(body: Record<string, unknown>): SearchJobsParams {
  return {
    educationLevel: toEducationLevel(body.educationLevel),
    expectedSalaryMin: toNumber(body.expectedSalaryMin),
    expectedSalaryMax: toNumber(body.expectedSalaryMax),
    city: typeof body.city === "string" ? body.city : "",
    keywords: typeof body.keywords === "string" ? body.keywords : "",
    experienceYears: toNumber(body.experienceYears),
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const searchParams = parseSearchParams(body);
  const jobs = await chinaMockProvider.searchJobs(searchParams);
  const matches = calculateJobMatches(searchParams, jobs).filter(
    (match) => match.matchScore > 0,
  );

  return NextResponse.json({
    source: chinaMockProvider.source,
    jobs: matches,
  });
}
