"use client";

import { useEffect, useState } from "react";
import {
  FAVORITES_CHANGED_EVENT,
  getFavoriteJobIds,
  isFavoriteJob,
  setFavoriteJobIds,
} from "@/lib/favorites";

type FavoriteButtonProps = {
  jobId: string;
  inactiveLabel?: string;
  activeLabel?: string;
  className?: string;
};

const defaultClassName =
  "inline-flex justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-teal-500 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/15";

export function FavoriteButton({
  jobId,
  inactiveLabel = "收藏职位",
  activeLabel = "取消收藏",
  className = defaultClassName,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function syncFavoriteState() {
      setIsFavorite(isFavoriteJob(jobId));
    }

    async function syncFavoriteStateFromApi() {
      try {
        const response = await fetch("/api/favorites");

        if (response.status === 401) {
          setMessage("请先登录后收藏职位");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch favorites");
        }

        const data = (await response.json()) as { jobIds: string[] };
        setFavoriteJobIds(data.jobIds);
        setIsFavorite(data.jobIds.includes(jobId));
      } catch {
        syncFavoriteState();
      }
    }

    syncFavoriteState();
    void syncFavoriteStateFromApi();
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavoriteState);
    window.addEventListener("storage", syncFavoriteState);

    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavoriteState);
      window.removeEventListener("storage", syncFavoriteState);
    };
  }, [jobId]);

  async function handleClick() {
    const nextIsFavorite = !isFavorite;
    const currentFavoriteJobIds = getFavoriteJobIds();
    const nextFavoriteJobIds = nextIsFavorite
      ? Array.from(new Set([...currentFavoriteJobIds, jobId]))
      : currentFavoriteJobIds.filter((favoriteJobId) => favoriteJobId !== jobId);

    setIsFavorite(nextIsFavorite);
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/favorites", {
        method: nextIsFavorite ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      });

      if (response.status === 401) {
        setIsFavorite(isFavorite);
        setMessage("请先登录后收藏职位");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update favorite");
      }

      setFavoriteJobIds(nextFavoriteJobIds);
    } catch {
      setFavoriteJobIds(nextFavoriteJobIds);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-2">
      <button
        aria-pressed={isFavorite}
        className={className}
        disabled={isSaving}
        onClick={handleClick}
        type="button"
      >
        {isFavorite ? activeLabel : inactiveLabel}
      </button>
      {message ? (
        <span className="text-xs font-semibold text-amber-700">{message}</span>
      ) : null}
    </span>
  );
}
