"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMovies } from "@/hooks/use-movies";
import { useSeries } from "@/hooks/use-series";
import { useSelectedMediaHydrated } from "@/hooks/use-selected-media-hydrated";
import { queryKeys } from "@/lib/query-keys";
import type { APIMedia } from "@/lib/api/types";
import { useLibraryStore } from "@/stores/use-library-store";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";

function fromEntry(entry: unknown, mediaId: number): APIMedia | undefined {
  if (!entry || typeof entry !== "object") return undefined;
  if (Number((entry as APIMedia).id) === mediaId) return entry as APIMedia;
  const nested = (entry as { media?: APIMedia }).media;
  if (nested && Number(nested.id) === mediaId) return nested;
  return undefined;
}

function findInCache(data: unknown, mediaId: number): APIMedia | undefined {
  if (!data) return undefined;

  if (Array.isArray(data)) {
    for (const entry of data) {
      const found = fromEntry(entry, mediaId);
      if (found) return found;
    }
    return undefined;
  }

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["posters", "items", "pages"]) {
      const value = record[key];
      if (Array.isArray(value)) {
        const found = findInCache(value, mediaId);
        if (found) return found;
      }
    }
  }

  return undefined;
}

export function useMediaDetails(kind: "movie" | "series", mediaId: number) {
  const movies = useMovies();
  const series = useSeries();
  const queryClient = useQueryClient();
  const source = kind === "movie" ? movies : series;
  const selectedMedia = useSelectedMediaStore((state) => state.selected[kind]?.[mediaId]);
  const savedMedia = useLibraryStore((state) => state.savedMedia[mediaId]);
  const hydrated = useSelectedMediaHydrated();

  const media = useMemo<APIMedia | undefined>(() => {
    if (selectedMedia) return selectedMedia;
    if (savedMedia && savedMedia.kind === kind) return savedMedia.media;

    const direct = source.data?.find((item) => Number(item.id) === mediaId);
    if (direct) return direct;

    // Fall back to any other list already in the cache (e.g. the browse page).
    const queries = queryClient.getQueriesData<unknown>({ queryKey: queryKeys.all });
    for (const [, data] of queries) {
      const found = findInCache(data, mediaId);
      if (found) return found;
    }

    return undefined;
  }, [selectedMedia, savedMedia, source.data, mediaId, queryClient]);

  return {
    ...source,
    media,
    isLoading: !media && (source.isLoading || !hydrated),
    error: media ? null : source.error,
  };
}
