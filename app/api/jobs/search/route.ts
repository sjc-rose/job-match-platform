import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { calculateJobMatches } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { chinaMockProvider } from "@/lib/providers/chinaMockProvider";
import type { EducationLevel, Job, SearchJobsParams } from "@/lib/providers/types";
import { educationLevels } from "@/lib/providers/types";

type DatabaseJob = {
  id: string;
  source: string;
  title: string;
  company: string;
  city: string;
  province: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryText: string | null;
  educationRequirement: string;
  experienceRequirement: number | null;
  description: string;
  applyUrl: string;
  publishedAt: Date | null;
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
    city: typeof body.city === "string" ? body.city : "",
    keywords: typeof body.keywords === "string" ? body.keywords : "",
    experienceYears: toNumber(body.experienceYears),
  };
}

function splitKeywords(keywords: string) {
  return keywords
    .split(/[\s,，、]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function createKeywordWhere(keywords: string): Prisma.JobWhereInput | null {
  const keywordParts = splitKeywords(keywords);

  if (keywordParts.length === 0) {
    return null;
  }

  return {
    OR: keywordParts.flatMap((keyword) => [
      {
        title: {
          contains: keyword,
          mode: "insensitive",
        },
      },
      {
        company: {
          contains: keyword,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: keyword,
          mode: "insensitive",
        },
      },
    ]),
  };
}

function createEducationWhere(
  educationLevel: EducationLevel,
): Prisma.JobWhereInput | null {
  if (educationLevel === "不限") {
    return null;
  }

  const userEducationRank = educationLevels.indexOf(educationLevel);
  const allowedEducationLevels = educationLevels.slice(0, userEducationRank + 1);

  return {
    educationRequirement: {
      in: [...allowedEducationLevels],
    },
  };
}

function createSalaryWhere(params: SearchJobsParams): Prisma.JobWhereInput | null {
  if (params.expectedSalaryMin === 0 && params.expectedSalaryMax === 0) {
    return null;
  }

  const expectedMin = Math.min(
    params.expectedSalaryMin,
    params.expectedSalaryMax,
  );
  const expectedMax = Math.max(
    params.expectedSalaryMin,
    params.expectedSalaryMax,
  );

  return {
    OR: [
      {
        salaryMin: null,
      },
      {
        salaryMax: null,
      },
      {
        AND: [
          {
            salaryMin: {
              lte: expectedMax,
            },
          },
          {
            salaryMax: {
              gte: expectedMin,
            },
          },
        ],
      },
      {
        salaryMin: {
          gt: expectedMax,
        },
      },
    ],
  };
}

function createExperienceWhere(
  experienceYears: number,
): Prisma.JobWhereInput | null {
  if (experienceYears < 0) {
    return null;
  }

  return {
    OR: [
      {
        experienceRequirement: null,
      },
      {
        experienceRequirement: {
          lte: experienceYears + 1,
        },
      },
    ],
  };
}

function createDatabaseWhere(params: SearchJobsParams): Prisma.JobWhereInput {
  const andConditions: Prisma.JobWhereInput[] = [
    {
      status: "active",
    },
  ];
  const keywordWhere = createKeywordWhere(params.keywords);
  const educationWhere = createEducationWhere(params.educationLevel);
  const salaryWhere = createSalaryWhere(params);
  const experienceWhere = createExperienceWhere(params.experienceYears);
  const city = params.city.trim();

  if (keywordWhere) {
    andConditions.push(keywordWhere);
  }

  if (city) {
    andConditions.push({
      city: {
        contains: city,
        mode: "insensitive",
      },
    });
  }

  if (educationWhere) {
    andConditions.push(educationWhere);
  }

  if (salaryWhere) {
    andConditions.push(salaryWhere);
  }

  if (experienceWhere) {
    andConditions.push(experienceWhere);
  }

  return {
    AND: andConditions,
  };
}

function toApiJob(job: DatabaseJob): Job {
  return {
    id: job.id,
    source: job.source,
    title: job.title,
    company: job.company,
    city: job.city,
    province: job.province,
    status: job.status,
    salaryMin: job.salaryMin ?? 0,
    salaryMax: job.salaryMax ?? 0,
    salaryText: job.salaryText ?? "",
    educationRequirement: toEducationLevel(job.educationRequirement),
    experienceRequirement: job.experienceRequirement ?? 0,
    description: job.description,
    applyUrl: job.applyUrl,
    publishedAt: job.publishedAt?.toISOString() ?? "",
  };
}

async function searchDatabaseJobs(params: SearchJobsParams) {
  const jobs = await prisma.job.findMany({
    where: createDatabaseWhere(params),
    orderBy: [
      {
        publishedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 100,
  });

  return jobs.map(toApiJob);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const searchParams = parseSearchParams(body);
  const databaseJobs = await searchDatabaseJobs(searchParams);
  const databaseMatches = calculateJobMatches(searchParams, databaseJobs).filter(
    (match) => match.matchScore > 0,
  );

  if (databaseMatches.length > 0) {
    return NextResponse.json({
      source: "database",
      jobs: databaseMatches,
    });
  }

  const mockJobs = await chinaMockProvider.searchJobs(searchParams);
  const mockMatches = calculateJobMatches(searchParams, mockJobs).filter(
    (match) => match.matchScore > 0,
  );

  return NextResponse.json({
    source: chinaMockProvider.source,
    jobs: mockMatches,
  });
}
