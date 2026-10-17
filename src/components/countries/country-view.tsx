"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Film, Globe2, Tv } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MediaCard } from "@/components/media/media-card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualGrid } from "@/components/ui/virtual-grid";
import { useCountryMedia } from "@/hooks/use-country-media";
import { format, useI18n } from "@/hooks/use-i18n";
import { useQuery } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api/media-api";
import type { Country } from "@/lib/countries";
import type { BrowseKind } from "@/lib/browse-categories";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";

export function CountryView({ countryId }: { countryId: number }) {
  const { t } = useI18n();
  const [kind, setKind] = useState<BrowseKind>("all");
  const countriesQuery = useQuery({ queryKey: ["streamovie", "countries"], queryFn: () => mediaApi.fetchCountries() });
  const country = countriesQuery.data?.find((item) => item.id === countryId);
  const query = useCountryMedia(countryId, kind);
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const setSelectedMedia = useSelectedMediaStore((state) => state.setSelectedMedia);
  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);
  if (!countriesQuery.isLoading && !countriesQuery.error && !country) notFound();
  const title = country?.title ?? "";

  return (
    <AppShell>
      <Container className="space-y-6 py-6 sm:py-8">
        <Link href="/countries" className="inline-flex items-center gap-1.5 text-sm font-medium text-fog-400 transition hover:text-white">
          <ArrowLeft className="size-4 rtl:rotate-180" /> {t.countries.title}
        </Link>
        <header className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 sm:p-7">
          {country?.image ? <span className="relative size-16 overflow-hidden rounded-2xl border border-white/10 sm:size-20"><Image src={country.image} alt="" fill unoptimized sizes="80px" className="object-cover" /></span> : <span className="text-6xl drop-shadow-lg sm:text-7xl">🌐</span>}
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300"><Globe2 className="size-3.5" />{t.nav.countries}</div>
            <h1 className="text-3xl font-black tracking-tight text-fog-50 sm:text-4xl">{countriesQuery.isLoading ? t.common.loading : title}</h1>
            <p className="mt-1 text-sm text-fog-400">{t.countries.subtitle}</p>
          </div>
        </header>

        <div className="flex flex-wrap gap-2" aria-label={t.browse.type}>
          {(["all", "movie", "series"] as BrowseKind[]).map((value) => {
            const active = kind === value;
            const label = value === "all" ? t.countries.all : value === "movie" ? t.browse.movies : t.browse.series;
            const Icon = value === "movie" ? Film : value === "series" ? Tv : Globe2;
            return <button key={value} type="button" onClick={() => setKind(value)} aria-pressed={active}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${active ? "border-brand-400/40 bg-brand-500/20 text-white" : "border-white/10 bg-white/[0.04] text-fog-400 hover:bg-white/[0.08] hover:text-white"}`}>
              <Icon className="size-4" />{label}
            </button>;
          })}
          {query.data ? <span className="ms-auto self-center text-sm text-fog-400">{format(t.browse.results, { count: items.length })}</span> : null}
        </div>

        {query.isLoading ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-card" />)}</div>
          : query.error ? <ErrorState title={t.browse.loadError} description={query.error.message} retryLabel={t.actions.retry} onRetry={() => void query.refetch()} />
            : items.length ? <>
              <VirtualGrid items={items} getKey={(item, index) => `${item.kind}-${item.media.id}-${index}`}
                renderItem={({ media, kind: mediaKind }) => <MediaCard media={media} kind={mediaKind} onSelect={() => setSelectedMedia(mediaKind, media)} />}
                estimateRowHeight={(columnWidth) => columnWidth * 1.5 + 96} onEndReached={loadMore} />
              {query.hasNextPage ? <div className="flex justify-center pt-6"><Button variant="secondary" onClick={loadMore} loading={query.isFetchingNextPage}>{query.isFetchingNextPage ? t.browse.loadingMore : t.browse.loadMore}</Button></div> : null}
            </> : <EmptyState icon={Film} title={t.countries.empty} description={t.browse.emptyHint} />}
      </Container>
    </AppShell>
  );
}
