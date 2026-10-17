"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api/media-api";
import type { BrowseKind } from "@/lib/browse-categories";
import { getMediaKind } from "@/lib/media";

const PAGE_SIZE = 30;

export function useCountryMedia(countryId: number, kind: BrowseKind) {
  return useInfiniteQuery({
    queryKey: ["streamovie", "country", countryId, kind],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const results = await mediaApi.fetchMediaByCountry(countryId, page);
      const filtered = results.map((media) => ({ media, kind: getMediaKind(media) }));
      return {
        items: kind === "all" ? filtered : filtered.filter((item) => item.kind === kind),
        hasMore: results.length >= PAGE_SIZE,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
  });
}
