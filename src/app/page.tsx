"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SpotlightHero, type HeroItem } from "@/components/media/spotlight-hero";
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
  const topMovies = useMovies(0, 0, "imdb");
  const topSeries = useSeries(0, 0, "imdb");

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
      {featured.length ? (
        <SpotlightHero items={featured} />
      ) : loading ? (
        <Skeleton className="min-h-[70svh] w-full" />
      ) : (
        <Container className="py-10">
          <EmptyState
            icon={Film}
            title={t.home.unavailableTitle}
            description={error?.message ?? t.home.unavailableBody}
          />
        </Container>
      )}

      <Container className="space-y-12 pb-10 pt-12">
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
          moreHref="/browse/trending"
        />
        <MediaRow
          id="movies"
          title={t.home.movies}
          subtitle={t.home.moviesSubtitle}
          items={toRows(movies.data, "movie")}
          loading={movies.isLoading}
          error={movies.error}
          onRetry={() => movies.refetch()}
          moreHref="/browse/movies"
        />
        <MediaRow
          id="series"
          title={t.home.seriesRow}
          subtitle={t.home.seriesSubtitle}
          items={toRows(series.data, "series")}
          loading={series.isLoading}
          error={series.error}
          onRetry={() => series.refetch()}
          moreHref="/browse/series"
        />
        <MediaRow
          id="imdb-movies"
          title={t.home.imdbMovies}
          subtitle={t.home.imdbMoviesSubtitle}
          items={toRows(topMovies.data, "movie")}
          loading={topMovies.isLoading}
          error={topMovies.error}
          onRetry={() => topMovies.refetch()}
          moreHref="/browse/imdb-movies"
        />
        <MediaRow
          id="imdb-series"
          title={t.home.imdbSeries}
          subtitle={t.home.imdbSeriesSubtitle}
          items={toRows(topSeries.data, "series")}
          loading={topSeries.isLoading}
          error={topSeries.error}
          onRetry={() => topSeries.refetch()}
          moreHref="/browse/imdb-series"
        />
      </Container>
    </AppShell>
  );
}
