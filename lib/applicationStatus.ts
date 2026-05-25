export const applicationStatuses = [
  "not_applied",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  not_applied: "未申请",
  applied: "已申请",
  interviewing: "面试中",
  offer: "Offer",
  rejected: "拒绝",
  withdrawn: "放弃",
};

export function toApplicationStatus(value: unknown): ApplicationStatus {
  return applicationStatuses.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : "not_applied";
}

export function getApplicationStatusLabel(value: unknown) {
  return applicationStatusLabels[toApplicationStatus(value)];
}
