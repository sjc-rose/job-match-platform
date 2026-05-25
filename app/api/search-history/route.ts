import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EducationLevel, SearchJobsParams } from "@/lib/providers/types";
import { educationLevels } from "@/lib/providers/types";

const DEFAULT_SOURCE = "china-mock";

type SearchHistoryRecord = {
  id: string;
  educationLevel: string | null;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  city: string | null;
  keywords: string | null;
  experienceYears: number | null;
  source: string | null;
  resultCount: number;
  createdAt: Date;
};

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
    city: typeof body.city === "string" ? body.city.trim() : "",
    keywords: typeof body.keywords === "string" ? body.keywords.trim() : "",
    experienceYears: toNumber(body.experienceYears),
  };
}

function toApiHistory(history: SearchHistoryRecord) {
  return {
    id: history.id,
    educationLevel: toEducationLevel(history.educationLevel),
    expectedSalaryMin: history.expectedSalaryMin ?? 0,
    expectedSalaryMax: history.expectedSalaryMax ?? 0,
    city: history.city ?? "",
    keywords: history.keywords ?? "",
    experienceYears: history.experienceYears ?? 0,
    source: history.source ?? DEFAULT_SOURCE,
    resultCount: history.resultCount,
    createdAt: history.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const { response, user } = await requireCurrentUser();

    if (response) {
      return response;
    }

    const histories = await prisma.searchHistory.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      histories: histories.map(toApiHistory),
    });
  } catch (error) {
    console.error("Failed to fetch search history", error);
    return NextResponse.json(
      { error: "Failed to fetch search history" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { response, user } = await requireCurrentUser();

    if (response) {
      return response;
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const searchParams = parseSearchParams(body);
    const source = typeof body.source === "string" ? body.source : DEFAULT_SOURCE;
    const resultCount = toNumber(body.resultCount);

    const history = await prisma.searchHistory.create({
      data: {
        visitorId: user.id,
        userId: user.id,
        educationLevel: searchParams.educationLevel,
        expectedSalaryMin: searchParams.expectedSalaryMin,
        expectedSalaryMax: searchParams.expectedSalaryMax,
        city: searchParams.city,
        keywords: searchParams.keywords,
        experienceYears: searchParams.experienceYears,
        source,
        resultCount,
      },
    });

    return NextResponse.json({
      history: toApiHistory(history),
    });
  } catch (error) {
    console.error("Failed to save search history", error);
    return NextResponse.json(
      { error: "Failed to save search history" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const { response, user } = await requireCurrentUser();

    if (response) {
      return response;
    }

    await prisma.searchHistory.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Failed to clear search history", error);
    return NextResponse.json(
      { error: "Failed to clear search history" },
      { status: 500 },
    );
  }
}
