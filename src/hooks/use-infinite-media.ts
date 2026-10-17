"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api/media-api";
import { queryKeys } from "@/lib/query-keys";
import type { APIMedia } from "@/lib/api/types";
import type { BrowseKind, BrowseSort } from "@/lib/browse-categories";
import type { MediaKind } from "@/lib/media";

export type BrowseItem = { media: APIMedia; kind: MediaKind };

const PAGE_SIZE = 30;

function interleave(movies: BrowseItem[], series: BrowseItem[]): BrowseItem[] {
  const items: BrowseItem[] = [];
  const max = Math.max(movies.length, series.length);
  for (let index = 0; index < max; index += 1) {
    if (movies[index]) items.push(movies[index]);
    if (series[index]) items.push(series[index]);
  }
  return items;
}

export type BrowsePage = { items: BrowseItem[]; hasMore: boolean };

async function fetchBrowsePage(
  kind: BrowseKind,
  sort: BrowseSort,
  genreId: number,
  page: number,
): Promise<BrowsePage> {
  if (kind === "movie") {
    const movies = await mediaApi.fetchMovies(page, genreId, sort);
    return { items: movies.map((media) => ({ media, kind: "movie" })), hasMore: movies.length >= PAGE_SIZE };
  }

  if (kind === "series") {
    const series = await mediaApi.fetchSeries(page, genreId, sort);
    return { items: series.map((media) => ({ media, kind: "series" })), hasMore: series.length >= PAGE_SIZE };
  }

  const [movies, series] = await Promise.all([
    mediaApi.fetchMovies(page, genreId, sort),
    mediaApi.fetchSeries(page, genreId, sort),
  ]);

  return {
    items: interleave(
      movies.map((media) => ({ media, kind: "movie" })),
      series.map((media) => ({ media, kind: "series" })),
    ),
    hasMore: movies.length >= PAGE_SIZE || series.length >= PAGE_SIZE,
  };
}

export function useInfiniteMedia(kind: BrowseKind, sort: BrowseSort, genreId = 0) {
  return useInfiniteQuery({
    queryKey: queryKeys.browse(kind, sort, genreId),
    queryFn: ({ pageParam }) => fetchBrowsePage(kind, sort, genreId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
  });
}
