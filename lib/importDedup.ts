export type DedupJobInput = {
  city?: string | null;
  company?: string | null;
  source?: string | null;
  title?: string | null;
};

export function normalizeDedupValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function createJobDedupKey(job: DedupJobInput) {
  const title = normalizeDedupValue(job.title);
  const company = normalizeDedupValue(job.company);
  const city = normalizeDedupValue(job.city);
  const source = normalizeDedupValue(job.source);
  const parts = source
    ? [title, company, city, source]
    : [title, company, city];

  return parts.join("|");
}

export function isInvalidImportJob(job: DedupJobInput) {
  return !normalizeDedupValue(job.title) || !normalizeDedupValue(job.company);
}
