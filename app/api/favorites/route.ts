import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chinaMockJobs } from "@/lib/providers/chinaMockProvider";
import type { Job as ProviderJob } from "@/lib/providers/types";

function toApiJob(job: {
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
}): ProviderJob {
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

function findMockJob(jobId: string) {
  return chinaMockJobs.find((job) => job.id === jobId);
}

async function upsertJobFromMock(jobId: string) {
  const mockJob = findMockJob(jobId);

  if (!mockJob) {
    return null;
  }

  return prisma.job.upsert({
    where: {
      id: mockJob.id,
    },
    create: {
      id: mockJob.id,
      source: mockJob.source,
      sourceJobId: mockJob.id,
      title: mockJob.title,
      company: mockJob.company,
      city: mockJob.city,
      province: mockJob.province,
      salaryMin: mockJob.salaryMin,
      salaryMax: mockJob.salaryMax,
      salaryText: mockJob.salaryText,
      educationRequirement: mockJob.educationRequirement,
      experienceRequirement: mockJob.experienceRequirement,
      description: mockJob.description,
      applyUrl: mockJob.applyUrl,
      publishedAt: new Date(mockJob.publishedAt),
    },
    update: {
      source: mockJob.source,
      sourceJobId: mockJob.id,
      title: mockJob.title,
      company: mockJob.company,
      city: mockJob.city,
      province: mockJob.province,
      salaryMin: mockJob.salaryMin,
      salaryMax: mockJob.salaryMax,
      salaryText: mockJob.salaryText,
      educationRequirement: mockJob.educationRequirement,
      experienceRequirement: mockJob.experienceRequirement,
      description: mockJob.description,
      applyUrl: mockJob.applyUrl,
      publishedAt: new Date(mockJob.publishedAt),
    },
  });
}

async function ensureJobExists(jobId: string) {
  const existingJob = await prisma.job.findUnique({
    where: {
      id: jobId,
    },
  });

  if (existingJob) {
    return existingJob;
  }

  return upsertJobFromMock(jobId);
}

async function parseJobId(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return typeof body.jobId === "string" ? body.jobId : "";
}

export async function GET() {
  try {
    const { response, user } = await requireCurrentUser();

    if (response) {
      return response;
    }

    const favorites = await prisma.favoriteJob.findMany({
      where: {
        userId: user.id,
      },
      include: {
        job: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      source: "database",
      jobIds: favorites.map((favorite) => favorite.jobId),
      jobs: favorites.map((favorite) => toApiJob(favorite.job)),
    });
  } catch (error) {
    console.error("Failed to fetch favorite jobs", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite jobs" },
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

    const jobId = await parseJobId(request);

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await ensureJobExists(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.favoriteJob.upsert({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId,
        },
      },
      create: {
        visitorId: user.id,
        userId: user.id,
        jobId,
      },
      update: {},
    });

    return NextResponse.json({
      source: "database",
      jobId,
      isFavorite: true,
    });
  } catch (error) {
    console.error("Failed to save favorite job", error);
    return NextResponse.json(
      { error: "Failed to save favorite job" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { response, user } = await requireCurrentUser();

    if (response) {
      return response;
    }

    const jobId = await parseJobId(request);

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    await prisma.favoriteJob.deleteMany({
      where: {
        userId: user.id,
        jobId,
      },
    });

    return NextResponse.json({
      source: "database",
      jobId,
      isFavorite: false,
    });
  } catch (error) {
    console.error("Failed to delete favorite job", error);
    return NextResponse.json(
      { error: "Failed to delete favorite job" },
      { status: 500 },
    );
  }
}
