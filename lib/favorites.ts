export const FAVORITE_JOB_IDS_KEY = "job-match-platform.favoriteJobIds";
export const FAVORITES_CHANGED_EVENT = "favorite-jobs-change";

function readFavoriteJobIdsFromStorage() {
  const value = window.localStorage.getItem(FAVORITE_JOB_IDS_KEY);

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function notifyFavoritesChanged() {
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

export function getFavoriteJobIds() {
  if (typeof window === "undefined") {
    return [];
  }

  return readFavoriteJobIdsFromStorage();
}

export function setFavoriteJobIds(jobIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const uniqueJobIds = Array.from(new Set(jobIds));
  window.localStorage.setItem(FAVORITE_JOB_IDS_KEY, JSON.stringify(uniqueJobIds));
  notifyFavoritesChanged();
}

export function isFavoriteJob(jobId: string) {
  return getFavoriteJobIds().includes(jobId);
}

export function toggleFavoriteJob(jobId: string) {
  const favoriteJobIds = getFavoriteJobIds();
  const isFavorite = favoriteJobIds.includes(jobId);
  const nextFavoriteJobIds = isFavorite
    ? favoriteJobIds.filter((favoriteJobId) => favoriteJobId !== jobId)
    : [...favoriteJobIds, jobId];

  setFavoriteJobIds(nextFavoriteJobIds);

  return !isFavorite;
}
