import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Job as ProviderJob } from "@/lib/providers/types";

type SearchHistoryRecord = {
  id: string;
  visitorId: string | null;
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

type FavoriteRecord = {
  id: string;
  visitorId: string;
  jobId: string;
  createdAt: Date;
  job: {
    id: string;
    source: string;
    title: string;
    company: string;
    city: string;
    province: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryText: string | null;
    educationRequirement: string;
    experienceRequirement: number | null;
    description: string;
    applyUrl: string;
    publishedAt: Date | null;
  };
};

function toApiJob(job: FavoriteRecord["job"]): ProviderJob {
  return {
    id: job.id,
    source: job.source,
    title: job.title,
    company: job.company,
    city: job.city,
    province: job.province,
    salaryMin: job.salaryMin ?? 0,
    salaryMax: job.salaryMax ?? 0,
    salaryText: job.salaryText ?? "",
    educationRequirement: job.educationRequirement as ProviderJob["educationRequirement"],
    experienceRequirement: job.experienceRequirement ?? 0,
    description: job.description,
    applyUrl: job.applyUrl,
    publishedAt: job.publishedAt?.toISOString() ?? "",
  };
}

function toApiSearchHistory(history: SearchHistoryRecord) {
  return {
    id: history.id,
    visitorId: history.visitorId ?? "",
    educationLevel: history.educationLevel ?? "不限",
    expectedSalaryMin: history.expectedSalaryMin ?? 0,
    expectedSalaryMax: history.expectedSalaryMax ?? 0,
    city: history.city ?? "",
    keywords: history.keywords ?? "",
    experienceYears: history.experienceYears ?? 0,
    source: history.source ?? "",
    resultCount: history.resultCount,
    createdAt: history.createdAt.toISOString(),
  };
}

function toApiFavorite(favorite: FavoriteRecord) {
  return {
    id: favorite.id,
    visitorId: favorite.visitorId,
    jobId: favorite.jobId,
    createdAt: favorite.createdAt.toISOString(),
    job: toApiJob(favorite.job),
  };
}

export async function GET() {
  try {
    const [
      jobCount,
      favoriteCount,
      searchHistoryCount,
      recentSearchHistories,
      recentFavorites,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.favoriteJob.count(),
      prisma.searchHistory.count(),
      prisma.searchHistory.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
      prisma.favoriteJob.findMany({
        include: {
          job: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      stats: {
        jobCount,
        favoriteCount,
        searchHistoryCount,
      },
      recentSearchHistories: recentSearchHistories.map(toApiSearchHistory),
      recentFavorites: recentFavorites.map(toApiFavorite),
    });
  } catch (error) {
    console.error("Failed to fetch admin stats", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 },
    );
  }
}
