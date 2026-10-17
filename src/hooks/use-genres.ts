"use client";

import { useQuery } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api/media-api";
import { queryKeys } from "@/lib/query-keys";

export function useGenres() {
  return useQuery({
    queryKey: queryKeys.genres,
    queryFn: () => mediaApi.fetchGenres(),
    staleTime: 60 * 60 * 1000,
  });
}
