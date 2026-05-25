import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toApplicationStatus } from "@/lib/applicationStatus";

type ApplicationRouteProps = {
  params: Promise<{
    jobId: string;
  }>;
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

function toApiApplication(record: {
  id: string;
  jobId: string;
  status: string;
  note: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    jobId: record.jobId,
    status: toApplicationStatus(record.status),
    note: record.note ?? "",
    appliedAt: record.appliedAt?.toISOString() ?? "",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function PATCH(request: Request, { params }: ApplicationRouteProps) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  try {
    const { response, user } = await requireCurrentUser();

    if (response) {
      return response;
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const status = toApplicationStatus(body.status);
    const note = parseString(body.note);
    const appliedAt = parseOptionalDate(body.appliedAt);

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
    });

    return NextResponse.json({
      application: toApiApplication(record),
    });
  } catch (error) {
    console.error("Failed to update application record", error);
    return NextResponse.json(
      { error: "Failed to update application record" },
      { status: 500 },
    );
  }
}
