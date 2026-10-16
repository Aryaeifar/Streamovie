"use client";

import { useQuery } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api/media-api";
import { queryKeys } from "@/lib/query-keys";

export function useMovies(page = 0, genreId = 0, sort = "created") {
  return useQuery({ queryKey: queryKeys.movies(page, genreId, sort), queryFn: () => mediaApi.fetchMovies(page, genreId, sort) });
}
