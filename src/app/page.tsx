"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MediaHero, type HeroItem } from "@/components/media/media-hero";
import { MediaRow } from "@/components/media/media-row";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/hooks/use-i18n";
import { useMovies } from "@/hooks/use-movies";
import { useSeries } from "@/hooks/use-series";
import type { APIMedia } from "@/lib/api/types";
import { Film } from "lucide-react";

export default function HomePage() {
  const { t } = useI18n();
  const movies = useMovies();
  const series = useSeries();

  const featured = useMemo<HeroItem[]>(
    () => [
      ...(movies.data ?? []).slice(0, 6).map((media) => ({ media, kind: "movie" as const })),
      ...(series.data ?? []).slice(0, 4).map((media) => ({ media, kind: "series" as const })),
    ],
    [movies.data, series.data],
  );

  const toRows = (data: APIMedia[] | undefined, kind: "movie" | "series") =>
    data?.map((media) => ({ media, kind }));

  const loading = movies.isLoading || series.isLoading;
  const error = movies.error ?? series.error;

  return (
    <AppShell>
      <Container className="space-y-12 py-6 sm:py-8">
        {featured.length ? (
          <MediaHero items={featured} />
        ) : loading ? (
          <Skeleton className="min-h-[64vh] rounded-hero sm:min-h-[70vh]" />
        ) : (
          <EmptyState
            icon={Film}
            title={t.home.unavailableTitle}
            description={error?.message ?? t.home.unavailableBody}
          />
        )}

        <MediaRow
          id="trending"
          title={t.home.trending}
          subtitle={t.home.trendingSubtitle}
          items={featured.length ? featured : undefined}
          loading={loading}
          error={error}
          onRetry={() => {
            movies.refetch();
            series.refetch();
          }}
        />
        <MediaRow
          id="movies"
          title={t.home.movies}
          subtitle={t.home.moviesSubtitle}
          items={toRows(movies.data, "movie")}
          loading={movies.isLoading}
          error={movies.error}
          onRetry={() => movies.refetch()}
        />
        <MediaRow
          id="series"
          title={t.home.seriesRow}
          subtitle={t.home.seriesSubtitle}
          items={toRows(series.data, "series")}
          loading={series.isLoading}
          error={series.error}
          onRetry={() => series.refetch()}
        />
      </Container>
    </AppShell>
  );
}
