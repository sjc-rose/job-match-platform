import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ProfileRecord = {
  id: string;
  userId: string;
  targetTitle: string | null;
  targetCity: string | null;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  education: string | null;
  experienceYears: number | null;
  skills: string | null;
  selfIntroduction: string | null;
  createdAt: Date;
  updatedAt: Date;
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

function toApiProfile(profile: ProfileRecord | null) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    userId: profile.userId,
    targetTitle: profile.targetTitle ?? "",
    targetCity: profile.targetCity ?? "",
    expectedSalaryMin: profile.expectedSalaryMin ?? null,
    expectedSalaryMax: profile.expectedSalaryMax ?? null,
    education: profile.education ?? "",
    experienceYears: profile.experienceYears ?? null,
    skills: profile.skills ?? "",
    selfIntroduction: profile.selfIntroduction ?? "",
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function parseProfilePayload(body: Record<string, unknown>) {
  const targetTitle = parseString(body.targetTitle);
  const targetCity = parseString(body.targetCity);
  const education = parseString(body.education);
  const skills = parseString(body.skills);
  const selfIntroduction = parseString(body.selfIntroduction);

  return {
    targetTitle: targetTitle || null,
    targetCity: targetCity || null,
    expectedSalaryMin: parseOptionalNonNegativeInteger(body.expectedSalaryMin),
    expectedSalaryMax: parseOptionalNonNegativeInteger(body.expectedSalaryMax),
    education: education || null,
    experienceYears: parseOptionalNonNegativeInteger(body.experienceYears),
    skills: skills || null,
    selfIntroduction: selfIntroduction || null,
  };
}

export async function GET() {
  try {
    const { response, user } = await requireCurrentUser();

    if (response) {
      return response;
    }

    const profile = await prisma.userProfile.findUnique({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      profile: toApiProfile(profile),
    });
  } catch (error) {
    console.error("Failed to fetch user profile", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 },
    );
  }
}

async function saveProfile(request: Request) {
  try {
    const { response, user } = await requireCurrentUser();

    if (response) {
      return response;
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const profileData = parseProfilePayload(body);
    const profile = await prisma.userProfile.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        ...profileData,
      },
      update: profileData,
    });

    return NextResponse.json({
      profile: toApiProfile(profile),
    });
  } catch (error) {
    console.error("Failed to save user profile", error);
    return NextResponse.json(
      { error: "Failed to save user profile" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return saveProfile(request);
}

export async function PATCH(request: Request) {
  return saveProfile(request);
}
