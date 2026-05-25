import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type AdminJobRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

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

function isNotFoundError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export async function GET(_request: Request, { params }: AdminJobRouteProps) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Job id is required" }, { status: 400 });
  }

  try {
    const job = await prisma.job.findUnique({
      where: {
        id,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      job: toApiJob(job),
    });
  } catch (error) {
    console.error("Failed to fetch admin job", error);
    return NextResponse.json(
      { error: "Failed to fetch admin job" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: AdminJobRouteProps) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Job id is required" }, { status: 400 });
  }

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
      !applyUrl ||
      !source
    ) {
      return NextResponse.json(
        { error: "Missing required job fields" },
        { status: 400 },
      );
    }

    const job = await prisma.job.update({
      where: {
        id,
      },
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
      },
    });

    return NextResponse.json({
      job: toApiJob(job),
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    console.error("Failed to update admin job", error);
    return NextResponse.json(
      { error: "Failed to update admin job" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: AdminJobRouteProps) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Job id is required" }, { status: 400 });
  }

  try {
    await prisma.job.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
      id,
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    console.error("Failed to delete admin job", error);
    return NextResponse.json(
      { error: "Failed to delete admin job" },
      { status: 500 },
    );
  }
}
