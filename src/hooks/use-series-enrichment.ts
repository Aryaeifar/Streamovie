"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOMDbSeries } from "@/lib/api/omdb-api";
import type { APIMedia } from "@/lib/api/types";
import { getTitle, getYear } from "@/lib/media";

function imdbIdFrom(media?: APIMedia) {
  if (!media) return undefined;
  const values = [media.imdb_id, media.imdbId, media.imdbID, media.imdb_url, media.imdb_link];
  return values.find((value): value is string => typeof value === "string" && /^tt\d{5,}$/.test(value.trim()));
}

export function useSeriesEnrichment(media?: APIMedia, enabled = true) {
  const title = media ? getTitle(media) : "";
  const year = media ? getYear(media) : undefined;
  const imdbId = imdbIdFrom(media);

  const omdb = useQuery({
    queryKey: ["omdb", "series", imdbId ?? title, year],
    queryFn: () => fetchOMDbSeries(title, year, imdbId),
    enabled: enabled && Boolean(title),
    staleTime: 1000 * 60 * 60 * 24,
  });

  return { omdb, title, year, imdbId };
}
