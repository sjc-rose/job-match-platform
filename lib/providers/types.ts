export const educationLevels = ["不限", "高中", "大专", "本科", "硕士", "博士"] as const;

export type EducationLevel = (typeof educationLevels)[number];

export type Job = {
  id: string;
  source: string;
  title: string;
  company: string;
  city: string;
  province: string;
  status?: string;
  salaryMin: number;
  salaryMax: number;
  salaryText: string;
  educationRequirement: EducationLevel;
  experienceRequirement: number;
  description: string;
  applyUrl: string;
  publishedAt: string;
};

export type SearchJobsParams = {
  educationLevel: EducationLevel;
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  city: string;
  keywords: string;
  experienceYears: number;
};

export interface JobProvider {
  source: string;
  searchJobs: (params: SearchJobsParams) => Promise<Job[]> | Job[];
  getJobById: (id: string) => Promise<Job | undefined> | Job | undefined;
}
