"use client";

import { useMemo } from "react";
import { useMovies } from "@/hooks/use-movies";
import { useSeries } from "@/hooks/use-series";
import type { APIMedia } from "@/lib/api/types";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";

/** Resolves details from the catalog endpoint, since the supplied API has no item-detail endpoint. */
export function useMediaDetails(kind: "movie" | "series", mediaId: number) {
  const movies = useMovies();
  const series = useSeries();
  const source = kind === "movie" ? movies : series;
  const selectedMedia = useSelectedMediaStore((state) => state.selected[kind]?.[mediaId]);
  const media = useMemo<APIMedia | undefined>(
    () => selectedMedia ?? source.data?.find((item) => Number(item.id) === mediaId),
    [selectedMedia, source.data, mediaId],
  );

  return { ...source, media, isLoading: selectedMedia ? false : source.isLoading, error: selectedMedia ? null : source.error };
}
