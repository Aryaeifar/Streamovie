"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Film, Search, SlidersHorizontal, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";

const KINDS: BrowseKind[] = ["all", "movie", "series"];
const SORTS: BrowseSort[] = ["created", "imdb"];

const controlClass =
  "h-11 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 text-sm text-fog-100 outline-none transition hover:border-white/20 focus:border-brand-400/60 focus:bg-white/[0.09]";

export function BrowseView({ category }: { category: BrowseCategory }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<BrowseKind>(category.kind);
  const [sort, setSort] = useState<BrowseSort>(category.sort);
  const [genreId, setGenreId] = useState(0);

  const debounced = useDebouncedValue(query, 350);
  const searching = debounced.trim().length > 0;

  const list = useInfiniteMedia(kind, sort, genreId);
  const search = useMediaSearch(debounced);
  const genres = useGenres();
  const setSelectedMedia = useSelectedMediaStore((state) => state.setSelectedMedia);

  const items = useMemo<BrowseItem[]>(() => {
    if (searching) {
      return (search.data ?? [])
        .map((media) => ({ media, kind: getMediaKind(media) }))
        .filter((item) => kind === "all" || item.kind === kind);
    }
    return list.data?.pages.flatMap((page) => page.items) ?? [];
  }, [searching, search.data, list.data, kind]);

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

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-fog-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={format(t.browse.searchPlaceholder, { category: title })}
              aria-label={t.browse.searchLabel}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] ps-10 pe-10 text-sm text-fog-100 outline-none transition placeholder:text-fog-500 hover:border-white/20 focus:border-brand-400/60 focus:bg-white/[0.09]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t.search.clear}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-fog-400 transition hover:text-white"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-fog-500">
              <SlidersHorizontal className="size-3.5" />
              {t.browse.filters}
            </span>

            <label className="inline-flex items-center gap-2 text-xs text-fog-400">
              <span className="hidden sm:inline">{t.browse.type}</span>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as BrowseKind)}
                aria-label={t.browse.type}
                className={controlClass}
              >
                {KINDS.map((value) => (
                  <option key={value} value={value}>
                    {kindLabel(value)}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-xs text-fog-400">
              <span className="hidden sm:inline">{t.browse.sort}</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as BrowseSort)}
                aria-label={t.browse.sort}
                className={controlClass}
              >
                {SORTS.map((value) => (
                  <option key={value} value={value}>
                    {value === "imdb" ? t.browse.sortImdb : t.browse.sortLatest}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-xs text-fog-400">
              <span className="hidden sm:inline">{t.browse.genre}</span>
              <select
                value={genreId}
                onChange={(event) => setGenreId(Number(event.target.value))}
                aria-label={t.browse.genre}
                disabled={searching}
                className={cn(controlClass, "max-w-[12rem] disabled:cursor-not-allowed disabled:opacity-50")}
              >
                <option value={0}>{t.browse.allGenres}</option>
                {(genres.data ?? []).map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.title ?? genre.name ?? `#${genre.id}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {showSkeletons ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
