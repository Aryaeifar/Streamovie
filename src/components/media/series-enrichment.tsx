"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Award, CalendarDays, ChevronDown, Clapperboard, Clock3, Globe2, Play, Star, Tv } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n, format } from "@/hooks/use-i18n";
import { useSeriesEnrichment } from "@/hooks/use-series-enrichment";
import type { APIMedia } from "@/lib/api/types";
import type { OMDbEpisode } from "@/lib/api/omdb-api";
import { fetchOMDbSeason } from "@/lib/api/omdb-api";
import type { Episode, SourceLink } from "@/lib/media";

function dateLabel(value?: string | null, locale = "en") {
  if (!value || value === "N/A") return "";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = new Date(dateOnly ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(parsed);
}

function EpisodeGuide({ title, year, imdbId, selectedSeason, downloads, onWatch }: { title: string; year?: string; imdbId?: string; selectedSeason: number; downloads: Episode[]; onWatch: (source: SourceLink, title: string) => void }) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const seasonQuery = useQuery({
    queryKey: ["omdb", "season", imdbId ?? title, year, selectedSeason],
    queryFn: () => fetchOMDbSeason(title, selectedSeason, year, imdbId),
    enabled: isOpen && selectedSeason > 0,
    staleTime: 1000 * 60 * 60 * 24,
  });
  const metadata: OMDbEpisode[] = seasonQuery.data?.Episodes ?? [];
  const episodeCount = Math.max(downloads.length, metadata.length);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900/65">
      <button type="button" aria-expanded={isOpen} aria-controls="episode-guide-content" onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-4 p-5 text-start transition hover:bg-white/[0.025] sm:p-6">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300"><Tv className="size-5" /></span>
          <span className="min-w-0"><span className="block font-bold text-fog-50">{t.details.episodeGuide}</span><span className="mt-0.5 block text-xs text-fog-500">{t.details.season} {selectedSeason}{episodeCount ? ` · ${format(t.details.episodesCount, { count: episodeCount })}` : ""}</span></span>
        </span>
        <ChevronDown className={`size-5 shrink-0 text-fog-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen ? (
        <div id="episode-guide-content" className="border-t border-white/[0.07]">
          {seasonQuery.isLoading && !episodeCount ? <div className="space-y-3 p-5 sm:p-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div> : null}
          {!seasonQuery.isLoading && !episodeCount ? <p className="p-5 text-sm text-fog-400 sm:p-6">{seasonQuery.error ? t.details.episodesUnavailable : t.details.noOmdbEpisodes}</p> : null}
          {episodeCount ? (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
              {Array.from({ length: episodeCount }, (_, index) => {
                const download = downloads[index];
                const details = metadata.find((episode) => Number(episode.Episode) === index + 1) ?? metadata[index];
                const episodeNumber = Number(details?.Episode) || index + 1;
                const sources = download?.sources ?? [];
                const episodeTitle = details?.Title ?? download?.title ?? `${t.details.episode} ${episodeNumber}`;
                return (
                  <article key={details?.imdbID ?? download?.key ?? `${selectedSeason}-${episodeNumber}`} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-300">S{String(selectedSeason).padStart(2, "0")} · E{String(episodeNumber).padStart(2, "0")}</p>
                        <h3 className="mt-1 text-base font-semibold text-fog-100">{episodeTitle}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-fog-400">
                        {details?.Released && details.Released !== "N/A" ? <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{dateLabel(details.Released, locale)}</span> : null}
                        {details?.imdbRating && details.imdbRating !== "N/A" ? <span className="inline-flex items-center gap-1.5 text-gold-300"><Star className="size-3.5" fill="currentColor" />{details.imdbRating}</span> : null}
                      </div>
                    </div>
                    {sources.length ? <div className="mt-4 grid grid-cols-1 gap-2 border-t border-white/[0.06] pt-3 sm:grid-cols-2 lg:grid-cols-3">{sources.map((source) => <div key={`${source.id}-${source.url}`} className="flex min-w-0 items-center gap-2"><button type="button" onClick={() => onWatch(source, `${title} · ${t.details.season} ${selectedSeason} · ${t.details.episode} ${episodeNumber}: ${episodeTitle}`)} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 px-3 text-xs font-bold text-white transition hover:brightness-110"><Play className="size-3.5" fill="currentColor" />{t.actions.watchOnline}</button><a href={source.url} target="_blank" rel="noreferrer noopener" className="inline-flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-brand-400/20 bg-brand-500/[0.08] px-3 py-2 text-xs font-semibold text-brand-200 transition hover:border-brand-400/50 hover:bg-brand-500/[0.16]"><span className="flex min-w-0 items-center gap-2"><ArrowDownToLine className="size-3.5 shrink-0" /><span className="truncate">{source.quality}</span></span></a></div>)}</div> : <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-fog-500">{t.details.noLinks}</p>}
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function SeriesEnrichment({ media }: { media: APIMedia }) {
  const { t } = useI18n();
  const { omdb } = useSeriesEnrichment(media);
  const om = omdb.data;
  const ratings = om?.Ratings ?? [];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-brand-500/[0.08] via-ink-900/80 to-gold-400/[0.035] p-5 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -end-12 -top-16 size-48 rounded-full bg-brand-500/[0.10] blur-3xl" />
      <div className="relative flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300"><Clapperboard className="size-5" /></span>
        <h2 className="font-bold text-fog-50">{t.details.showInfo}</h2>
      </div>
      {omdb.isLoading ? <div className="relative mt-5 space-y-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div> : omdb.error ? <p className="relative mt-5 text-sm text-fog-400">{omdb.error.message.includes("OMDB_API_KEY") ? t.details.omdbKeyHint : t.details.omdbUnavailable}</p> : om?.Response === "True" ? (
        <div className="relative mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
          <div className="space-y-4">
            {om.Title ? <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-fog-100">{om.Title}</h3>{om.Year && om.Year !== "N/A" ? <span className="text-xs tabular-nums text-fog-500">{om.Year}</span> : null}{om.Rated && om.Rated !== "N/A" ? <Badge variant="soft" size="sm">{om.Rated}</Badge> : null}</div> : null}
            <div className="flex flex-wrap gap-2">
              {om.Country && om.Country !== "N/A" ? <Badge variant="outline" className="gap-1.5"><Globe2 className="size-3" />{om.Country}</Badge> : null}
              {om.Type && om.Type !== "N/A" ? <Badge variant="outline" className="capitalize">{om.Type}</Badge> : null}
              {om.Runtime && om.Runtime !== "N/A" ? <Badge variant="outline" className="gap-1.5"><Clock3 className="size-3" />{om.Runtime}</Badge> : null}
              {om.totalSeasons ? <Badge variant="outline">{format(t.details.seasonsCount, { count: Number(om.totalSeasons) })}</Badge> : null}
            </div>
            {om.Genre && om.Genre !== "N/A" ? <div className="flex flex-wrap gap-1.5">{om.Genre.split(", ").map((genre) => <Badge key={genre} variant="soft" size="sm">{genre}</Badge>)}</div> : null}
            {om.Language && om.Language !== "N/A" ? <p className="text-xs text-fog-500">{t.details.languages}: {om.Language}</p> : null}
            {om.Plot && om.Plot !== "N/A" ? <p className="text-sm leading-6 text-fog-300">{om.Plot}</p> : null}
            {om.Actors && om.Actors !== "N/A" ? <p className="text-xs leading-5 text-fog-400">{om.Actors}</p> : null}
            {om.Awards && om.Awards !== "N/A" ? <p className="flex items-start gap-2 border-t border-white/[0.06] pt-3 text-xs leading-5 text-fog-400"><Award className="mt-0.5 size-4 shrink-0 text-gold-300" />{om.Awards}</p> : null}
          </div>
          <aside className="rounded-2xl border border-white/[0.07] bg-black/10 p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-fog-500">{t.details.ratingsAndAwards}</h3>
            <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
              {om.imdbRating && om.imdbRating !== "N/A" ? <div><p className="text-3xl font-black tabular-nums text-gold-300">{om.imdbRating}<span className="ms-1 text-sm font-semibold text-fog-500">/10</span></p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-fog-500">IMDb</p></div> : null}
              {om.imdbVotes && om.imdbVotes !== "N/A" ? <p className="pb-0.5 text-xs text-fog-400">{om.imdbVotes} {t.details.votes}</p> : null}
            </div>
            {ratings.length ? <div className="mt-4 flex flex-wrap gap-2">{ratings.map((rating) => <span key={rating.Source} className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-xs"><span className="text-fog-500">{rating.Source}</span><span className="ms-2 font-bold text-fog-200">{rating.Value}</span></span>)}</div> : null}
            {om.Released && om.Released !== "N/A" ? <p className="mt-4 flex items-center gap-1.5 border-t border-white/[0.06] pt-3 text-xs text-fog-500"><CalendarDays className="size-3.5" />{om.Released}</p> : null}
          </aside>
        </div>
      ) : <p className="relative mt-5 text-sm text-fog-400">{om?.Error ?? t.details.omdbNoMatch}</p>}
    </section>
  );
}

export function SeriesEpisodeGuide({ media, episodes, selectedSeason, onWatch }: { media: APIMedia; episodes: Episode[]; selectedSeason: number; onWatch: (source: SourceLink, title: string) => void }) {
  const { omdb, title, year, imdbId } = useSeriesEnrichment(media);
  return <EpisodeGuide title={title} year={year} imdbId={imdbId} selectedSeason={selectedSeason} downloads={episodes} onWatch={onWatch} />;
}
