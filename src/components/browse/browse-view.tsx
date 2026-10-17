"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Film, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MediaCard } from "@/components/media/media-card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualGrid } from "@/components/ui/virtual-grid";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGenres } from "@/hooks/use-genres";
import { format, useI18n } from "@/hooks/use-i18n";
import { useInfiniteMedia, type BrowseItem } from "@/hooks/use-infinite-media";
import { useMediaSearch } from "@/hooks/use-media-search";
import type { BrowseCategory, BrowseKind, BrowseSort } from "@/lib/browse-categories";
import { getMediaKind } from "@/lib/media";
import { getImdbTop250Rank, isInImdbTop250 } from "@/lib/imdb-top250";
import { cn } from "@/lib/utils";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";

const KINDS: BrowseKind[] = ["all", "movie", "series"];
const SORTS: BrowseSort[] = ["created", "imdb"];

const controlClass =
  "h-10 min-w-0 rounded-full border border-white/[0.08] bg-black/25 px-3.5 text-sm text-fog-100 outline-none transition hover:border-white/20 hover:bg-white/[0.06] focus:border-white/30 focus:ring-2 focus:ring-white/10 [&>option]:bg-ink-900";

export function BrowseView({ category }: { category: BrowseCategory }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<BrowseKind>(category.kind);
  const [sort, setSort] = useState<BrowseSort>(category.sort);
  const [genreId, setGenreId] = useState(0);

  const debounced = useDebouncedValue(query, 350);
  const searching = debounced.trim().length > 0;

  const list = useInfiniteMedia(kind, sort, category.genreId ?? genreId);
  const search = useMediaSearch(debounced);
  const genres = useGenres();
  const setSelectedMedia = useSelectedMediaStore((state) => state.setSelectedMedia);

  const items = useMemo<BrowseItem[]>(() => {
    const result = searching
      ? (search.data ?? [])
        .map((media) => ({ media, kind: getMediaKind(media) }))
        .filter((item) => (kind === "all" || item.kind === kind)
          && (!category.genreId || isInImdbTop250(item.media, item.kind))
          && (!genreId || (Array.isArray(item.media.genres) && item.media.genres.some((genre) => Number((genre as { id?: unknown }).id) === genreId))))
      : (list.data?.pages.flatMap((page) => page.items) ?? [])
      .filter((item) => (!category.genreId || isInImdbTop250(item.media, item.kind))
        && (!category.genreId || !genreId || (Array.isArray(item.media.genres) && item.media.genres.some((genre) => Number((genre as { id?: unknown }).id) === genreId))));
    return category.genreId
      ? result.sort((first, second) => getImdbTop250Rank(first.media, first.kind) - getImdbTop250Rank(second.media, second.kind))
      : result;
  }, [searching, search.data, list.data, kind, category.genreId, genreId]);

  const title = t.home[category.titleKey];
  const subtitle = t.home[category.subtitleKey];
  const loading = searching ? search.isLoading : list.isLoading;
  const error = searching ? search.error : list.error;
  const showSkeletons = loading && items.length === 0;

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = list;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const kindLabel = (value: BrowseKind) =>
    value === "movie" ? t.browse.movies : value === "series" ? t.browse.series : t.browse.allTypes;

  return (
    <AppShell>
      <Container className="space-y-6 py-6 sm:py-8">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-fog-400 transition hover:text-white"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t.browse.back}
          </Link>

          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-fog-50 sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-xl text-sm text-fog-400">{subtitle}</p>
            </div>
            {!showSkeletons && !error ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-fog-300">
                {format(t.browse.results, { count: items.length })}
              </span>
            ) : null}
          </header>
        </div>

        <div className="sticky top-[72px] z-30 -mx-4 px-2 py-2 sm:top-[72px] sm:mx-0 sm:px-0 sm:py-3">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[1.4rem] border border-white/[0.09] bg-black/45 shadow-xl backdrop-blur-xl sm:rounded-[1.6rem]">
          <div className="border-b border-white/[0.07] p-2.5 sm:p-3">
            <div className="relative w-full">
            <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-white/55" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={format(t.browse.searchPlaceholder, { category: title })}
              aria-label={t.browse.searchLabel}
              className="h-11 w-full rounded-full border border-white/[0.08] bg-black/25 ps-11 pe-11 text-sm text-fog-100 outline-none transition placeholder:text-white/40 hover:border-white/20 hover:bg-white/[0.05] focus:border-white/25 focus:bg-white/[0.06] focus:ring-4 focus:ring-white/[0.05] sm:h-12"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t.search.clear}
                className="absolute end-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-fog-400 transition hover:bg-white/[0.08] hover:text-white"
              >
                <X className="size-4" />
              </button>
            ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 p-2.5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 sm:p-3">
            <span className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-white/[0.08] bg-black/25 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 sm:self-end">
              <SlidersHorizontal className="size-3.5" /> {t.browse.filters}
            </span>

            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] font-medium text-white/45 sm:min-w-32">
              <span className="ps-3">{t.browse.type}</span>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as BrowseKind)}
                aria-label={t.browse.type}
                className={cn(controlClass, kind !== category.kind && "border-brand-400/35 bg-brand-500/[0.08]")}
              >
                {KINDS.map((value) => (
                  <option key={value} value={value}>
                    {kindLabel(value)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] font-medium text-white/45 sm:min-w-32">
              <span className="ps-3">{t.browse.sort}</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as BrowseSort)}
                aria-label={t.browse.sort}
                className={cn(controlClass, sort !== category.sort && "border-brand-400/35 bg-brand-500/[0.08]")}
              >
                {SORTS.map((value) => (
                  <option key={value} value={value}>
                    {value === "imdb" ? t.browse.sortImdb : t.browse.sortLatest}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] font-medium text-white/45 sm:min-w-36">
              <span className="ps-3">{t.browse.genre}</span>
              <select
                value={genreId}
                onChange={(event) => setGenreId(Number(event.target.value))}
                aria-label={t.browse.genre}
                disabled={searching}
                className={cn(controlClass, "w-full disabled:cursor-not-allowed disabled:opacity-40", genreId > 0 && "border-brand-400/35 bg-brand-500/[0.08]")}
              >
                <option value={0}>{t.browse.allGenres}</option>
                {(genres.data ?? []).map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.title ?? genre.name ?? `#${genre.id}`}
                  </option>
                ))}
              </select>
            </label>
            {genreId > 0 || kind !== category.kind || sort !== category.sort || query ? (
              <button type="button" onClick={() => { setQuery(""); setKind(category.kind); setSort(category.sort); setGenreId(0); }}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-end rounded-full border border-white/[0.08] bg-black/25 px-3 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
                <X className="size-3.5" />{t.browse.clearFilters}
              </button>
            ) : null}
          </div>
          {searching ? <div className="flex items-center gap-2 px-4 pb-3 text-xs text-white/45 sm:px-5"><Sparkles className="size-3.5 text-white/60" />{t.browse.searchingFor} <span className="max-w-[65%] truncate font-medium text-white/80">“{debounced.trim()}”</span></div> : null}
          </div>
        </div>

        {showSkeletons ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 12 }, (_, index) => (
              <Skeleton key={index} className="aspect-[2/3] rounded-card" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title={t.browse.loadError}
            description={error.message}
            retryLabel={t.actions.retry}
            onRetry={() => (searching ? search.refetch() : list.refetch())}
          />
        ) : items.length ? (
          <>
            <VirtualGrid
              items={items}
              getKey={(item, index) => `${item.kind}-${item.media.id}-${index}`}
              renderItem={({ media, kind: itemKind }) => (
                <MediaCard media={media} kind={itemKind} onSelect={() => setSelectedMedia(itemKind, media)} />
              )}
              estimateRowHeight={(columnWidth) => columnWidth * 1.5 + 96}
              onEndReached={searching ? undefined : loadMore}
            />

            {!searching && list.hasNextPage ? (
              <div className="flex justify-center pt-6">
                <Button variant="secondary" onClick={loadMore} loading={isFetchingNextPage}>
                  {isFetchingNextPage ? t.browse.loadingMore : t.browse.loadMore}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={searching ? Search : Film}
            title={t.browse.empty}
            description={t.browse.emptyHint}
          />
        )}
      </Container>
    </AppShell>
  );
}
