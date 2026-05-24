import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type JobRecord = {
  id: string;
  source: string;
  sourceJobId: string | null;
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

function toApiJob(job: JobRecord) {
  return {
    id: job.id,
    source: job.source,
    sourceJobId: job.sourceJobId,
    title: job.title,
    company: job.company,
    city: job.city,
    province: job.province,
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

function createWhere(keyword: string, city: string): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = {};

  if (keyword) {
    where.OR = [
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
    ];
  }

  if (city) {
    where.city = {
      contains: city,
      mode: "insensitive",
    };
  }

  return where;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim() ?? "";
    const city = searchParams.get("city")?.trim() ?? "";
    const page = parsePositiveInteger(searchParams.get("page"), DEFAULT_PAGE);
    const requestedPageSize = parsePositiveInteger(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE,
    );
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    const where = createWhere(keyword, city);

    const [total, jobs] = await Promise.all([
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
    ]);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      jobs: jobs.map(toApiJob),
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
