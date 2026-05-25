import type { Job } from "@/lib/providers/types";

export type MatchScoreProfile = {
  targetTitle?: string | null;
  targetCity?: string | null;
  expectedSalaryMin?: number | null;
  expectedSalaryMax?: number | null;
  experienceYears?: number | null;
  skills?: string | null;
};

export type MatchScoreResult = {
  score: number | null;
  reasons: string[];
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function splitSkills(skills: string | null | undefined) {
  return (skills ?? "")
    .split(/[\s,，、;；\n\r]+/)
    .map((skill) => skill.trim().toLowerCase())
    .filter(Boolean);
}

function hasUsableProfile(profile: MatchScoreProfile | null | undefined) {
  if (!profile) {
    return false;
  }

  return Boolean(
    normalizeText(profile.targetTitle) ||
      normalizeText(profile.targetCity) ||
      splitSkills(profile.skills).length > 0 ||
      profile.expectedSalaryMin ||
      profile.expectedSalaryMax ||
      profile.experienceYears !== null ||
      profile.experienceYears !== undefined,
  );
}

function calculateTitleScore(job: Job, profile: MatchScoreProfile) {
  const targetTitle = normalizeText(profile.targetTitle);

  if (!targetTitle) {
    return { score: 0, reason: "" };
  }

  const jobTitle = normalizeText(job.title);

  if (jobTitle.includes(targetTitle) || targetTitle.includes(jobTitle)) {
    return { score: 25, reason: "目标岗位与职位标题匹配" };
  }

  return { score: 0, reason: "" };
}

function calculateCityScore(job: Job, profile: MatchScoreProfile) {
  const targetCity = normalizeText(profile.targetCity);

  if (!targetCity) {
    return { score: 0, reason: "" };
  }

  const city = normalizeText(job.city);

  if (city.includes(targetCity) || targetCity.includes(city)) {
    return { score: 20, reason: "目标城市符合职位城市" };
  }

  return { score: 0, reason: "" };
}

function calculateSkillScore(job: Job, profile: MatchScoreProfile) {
  const skills = splitSkills(profile.skills);

  if (skills.length === 0) {
    return { score: 0, reason: "" };
  }

  const haystack = `${job.title} ${job.description}`.toLowerCase();
  const matchedSkills = skills.filter((skill) => haystack.includes(skill));
  const score = Math.min(30, matchedSkills.length * 10);

  return {
    score,
    reason:
      matchedSkills.length > 0
        ? `技能关键词匹配：${matchedSkills.slice(0, 3).join("、")}`
        : "",
  };
}

function calculateSalaryScore(job: Job, profile: MatchScoreProfile) {
  const expectedMin = profile.expectedSalaryMin ?? 0;
  const expectedMax = profile.expectedSalaryMax ?? 0;

  if (expectedMin === 0 && expectedMax === 0) {
    return { score: 0, reason: "" };
  }

  const jobMin = job.salaryMin ?? 0;
  const jobMax = job.salaryMax ?? 0;

  if (jobMin === 0 && jobMax === 0) {
    return { score: 0, reason: "" };
  }

  const normalizedExpectedMin =
    expectedMin > 0 && expectedMax > 0 ? Math.min(expectedMin, expectedMax) : expectedMin || expectedMax;
  const normalizedExpectedMax =
    expectedMin > 0 && expectedMax > 0 ? Math.max(expectedMin, expectedMax) : expectedMax || expectedMin;
  const normalizedJobMin = jobMin || jobMax;
  const normalizedJobMax = jobMax || jobMin;
  const overlapMin = Math.max(normalizedExpectedMin, normalizedJobMin);
  const overlapMax = Math.min(normalizedExpectedMax, normalizedJobMax);

  if (overlapMax >= overlapMin) {
    return { score: 15, reason: "薪资范围与期望匹配" };
  }

  if (normalizedJobMin > normalizedExpectedMax) {
    return { score: 12, reason: "职位薪资高于期望范围" };
  }

  return { score: 0, reason: "" };
}

function calculateExperienceScore(job: Job, profile: MatchScoreProfile) {
  const experienceYears = profile.experienceYears;

  if (experienceYears === null || experienceYears === undefined) {
    return { score: 0, reason: "" };
  }

  if (experienceYears >= (job.experienceRequirement ?? 0)) {
    return { score: 10, reason: "工作经验满足职位要求" };
  }

  const description = normalizeText(job.description);

  if (
    experienceYears === 0 &&
    (description.includes("应届") ||
      description.includes("经验不限") ||
      description.includes("0年"))
  ) {
    return { score: 10, reason: "经验要求适合当前阶段" };
  }

  return { score: 0, reason: "" };
}

export function calculateMatchScore(
  job: Job,
  profile: MatchScoreProfile | null | undefined,
): MatchScoreResult {
  if (!hasUsableProfile(profile)) {
    return {
      score: null,
      reasons: ["完善求职偏好后查看匹配度"],
    };
  }

  const usableProfile = profile as MatchScoreProfile;
  const parts = [
    calculateTitleScore(job, usableProfile),
    calculateCityScore(job, usableProfile),
    calculateSkillScore(job, usableProfile),
    calculateSalaryScore(job, usableProfile),
    calculateExperienceScore(job, usableProfile),
  ];
  const score = Math.min(
    100,
    parts.reduce((total, part) => total + part.score, 0),
  );
  const reasons = parts
    .map((part) => part.reason)
    .filter((reason): reason is string => Boolean(reason));

  return {
    score,
    reasons: reasons.length > 0 ? reasons : ["当前职位与求职偏好匹配度较低"],
  };
}
