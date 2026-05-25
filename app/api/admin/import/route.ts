import { NextResponse } from "next/server";
import { createJobDedupKey, isInvalidImportJob } from "@/lib/importDedup";
import { prisma } from "@/lib/prisma";

const DEFAULT_SOURCE = "manual-import";
const DEFAULT_CITY = "未设置";
const DEFAULT_PROVINCE = "未设置";
const DEFAULT_EDUCATION = "不限";
const DEFAULT_DESCRIPTION = "暂无职位描述";
const DEFAULT_APPLY_URL = "#";
const MAX_ERROR_DETAILS = 10;

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

type ImportErrorDetail = {
  index: number;
  message: string;
};

type NormalizedImportJob = {
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
  source: string;
  sourceJobId: string | null;
  publishedAt: Date | null;
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

function normalizeJob(input: ImportJobInput): NormalizedImportJob {
  const title = parseString(input.title);
  const company = parseString(input.company);
  const city = parseString(input.city) || DEFAULT_CITY;
  const province = parseString(input.province) || city || DEFAULT_PROVINCE;
  const educationRequirement =
    parseString(input.educationRequirement) || DEFAULT_EDUCATION;
  const description = parseString(input.description) || DEFAULT_DESCRIPTION;
  const applyUrl = parseString(input.applyUrl) || DEFAULT_APPLY_URL;
  const source = parseString(input.source) || DEFAULT_SOURCE;
  const sourceJobId = parseString(input.sourceJobId) || null;

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

function toImportResult(input: {
  errorDetails: ImportErrorDetail[];
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  total: number;
}) {
  return {
    total: input.total,
    imported: input.imported,
    skippedDuplicates: input.skippedDuplicates,
    skippedInvalid: input.skippedInvalid,
    errors: input.errorDetails.length,
    errorDetails: input.errorDetails.slice(0, MAX_ERROR_DETAILS),
    importedCount: input.imported,
    updatedCount: 0,
    failedCount: input.errorDetails.length + input.skippedInvalid,
    skippedDuplicateCount: input.skippedDuplicates,
    skippedInvalidCount: input.skippedInvalid,
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

    const total = jobsPayload.length;
    const normalizedJobs: Array<{
      data: NormalizedImportJob;
      dedupInput: {
        city: string;
        company: string;
        source: string;
        title: string;
      };
      index: number;
    }> = [];
    const errorDetails: ImportErrorDetail[] = [];
    let skippedInvalid = 0;

    for (const [index, rawJob] of jobsPayload.entries()) {
      try {
        if (!rawJob || typeof rawJob !== "object" || Array.isArray(rawJob)) {
          throw new Error("职位数据必须是对象");
        }

        const rawJobInput = rawJob as ImportJobInput;
        const jobData = normalizeJob(rawJobInput);

        if (isInvalidImportJob(jobData)) {
          skippedInvalid += 1;
          errorDetails.push({
            index,
            message: "无效职位：title 和 company 为必填字段",
          });
          continue;
        }

        normalizedJobs.push({
          data: jobData,
          dedupInput: {
            city: jobData.city,
            company: jobData.company,
            source: parseString(rawJobInput.source),
            title: jobData.title,
          },
          index,
        });
      } catch (error) {
        errorDetails.push({
          index,
          message: error instanceof Error ? error.message : "导入失败",
        });
      }
    }

    const existingJobs = await prisma.job.findMany({
      select: {
        city: true,
        company: true,
        source: true,
        title: true,
      },
    });
    const existingKeys = new Set(existingJobs.map(createJobDedupKey));
    const existingKeysWithoutSource = new Set(
      existingJobs.map((job) =>
        createJobDedupKey({
          city: job.city,
          company: job.company,
          source: "",
          title: job.title,
        }),
      ),
    );
    const importKeys = new Set<string>();
    let skippedDuplicates = 0;
    let imported = 0;

    for (const { data, dedupInput, index } of normalizedJobs) {
      const dedupKey = createJobDedupKey(dedupInput);
      const hasExistingDuplicate = dedupInput.source
        ? existingKeys.has(dedupKey)
        : existingKeysWithoutSource.has(dedupKey);

      if (hasExistingDuplicate || importKeys.has(dedupKey)) {
        skippedDuplicates += 1;
        continue;
      }

      try {
        await prisma.job.create({
          data,
        });
        imported += 1;
        importKeys.add(dedupKey);
      } catch (error) {
        errorDetails.push({
          index,
          message: error instanceof Error ? error.message : "导入失败",
        });
      }
    }

    return NextResponse.json(
      toImportResult({
        total,
        imported,
        skippedDuplicates,
        skippedInvalid,
        errorDetails,
      }),
    );
  } catch (error) {
    console.error("Failed to import admin jobs", error);
    return NextResponse.json(
      { error: "Failed to import admin jobs" },
      { status: 500 },
    );
  }
}
