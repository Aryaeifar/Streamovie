"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  ChevronLeft,
  Clock3,
  ImageOff,
  Info,
  Play,
  SignalHigh,
  Star,
  Tv,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SeriesEnrichment, SeriesEpisodeGuide } from "@/components/media/series-enrichment";
import { useI18n } from "@/hooks/use-i18n";
import { useMediaDetails } from "@/hooks/use-media-details";
import { useSeasons } from "@/hooks/use-seasons";
import type { APIMedia, APISeason } from "@/lib/api/types";
import {
  formatQuality,
  getClassification,
  getCountries,
  getCover,
  getDuration,
  getEpisodes,
  getGenres,
  getPoster,
  getRating,
  getSeasonTitle,
  getSources,
  getTitle,
  getYear,
  parseDescription,
  type MediaKind,
  type SourceLink,
} from "@/lib/media";
import { isPersianText } from "@/lib/text";
import { useLibraryStore } from "@/stores/use-library-store";
import { cn } from "@/lib/utils";

function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-gold-400" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} className="size-3.5" fill={index < Math.round(value / 2) ? "currentColor" : "transparent"} />
      ))}
    </span>
  );
}

function SourceLinks({ sources, emptyTitle, emptyBody }: { sources: SourceLink[]; emptyTitle: string; emptyBody: string }) {
  const { t } = useI18n();
  const downloads = sources.filter((source) => !source.isTrailer);

  if (!downloads.length) {
    return (
      <EmptyState icon={ArrowDownToLine} title={emptyTitle} description={emptyBody} className="py-10" />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {downloads.map((source) => (
        <a
          key={`${source.id}-${source.url}`}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-brand-400/50 hover:bg-white/[0.06]"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2 font-semibold text-fog-100">
              <SignalHigh className="size-4 text-brand-400" />
              {formatQuality(source.quality)}
            </span>
            <span className="mt-1 block text-xs uppercase tracking-wide text-fog-500">
              {source.type ? `${t.details.sourceType}: ${source.type}` : t.details.sourceQuality}
            </span>
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-fog-200 transition group-hover:bg-brand-500 group-hover:text-white">
            <ArrowDownToLine className="size-4" />
          </span>
        </a>
      ))}
    </div>
  );
}

function DownloadPanel({ kind, media, seasons }: { kind: MediaKind; media: APIMedia; seasons: APISeason[] }) {
  const { t } = useI18n();
  const [seasonIndex, setSeasonIndex] = useState(0);

  const episodes = useMemo(() => (seasons[seasonIndex] ? getEpisodes(seasons[seasonIndex]) : []), [seasons, seasonIndex]);
  const movieSources = useMemo(() => getSources(media), [media]);

  const isMovie = kind === "movie";

  return (
    <section id="downloads" className="scroll-mt-24 overflow-hidden rounded-hero border border-white/10 bg-ink-900/70">
      <div className="flex items-center gap-3 border-b border-white/5 p-5 sm:p-6">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
          <ArrowDownToLine className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-fog-50">{isMovie ? t.details.downloadMovie : t.details.downloadEpisodes}</h2>
          <p className="text-sm text-fog-400">{isMovie ? t.details.downloadMovieHint : t.details.downloadEpisodesHint}</p>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {isMovie ? (
          <SourceLinks sources={movieSources} emptyTitle={t.details.noLinks} emptyBody={t.details.noLinksHint} />
        ) : !seasons.length ? (
          <EmptyState icon={Tv} title={t.details.noSeasons} description={t.details.noSeasonsHint} className="py-10" />
        ) : (
          <>
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-fog-500">{t.details.season}</span>
              <div className="flex flex-wrap gap-2">
                {seasons.map((season, index) => (
                  <button
                    key={season.id ?? index}
                    type="button"
                    onClick={() => setSeasonIndex(index)}
                    aria-pressed={index === seasonIndex}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      index === seasonIndex
                        ? "border-transparent bg-gradient-to-r from-brand-500 to-magenta-500 text-white"
                        : "border-white/12 bg-white/5 text-fog-200 hover:border-brand-400/50 hover:text-white",
                    )}
                  >
                    {getSeasonTitle(season, index)}
                  </button>
                ))}
              </div>
            </div>

          </>
        )}
        {!isMovie ? <SeriesEpisodeGuide media={media} episodes={episodes} selectedSeason={seasonIndex + 1} /> : null}
      </div>
    </section>
  );
}

export function MediaDetails({ kind, mediaId }: { kind: MediaKind; mediaId: number }) {
  const { t } = useI18n();
  const { media, isLoading, error, refetch } = useMediaDetails(kind, mediaId);
  const seasonsQuery = useSeasons(mediaId, kind === "series" && Boolean(media));
  const seasons = seasonsQuery.data ?? [];

  const inWatchlist = useLibraryStore((state) => state.watchlist.includes(mediaId));
  const addToWatchlist = useLibraryStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useLibraryStore((state) => state.removeFromWatchlist);

  if (isLoading) {
    return (
      <AppShell>
        <Container className="space-y-8 py-8">
          <Skeleton className="min-h-[60vh] rounded-hero" />
          <Skeleton className="h-64 rounded-hero" />
        </Container>
      </AppShell>
    );
  }

  if (error || !media) {
    return (
      <AppShell>
        <Container className="py-16">
          <EmptyState
            icon={ImageOff}
            title={error ? t.details.errorTitle : t.details.notFoundTitle}
            description={error?.message ?? t.details.notFoundBody}
            action={
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => refetch()}>
                  {t.actions.retry}
                </Button>
                <ButtonLink href="/" variant="outline">
                  <ChevronLeft className="size-4 rtl:rotate-180" />
                  {t.details.back}
                </ButtonLink>
              </div>
            }
          />
        </Container>
      </AppShell>
    );
  }

  const title = getTitle(media);
  const persian = isPersianText(title);
  const poster = getPoster(media);
  const cover = getCover(media);
  const rating = getRating(media);
  const year = getYear(media);
  const duration = getDuration(media);
  const classification = getClassification(media);
  const genres = getGenres(media);
  const countries = getCountries(media);
  const sources = getSources(media);
  const trailer = sources.find((source) => source.isTrailer);
  const parsed = parseDescription(media.description);
  const bestQuality = sources.find((source) => !source.isTrailer)?.quality;

  const meta = [
    year ? { icon: CalendarDays, value: year } : null,
    duration ? { icon: Clock3, value: duration } : null,
    classification ? { icon: Info, value: classification } : null,
  ].filter((item): item is { icon: typeof CalendarDays; value: string } => Boolean(item));

  return (
    <AppShell>
      <Container className="space-y-8 py-6 sm:py-8">
        <section className="relative isolate overflow-hidden rounded-hero border border-white/10 bg-ink-900">
          {cover || poster ? (
            <Image src={(cover ?? poster)!} alt="" fill priority unoptimized sizes="100vw" className="-z-20 object-cover object-center" />
          ) : null}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,6,11,.95)_0%,rgba(6,6,11,.82)_40%,rgba(6,6,11,.55)_100%)] rtl:bg-[linear-gradient(270deg,rgba(6,6,11,.95)_0%,rgba(6,6,11,.82)_40%,rgba(6,6,11,.55)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />

          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(200px,260px)_minmax(0,1fr)] lg:gap-12 lg:p-12">
            <div className="order-2 mx-auto w-full max-w-[240px] lg:order-1 lg:mx-0 lg:max-w-none">
              <div className="relative aspect-[2/3] overflow-hidden rounded-[1.75rem] bg-ink-800 shadow-[var(--shadow-lift)] sm:rounded-[2rem]">
                {poster ? (
                  <Image src={poster} alt={title} fill priority unoptimized sizes="260px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-fog-500">
                    <ImageOff className="size-8" />
                  </span>
                )}
              </div>
            </div>

            <div className="order-1 flex flex-col justify-center gap-5 lg:order-2">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="solid" className="uppercase">
                  {kind === "series" ? t.details.series : t.details.movie}
                </Badge>
                {bestQuality ? (
                  <Badge variant="gold" className="gap-1">
                    <SignalHigh className="size-3" />
                    {t.details.latestQuality}: {formatQuality(bestQuality)}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                <h1
                  lang={persian ? "fa" : "en"}
                  dir={persian ? "rtl" : "ltr"}
                  className="text-balance text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl"
                >
                  {title}
                </h1>
                {rating > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gold-300 tabular-nums">{rating.toFixed(1)}</span>
                    <RatingStars value={rating} />
                    <span className="text-xs uppercase tracking-widest text-fog-500">{t.details.rating}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fog-200">
                {meta.map(({ icon: Icon, value }) => (
                  <span key={value} className="inline-flex items-center gap-1.5">
                    <Icon className="size-4 text-fog-400" />
                    {value}
                  </span>
                ))}
                {countries.length ? <span className="text-fog-300">{countries.join(" · ")}</span> : null}
              </div>

              {genres.length ? (
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {parsed.overview ? (
                <p
                  lang={isPersianText(parsed.overview) ? "fa" : "en"}
                  dir={isPersianText(parsed.overview) ? "rtl" : "ltr"}
                  className="max-w-2xl text-sm leading-7 text-fog-300 sm:text-base"
                >
                  {parsed.overview}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <ButtonLink href="#downloads" size="lg">
                  <ArrowDownToLine className="size-4" />
                  {t.actions.download}
                </ButtonLink>
                {trailer ? (
                  <a
                    href={trailer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-semibold text-fog-100 transition hover:border-brand-400/70 hover:bg-white/5"
                  >
                    <Play className="size-4" fill="currentColor" />
                    {t.actions.watchTrailer}
                  </a>
                ) : null}
                <Button
                  variant="secondary"
                  size="icon"
                  aria-pressed={inWatchlist}
                  aria-label={inWatchlist ? t.bookmarks.remove : t.bookmarks.add}
                  onClick={() => (inWatchlist ? removeFromWatchlist(mediaId) : addToWatchlist(mediaId, media, kind))}
                  className={cn(inWatchlist && "border-brand-400/50 bg-brand-500/15 text-brand-200")}
                >
                  {inWatchlist ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {kind === "series" ? <SeriesEnrichment media={media} /> : null}

        {parsed.fields.length ? (
          <section className="rounded-hero border border-white/10 bg-ink-900/70 p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-fog-50">
              <Info className="size-[18px] text-brand-400" />
              {t.details.overview}
            </h2>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {parsed.fields.map((field) => (
                <div key={field.label} className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-fog-500">{field.label}</dt>
                  <dd
                    lang={isPersianText(field.value) ? "fa" : "en"}
                    dir={isPersianText(field.value) ? "rtl" : "ltr"}
                    className="mt-1 text-sm text-fog-200"
                  >
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <DownloadPanel kind={kind} media={media} seasons={seasons} />

        <a
          href="#content"
          className="inline-flex items-center gap-2 text-sm text-fog-400 transition hover:text-white"
        >
          <ChevronLeft className="size-4 rotate-90 rtl:rotate-90" />
          {t.details.back}
        </a>
      </Container>
    </AppShell>
  );
}
