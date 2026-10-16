"use client";

import { useQuery } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api/media-api";
import { queryKeys } from "@/lib/query-keys";

export function useSeasons(seriesId: number, enabled = true) {
  return useQuery({ queryKey: queryKeys.seasons(seriesId), queryFn: () => mediaApi.fetchSeasons(seriesId), enabled: enabled && seriesId > 0 });
}
