"use client";

import { useEffect, useState } from "react";
import {
  FAVORITES_CHANGED_EVENT,
  isFavoriteJob,
  toggleFavoriteJob,
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

  useEffect(() => {
    function syncFavoriteState() {
      setIsFavorite(isFavoriteJob(jobId));
    }

    syncFavoriteState();
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavoriteState);
    window.addEventListener("storage", syncFavoriteState);

    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavoriteState);
      window.removeEventListener("storage", syncFavoriteState);
    };
  }, [jobId]);

  function handleClick() {
    setIsFavorite(toggleFavoriteJob(jobId));
  }

  return (
    <button
      aria-pressed={isFavorite}
      className={className}
      onClick={handleClick}
      type="button"
    >
      {isFavorite ? activeLabel : inactiveLabel}
    </button>
  );
}
