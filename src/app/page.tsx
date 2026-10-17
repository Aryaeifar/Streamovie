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
import { useMediaSearch } from "@/hooks/use-media-search";
import type { APIMedia } from "@/lib/api/types";
import { Film } from "lucide-react";

const HERO_BACKDROPS: Record<string, string> = {
  Friends: "https://wallpapercrafter.com/desktop1/520373-Chandler-Bing-David-Schwimmer-Friends-TV-Series.jpg",
  "Attack on Titan": "https://global-img.gamergen.com/shingeki-no-kyojin-attack-on-titan-final-season-29-05-2020_0900953328.jpg",
  Berserk: "https://server.wallpaperalchemy.com/storage/wallpapers/423/berserk-guts-moon-wallpaper-4k.jpg",
  Dark: "https://img.zeit.de/kultur/film/2017-11/dark-netflix-louis-hofmann-teaser/wide__1300x731",
  "Breaking Bad": "https://img.apmcdn.org/ef7946f7c9a4e263229a4b3e0fb182618ab18f73/normal/baca2e-20131004-breaking-bad.jpg",
  "Game of Thrones": "https://media.assettype.com/thequint/2019-04/6ce6797f-d7d9-4fec-897c-8a167105d56e/Got_Hero_Image.jpg?auto=format%2Ccompress&dpr=1.0&fmt=webp&format=webp&h=900&w=1200",
};

const HERO_COPY_FA: Record<string, { title: string; description: string }> = {
  Friends: {
    title: "فرندز",
    description: "شش دوست در نیویورک با لحظه‌های خنده‌دار، رابطه‌های پیچیده و ماجراهای روزمره کنار هم بزرگ می‌شوند.",
  },
  "Attack on Titan": {
    title: "حمله به تایتان",
    description: "انسان‌ها پشت دیوارهای عظیم از تایتان‌ها پناه گرفته‌اند؛ کشف حقیقت، سرنوشتشان را دگرگون می‌کند.",
  },
  Berserk: {
    title: "برزرک",
    description: "گاتس، جنگجویی تنها در دنیایی تاریک، با سرنوشتی خونین و نیروهای اهریمنی روبه‌روست.",
  },
  Dark: {
    title: "دارک",
    description: "ناپدیدشدن یک کودک در شهری کوچک، رازهای چند نسل و پیوند پیچیده زمان را آشکار می‌کند.",
  },
  "Breaking Bad": {
    title: "بریکینگ بد",
    description: "یک معلم شیمی پس از تشخیص بیماری، وارد دنیای تولید مواد مخدر می‌شود و زندگی‌اش را به مسیری خطرناک می‌کشاند.",
  },
  "Game of Thrones": {
    title: "بازی تاج‌وتخت",
    description: "خاندان‌های قدرتمند برای تخت آهنین می‌جنگند، در حالی که تهدیدی فراسوی دیوار در حال نزدیک‌شدن است.",
  },
};

export default function HomePage() {
  const { t } = useI18n();
  const movies = useMovies();
  const series = useSeries();
  const topMovies = useMovies(0, 0, "imdb");
  const topSeries = useSeries(0, 0, "imdb");
  const friendsSearch = useMediaSearch("Friends");
  const attackSearch = useMediaSearch("Attack on Titan");
  const berserkSearch = useMediaSearch("Berserk");
  const darkSearch = useMediaSearch("Dark");
  const breakingBadSearch = useMediaSearch("Breaking Bad");
  const gameOfThronesSearch = useMediaSearch("Game of Thrones");

  const featured = useMemo<HeroItem[]>(
    () => [
      ...(movies.data ?? []).slice(0, 6).map((media) => ({ media, kind: "movie" as const })),
      ...(series.data ?? []).slice(0, 4).map((media) => ({ media, kind: "series" as const })),
    ],
    [movies.data, series.data],
  );

  const toRows = (data: APIMedia[] | undefined, kind: "movie" | "series") =>
    data?.map((media) => ({ media, kind }));

  const heroSeries = useMemo<HeroItem[]>(() => {
    const picks = [
      { title: "Friends", results: friendsSearch.data ?? [] },
      { title: "Attack on Titan", results: attackSearch.data ?? [] },
      { title: "Berserk", results: berserkSearch.data ?? [] },
      { title: "Dark", results: darkSearch.data ?? [] },
      { title: "Breaking Bad", results: breakingBadSearch.data ?? [] },
      { title: "Game of Thrones", results: gameOfThronesSearch.data ?? [] },
    ];

    return picks.flatMap(({ title, results }) => {
      const normalizedTitle = title.toLocaleLowerCase();
      const match = results.find((media) => {
        const record = media as Record<string, unknown>;
        const names = [record.title, record.name, record.original_title, record.original_name, record.en_title]
          .filter((name): name is string => typeof name === "string")
          .map((name) => name.toLocaleLowerCase());
        return names.some((name) => name === normalizedTitle || name.includes(normalizedTitle));
      });
      return match
        ? [{
            media: match,
            kind: "series" as const,
            artwork: HERO_BACKDROPS[title],
            titleFa: HERO_COPY_FA[title]?.title,
            descriptionFa: HERO_COPY_FA[title]?.description,
          }]
        : [];
    });
  }, [friendsSearch.data, attackSearch.data, berserkSearch.data, darkSearch.data, breakingBadSearch.data, gameOfThronesSearch.data]);

  const heroLoading = [
    friendsSearch,
    attackSearch,
    berserkSearch,
    darkSearch,
    breakingBadSearch,
    gameOfThronesSearch,
  ].some((query) => query.isLoading);

  const loading = movies.isLoading || series.isLoading;
  const error = movies.error ?? series.error;

  return (
    <AppShell>
      {heroSeries.length ? (
        <SpotlightHero items={heroSeries} />
      ) : heroLoading ? (
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

      <Container className="space-y-8 px-4 pb-10 pt-5 sm:space-y-10 sm:px-6 sm:pt-8 lg:px-10">
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
