import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toApplicationStatus } from "@/lib/applicationStatus";

type ApplicationRecordWithJob = {
  id: string;
  jobId: string;
  status: string;
  note: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    company: string;
    city: string;
    province: string;
    source: string;
    status: string;
  };
};

function parseString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalDate(value: unknown) {
  const valueText = parseString(value);

  if (!valueText) {
    return null;
  }

  const date = new Date(valueText);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toApiApplication(record: ApplicationRecordWithJob) {
  return {
    id: record.id,
    jobId: record.jobId,
    status: toApplicationStatus(record.status),
    note: record.note ?? "",
    appliedAt: record.appliedAt?.toISOString() ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    job: record.job,
  };
}

export async function GET(request: Request) {
  try {
    const { response, user } = await requireCurrentUser();

    if (response) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId")?.trim() ?? "";

    const records = await prisma.applicationRecord.findMany({
      where: jobId
        ? {
            jobId,
            userId: user.id,
          }
        : {
            userId: user.id,
          },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            city: true,
            province: true,
            source: true,
            status: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      applications: records.map(toApiApplication),
    });
  } catch (error) {
    console.error("Failed to fetch application records", error);
    return NextResponse.json(
      { error: "Failed to fetch application records" },
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
    const jobId = parseString(body.jobId);
    const status = toApplicationStatus(body.status);
    const note = parseString(body.note);
    const appliedAt = parseOptionalDate(body.appliedAt);

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
      select: {
        id: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const record = await prisma.applicationRecord.upsert({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId,
        },
      },
      create: {
        jobId,
        userId: user.id,
        status,
        note: note || null,
        appliedAt,
      },
      update: {
        status,
        note: note || null,
        appliedAt,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            city: true,
            province: true,
            source: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      application: toApiApplication(record),
    });
  } catch (error) {
    console.error("Failed to save application record", error);
    return NextResponse.json(
      { error: "Failed to save application record" },
      { status: 500 },
    );
  }
}
