"use client";

import { useQuery } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api/media-api";
import { queryKeys } from "@/lib/query-keys";

export function useMediaSearch(query: string) {
  const normalizedQuery = query.trim();
  return useQuery({
    queryKey: queryKeys.search(normalizedQuery),
    queryFn: () => mediaApi.search(normalizedQuery),
    enabled: normalizedQuery.length > 0,
  });
}
