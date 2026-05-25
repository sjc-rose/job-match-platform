import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const jobStatuses = ["active", "inactive", "expired"] as const;

type JobStatus = (typeof jobStatuses)[number];

type JobRecord = {
  id: string;
  source: string;
  sourceJobId: string | null;
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
  createdAt: Date;
  updatedAt: Date;
};

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

function parseNonNegativeInteger(value: unknown, fallback = 0) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return parsedValue;
}

function parseString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toJobStatus(value: unknown): JobStatus {
  return jobStatuses.includes(value as JobStatus)
    ? (value as JobStatus)
    : "active";
}

function toApiJob(job: JobRecord) {
  return {
    id: job.id,
    source: job.source,
    sourceJobId: job.sourceJobId,
    title: job.title,
    company: job.company,
    city: job.city,
    province: job.province,
    status: job.status,
    salaryMin: job.salaryMin ?? 0,
    salaryMax: job.salaryMax ?? 0,
    salaryText: job.salaryText ?? "",
    educationRequirement: job.educationRequirement,
    experienceRequirement: job.experienceRequirement ?? 0,
    description: job.description,
    applyUrl: job.applyUrl,
    publishedAt: job.publishedAt?.toISOString() ?? "",
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

function createWhere(
  keyword: string,
  city: string,
  company: string,
  source: string,
  status: string,
): Prisma.JobWhereInput {
  const conditions: Prisma.JobWhereInput[] = [];

  if (keyword) {
    conditions.push({
      OR: [
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
      ],
    });
  }

  if (city) {
    conditions.push({
      city: {
        contains: city,
        mode: "insensitive",
      },
    });
  }

  if (company) {
    conditions.push({
      company: {
        contains: company,
        mode: "insensitive",
      },
    });
  }

  if (source) {
    conditions.push({
      source,
    });
  }

  if (status) {
    conditions.push({
      status,
    });
  }

  return conditions.length > 0
    ? {
        AND: conditions,
      }
    : {};
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim() ?? "";
    const city = searchParams.get("city")?.trim() ?? "";
    const company = searchParams.get("company")?.trim() ?? "";
    const source = searchParams.get("source")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const page = parsePositiveInteger(searchParams.get("page"), DEFAULT_PAGE);
    const requestedPageSize = parsePositiveInteger(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE,
    );
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    const where = createWhere(keyword, city, company, source, status);

    const [total, jobs, sourceRows] = await Promise.all([
      prisma.job.count({
        where,
      }),
      prisma.job.findMany({
        where,
        orderBy: [
          {
            publishedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.job.findMany({
        distinct: ["source"],
        orderBy: {
          source: "asc",
        },
        select: {
          source: true,
        },
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      jobs: jobs.map(toApiJob),
      sources: sourceRows.map((row) => row.source),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Failed to fetch admin jobs", error);
    return NextResponse.json(
      { error: "Failed to fetch admin jobs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = parseString(body.title);
    const company = parseString(body.company);
    const city = parseString(body.city);
    const province = parseString(body.province);
    const salaryMin = parseNonNegativeInteger(body.salaryMin);
    const salaryMax = parseNonNegativeInteger(body.salaryMax);
    const salaryText = parseString(body.salaryText);
    const educationRequirement = parseString(body.educationRequirement);
    const experienceRequirement = parseNonNegativeInteger(body.experienceRequirement);
    const description = parseString(body.description);
    const applyUrl = parseString(body.applyUrl);
    const source = parseString(body.source) || "manual";
    const status = toJobStatus(body.status);

    if (
      !title ||
      !company ||
      !city ||
      !province ||
      !educationRequirement ||
      !description ||
      !applyUrl
    ) {
      return NextResponse.json(
        { error: "Missing required job fields" },
        { status: 400 },
      );
    }

    const job = await prisma.job.create({
      data: {
        source,
        status,
        title,
        company,
        city,
        province,
        salaryMin,
        salaryMax,
        salaryText,
        educationRequirement,
        experienceRequirement,
        description,
        applyUrl,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        job: toApiJob(job),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create admin job", error);
    return NextResponse.json(
      { error: "Failed to create admin job" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const jobIds = Array.isArray(body.jobIds)
      ? body.jobIds.filter((jobId): jobId is string => typeof jobId === "string")
      : [];
    const uniqueJobIds = [...new Set(jobIds.map((jobId) => jobId.trim()))].filter(
      Boolean,
    );

    if (uniqueJobIds.length === 0) {
      return NextResponse.json(
        { error: "jobIds must include at least one job id" },
        { status: 400 },
      );
    }

    const result = await prisma.job.deleteMany({
      where: {
        id: {
          in: uniqueJobIds,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Failed to bulk delete admin jobs", error);
    return NextResponse.json(
      { error: "Failed to bulk delete admin jobs" },
      { status: 500 },
    );
  }
}
