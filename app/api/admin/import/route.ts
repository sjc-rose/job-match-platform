import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_SOURCE = "manual-import";

type ImportJobInput = {
  title?: unknown;
  company?: unknown;
  city?: unknown;
  province?: unknown;
  salaryMin?: unknown;
  salaryMax?: unknown;
  salaryText?: unknown;
  educationRequirement?: unknown;
  experienceRequirement?: unknown;
  description?: unknown;
  applyUrl?: unknown;
  source?: unknown;
  sourceJobId?: unknown;
  publishedAt?: unknown;
};

type ImportError = {
  index: number;
  message: string;
};

function parseString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalNonNegativeInteger(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

function parsePublishedAt(value: unknown) {
  const valueText = parseString(value);

  if (!valueText) {
    return null;
  }

  const date = new Date(valueText);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseJobsPayload(body: unknown) {
  if (Array.isArray(body)) {
    return body;
  }

  if (
    body &&
    typeof body === "object" &&
    "jobs" in body &&
    Array.isArray((body as { jobs: unknown }).jobs)
  ) {
    return (body as { jobs: unknown[] }).jobs;
  }

  return null;
}

function normalizeJob(input: ImportJobInput) {
  const title = parseString(input.title);
  const company = parseString(input.company);
  const city = parseString(input.city);
  const province = parseString(input.province);
  const educationRequirement = parseString(input.educationRequirement);
  const description = parseString(input.description);
  const applyUrl = parseString(input.applyUrl);
  const source = parseString(input.source) || DEFAULT_SOURCE;
  const sourceJobId = parseString(input.sourceJobId) || null;

  if (
    !title ||
    !company ||
    !city ||
    !province ||
    !educationRequirement ||
    !description ||
    !applyUrl
  ) {
    throw new Error("缺少必填字段");
  }

  return {
    title,
    company,
    city,
    province,
    salaryMin: parseOptionalNonNegativeInteger(input.salaryMin),
    salaryMax: parseOptionalNonNegativeInteger(input.salaryMax),
    salaryText: parseString(input.salaryText) || null,
    educationRequirement,
    experienceRequirement: parseOptionalNonNegativeInteger(
      input.experienceRequirement,
    ),
    description,
    applyUrl,
    source,
    sourceJobId,
    publishedAt: parsePublishedAt(input.publishedAt),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const jobsPayload = parseJobsPayload(body);

    if (!jobsPayload) {
      return NextResponse.json(
        { error: "Request body must be a job array" },
        { status: 400 },
      );
    }

    let importedCount = 0;
    let updatedCount = 0;
    const errors: ImportError[] = [];

    for (const [index, rawJob] of jobsPayload.entries()) {
      try {
        if (!rawJob || typeof rawJob !== "object" || Array.isArray(rawJob)) {
          throw new Error("职位数据必须是对象");
        }

        const jobData = normalizeJob(rawJob as ImportJobInput);

        if (jobData.sourceJobId) {
          const existingJob = await prisma.job.findUnique({
            where: {
              source_sourceJobId: {
                source: jobData.source,
                sourceJobId: jobData.sourceJobId,
              },
            },
          });

          await prisma.job.upsert({
            where: {
              source_sourceJobId: {
                source: jobData.source,
                sourceJobId: jobData.sourceJobId,
              },
            },
            create: jobData,
            update: jobData,
          });

          if (existingJob) {
            updatedCount += 1;
          } else {
            importedCount += 1;
          }
        } else {
          await prisma.job.create({
            data: jobData,
          });
          importedCount += 1;
        }
      } catch (error) {
        errors.push({
          index,
          message: error instanceof Error ? error.message : "导入失败",
        });
      }
    }

    return NextResponse.json({
      importedCount,
      updatedCount,
      failedCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Failed to import admin jobs", error);
    return NextResponse.json(
      { error: "Failed to import admin jobs" },
      { status: 500 },
    );
  }
}
