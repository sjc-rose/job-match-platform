import type { EducationLevel, Job, SearchJobsParams } from "./providers/types";
import { educationLevels } from "./providers/types";

export type UserProfile = SearchJobsParams;

export type JobMatch = {
  job: Job;
  matchScore: number;
  matchReasons: string[];
};

const educationRank = new Map<EducationLevel, number>(
  educationLevels.map((level, index) => [level, index]),
);

function splitKeywords(keywords: string) {
  return keywords
    .split(/[\s,，、]+/)
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
}

function calculateKeywordScore(profile: UserProfile, job: Job) {
  const keywords = splitKeywords(profile.keywords);

  if (keywords.length === 0) {
    return { score: 0, reason: "" };
  }

  const haystack = `${job.title} ${job.company} ${job.description}`.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword));
  const score = Math.round((matchedKeywords.length / keywords.length) * 30);

  return {
    score,
    reason: matchedKeywords.length > 0 ? "岗位关键词匹配" : "",
  };
}

function calculateCityScore(profile: UserProfile, job: Job) {
  const preferredCity = profile.city.trim();

  if (!preferredCity) {
    return { score: 0, reason: "" };
  }

  if (job.city === preferredCity) {
    return { score: 20, reason: "城市符合期望" };
  }

  return { score: 0, reason: "" };
}

function calculateSalaryScore(profile: UserProfile, job: Job) {
  const expectedMin = Math.min(profile.expectedSalaryMin, profile.expectedSalaryMax);
  const expectedMax = Math.max(profile.expectedSalaryMin, profile.expectedSalaryMax);
  const overlapMin = Math.max(expectedMin, job.salaryMin);
  const overlapMax = Math.min(expectedMax, job.salaryMax);

  if (overlapMax >= overlapMin) {
    return { score: 25, reason: "薪资范围符合期望" };
  }

  if (job.salaryMin > expectedMax) {
    return { score: 20, reason: "薪资范围符合期望" };
  }

  const gap = expectedMin - job.salaryMax;
  const tolerance = Math.max(expectedMin * 0.5, 1);
  const score = Math.max(0, Math.round(25 * (1 - gap / tolerance)));

  return {
    score,
    reason: score > 0 ? "薪资范围接近期望" : "",
  };
}

function calculateEducationScore(profile: UserProfile, job: Job) {
  const userRank = educationRank.get(profile.educationLevel) ?? 0;
  const jobRank = educationRank.get(job.educationRequirement) ?? 0;

  if (userRank >= jobRank) {
    return { score: 15, reason: "学历要求满足" };
  }

  if (jobRank - userRank === 1) {
    return { score: 6, reason: "学历与要求接近" };
  }

  return { score: 0, reason: "" };
}

function calculateExperienceScore(profile: UserProfile, job: Job) {
  if (profile.experienceYears >= job.experienceRequirement) {
    return {
      score: 10,
      reason: "经验要求满足",
    };
  }

  if (job.experienceRequirement - profile.experienceYears === 1) {
    return { score: 5, reason: "工作经验与要求接近" };
  }

  return { score: 0, reason: "" };
}

export function calculateJobMatches(
  userProfile: UserProfile,
  jobs: Job[],
): JobMatch[] {
  return jobs
    .map((job) => {
      const parts = [
        calculateKeywordScore(userProfile, job),
        calculateCityScore(userProfile, job),
        calculateSalaryScore(userProfile, job),
        calculateEducationScore(userProfile, job),
        calculateExperienceScore(userProfile, job),
      ];
      const matchScore = Math.min(
        100,
        parts.reduce((total, part) => total + part.score, 0),
      );
      const matchReasons = parts
        .map((part) => part.reason)
        .filter((reason): reason is string => Boolean(reason));

      return {
        job,
        matchScore,
        matchReasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
