"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ExternalLink, Globe2, Languages, Radio, Search, Tv, Youtube } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n, format } from "@/hooks/use-i18n";
import { tvApi, type TVChannel, type TVCountry } from "@/lib/api/tv-api";
import { cn } from "@/lib/utils";

function countryFlag(code: string) {
  return String.fromCodePoint(...Array.from(code.toUpperCase(), (character) => character.charCodeAt(0) + 127397));
}

function externalSource(url: string) {
  return /^https?:\/\//i.test(url);
}

function channelSources(channel: TVChannel) {
  return [
    ...[...(channel.sources?.streams ?? []), ...(channel.iptv_urls ?? [])].map((url) => ({ url, type: "iptv" as const })),
    ...[...(channel.sources?.youtube ?? []), ...(channel.youtube_urls ?? [])].map((url) => ({ url, type: "youtube" as const })),
  ].filter((source) => externalSource(source.url));
}

export function LiveTvView() {
  const { t } = useI18n();
  const [selectedCountry, setSelectedCountry] = useState<TVCountry | null>(null);
  const [query, setQuery] = useState("");
  const countriesQuery = useQuery({ queryKey: ["tv-garden", "countries"], queryFn: () => tvApi.fetchCountries() });
  const channelsQuery = useQuery({
    queryKey: ["tv-garden", "channels", selectedCountry?.code],
    queryFn: () => tvApi.fetchChannels(selectedCountry!.code),
    enabled: Boolean(selectedCountry),
  });

  const filteredCountries = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return (countriesQuery.data ?? []).filter((country) =>
      !search || `${country.country} ${country.code}`.toLocaleLowerCase().includes(search),
    );
  }, [countriesQuery.data, query]);

  const filteredChannels = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return (channelsQuery.data ?? []).filter((channel) =>
      !search || `${channel.name} ${channel.language ?? ""}`.toLocaleLowerCase().includes(search),
    );
  }, [channelsQuery.data, query]);

  const openCountry = (country: TVCountry) => {
    setSelectedCountry(country);
    setQuery("");
  };

  const backToCountries = () => {
    setSelectedCountry(null);
    setQuery("");
  };

  return (
    <AppShell>
      <Container className="space-y-7 py-6 sm:py-8">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-brand-500/[0.16] via-white/[0.035] to-magenta-500/[0.10] p-5 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -end-12 -top-16 size-64 rounded-full bg-brand-500/10 blur-3xl" />
          {selectedCountry ? (
            <button type="button" onClick={backToCountries} className="relative mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-fog-300 transition hover:text-white">
              <ArrowLeft className="size-4 rtl:rotate-180" /> {t.liveTv.chooseCountry}
            </button>
          ) : null}
          <div className="relative flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-brand-200 shadow-lg sm:size-16">
              {selectedCountry ? <span className="text-4xl">{countryFlag(selectedCountry.code)}</span> : <Radio className="size-7" />}
            </span>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-200"><Globe2 className="size-3.5" />{t.nav.liveTv}</div>
              <h1 className="truncate text-3xl font-black tracking-tight text-fog-50 sm:text-4xl">{selectedCountry?.country ?? t.liveTv.title}</h1>
              <p className="mt-1 text-sm text-fog-300">{selectedCountry ? format(t.liveTv.channels, { count: channelsQuery.data?.length ?? 0 }) : t.liveTv.subtitle}</p>
            </div>
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-brand-300" />
          <input value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={selectedCountry ? t.liveTv.searchChannels : t.liveTv.searchCountries}
            aria-label={selectedCountry ? t.liveTv.searchChannels : t.liveTv.searchCountries}
            className="h-12 w-full rounded-2xl border border-white/[0.09] bg-ink-950/55 ps-11 pe-11 text-sm text-fog-100 outline-none transition placeholder:text-fog-500 hover:border-white/15 focus:border-brand-400/60 focus:ring-4 focus:ring-brand-500/10 sm:h-[52px]" />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label={t.search.clear} className="absolute end-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-fog-400 transition hover:bg-white/[0.08] hover:text-white">×</button> : null}
        </div>

        {!selectedCountry ? (
          countriesQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 12 }, (_, index) => <Skeleton key={index} className="h-32 rounded-3xl" />)}
            </div>
          ) : countriesQuery.error ? (
            <ErrorState title={t.liveTv.loadCountriesError} description={countriesQuery.error.message} retryLabel={t.actions.retry} onRetry={() => void countriesQuery.refetch()} />
          ) : filteredCountries.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {filteredCountries.map((country, index) => (
                <button key={country.code} type="button" onClick={() => openCountry(country)}
                  className={cn("group relative flex min-h-32 flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 text-start transition duration-300 hover:-translate-y-1 hover:border-brand-400/40 hover:shadow-[var(--shadow-lift)] sm:min-h-36 sm:p-5", index % 5 === 1 && "from-brand-500/[0.13]", index % 5 === 3 && "from-magenta-500/[0.12]")}>
                  <span aria-hidden className="absolute -end-4 -top-6 text-7xl opacity-[0.09] transition group-hover:scale-110 group-hover:opacity-20">{countryFlag(country.code)}</span>
                  <span className="relative text-4xl drop-shadow-lg">{countryFlag(country.code)}</span>
                  <span className="relative flex w-full items-end justify-between gap-2">
                    <span className="min-w-0"><span className="block truncate text-sm font-bold text-fog-50 sm:text-base">{country.country}</span><span className="mt-1 block text-[11px] uppercase tracking-wider text-fog-500">{country.code}</span></span>
                    <Tv className="mb-1 size-4 shrink-0 text-fog-500 transition group-hover:text-brand-300" />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={Globe2} title={t.liveTv.noCountries} />
          )
        ) : channelsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="h-56 rounded-3xl" />)}
          </div>
        ) : channelsQuery.error ? (
          <ErrorState title={t.liveTv.loadChannelsError} description={channelsQuery.error.message} retryLabel={t.actions.retry} onRetry={() => void channelsQuery.refetch()} />
        ) : filteredChannels.length ? (
          <>
            <div className="flex items-center justify-between gap-3 text-sm text-fog-400">
              <span>{format(t.liveTv.channels, { count: filteredChannels.length })}</span>
              <span className="hidden items-center gap-1.5 text-xs sm:inline-flex"><ExternalLink className="size-3.5" />{t.liveTv.openSource}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {filteredChannels.map((channel, index) => {
                const sources = channelSources(channel);
                const logo = typeof channel.logo === "string" ? channel.logo : typeof channel.logo_url === "string" ? channel.logo_url : "";
                return (
                  <article key={channel.nanoid ?? `${channel.name}-${index}`} className="group flex min-h-56 flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-white/[0.015] p-4 transition hover:border-white/[0.14] sm:p-5">
                    <div className="flex items-center gap-3">
                      <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-800 text-brand-300">
                        {logo.startsWith("http") ? <Image src={logo} alt="" fill unoptimized sizes="48px" className="object-contain p-1" /> : <Tv className="size-5" />}
                      </span>
                      <div className="min-w-0"><h2 className="truncate font-bold text-fog-100">{channel.name}</h2>{channel.languages?.length || channel.language ? <p className="mt-1 flex items-center gap-1 text-xs text-fog-500"><Languages className="size-3" />{channel.languages?.join(", ") ?? channel.language}</p> : null}</div>
                    </div>
                    {channel.isGeoBlocked ? <span className="mt-4 inline-flex w-fit rounded-full border border-gold-400/20 bg-gold-400/[0.07] px-2.5 py-1 text-[10px] font-medium text-gold-300">{t.liveTv.geoBlocked}</span> : <span className="mt-4 text-xs text-fog-500">{t.liveTv.channel}</span>}
                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      {sources.slice(0, 4).map((source, sourceIndex) => (
                        <a key={`${source.type}-${sourceIndex}`} href={source.url} target="_blank" rel="noreferrer noopener"
                          aria-label={`${source.type === "youtube" ? t.liveTv.watchYoutube : t.liveTv.watchIptv}: ${channel.name}`}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-2 text-xs font-semibold text-fog-200 transition hover:border-brand-400/30 hover:bg-brand-500/10 hover:text-white">
                          {source.type === "youtube" ? <Youtube className="size-4 text-rose-300" /> : <Radio className="size-4 text-brand-300" />}
                          {source.type === "youtube" ? t.liveTv.watchYoutube : t.liveTv.watchIptv}
                        </a>
                      ))}
                      {!sources.length ? <span className="text-xs text-fog-500">{t.liveTv.noChannels}</span> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState icon={query ? Search : Tv} title={query ? t.liveTv.noSearchResults : t.liveTv.noChannels} />
        )}
      </Container>
    </AppShell>
  );
}
