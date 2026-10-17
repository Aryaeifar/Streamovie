"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, Globe2, ImageOff, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Container } from "@/components/ui/container";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api/media-api";

function useCountries() {
  return useQuery({ queryKey: ["streamovie", "countries"], queryFn: () => mediaApi.fetchCountries() });
}

export function CountriesView() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const countriesQuery = useCountries();
  const countries = countriesQuery.data ?? [];
  const filtered = useMemo(() => countries.filter((country) =>
    country.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  ), [countries, query]);

  return (
    <AppShell>
      <Container className="space-y-7 py-6 sm:py-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
            <Globe2 className="size-4" /> {t.nav.countries}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-fog-50 sm:text-4xl">{t.countries.title}</h1>
          <p className="max-w-xl text-sm text-fog-400">{t.countries.subtitle}</p>
        </header>

        <div className="sticky top-[72px] z-30 -mx-4 px-2 py-2 sm:top-[72px] sm:mx-0 sm:px-0 sm:py-3">
          <div className="relative mx-auto max-w-5xl rounded-full border border-white/[0.09] bg-black/45 p-1.5 shadow-xl backdrop-blur-xl">
          <Search className="pointer-events-none absolute start-5 top-1/2 size-4 -translate-y-1/2 text-white/55" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.countries.search}
            aria-label={t.countries.search}
            className="h-10 w-full rounded-full border border-white/[0.08] bg-black/25 ps-11 pe-4 text-sm text-fog-100 outline-none transition placeholder:text-white/40 hover:border-white/20 hover:bg-white/[0.05] focus:border-white/25 focus:bg-white/[0.06] focus:ring-4 focus:ring-white/[0.05] sm:h-11" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {countriesQuery.isLoading ? Array.from({ length: 10 }, (_, index) => <div key={index} className="min-h-36 animate-pulse rounded-3xl border border-white/[0.08] bg-white/[0.04] sm:min-h-40" />) : null}
          {countriesQuery.error ? <div className="col-span-full"><p className="mb-3 text-sm text-rose-300">{countriesQuery.error.message}</p><button type="button" onClick={() => void countriesQuery.refetch()} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-fog-100">{t.actions.retry}</button></div> : null}
          {filtered.map((country, index) => (
            <Link key={country.id} href={`/countries/${country.id}`}
              className={cn("group relative flex min-h-36 flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 transition duration-300 hover:-translate-y-1 hover:border-brand-400/40 hover:shadow-[var(--shadow-lift)] sm:min-h-40 sm:p-5", index % 5 === 1 && "from-brand-500/[0.13]", index % 5 === 3 && "from-magenta-500/[0.12]")}>
              <span aria-hidden className="absolute -end-5 -top-8 text-8xl opacity-[0.10] blur-[1px] transition group-hover:scale-110 group-hover:opacity-20">🌐</span>
              <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                {country.image ? <Image src={country.image} alt="" fill unoptimized sizes="48px" className="object-cover" /> : <ImageOff className="size-5 text-fog-500" />}
              </span>
              <span className="relative flex items-end justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-fog-50 sm:text-base">{country.title}</span>
                  <span className="mt-1 block text-[11px] uppercase tracking-wider text-fog-500">{t.nav.countries}</span>
                </span>
                <ArrowRight className="mb-1 size-4 shrink-0 text-fog-500 transition group-hover:translate-x-1 group-hover:text-brand-300 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
        {filtered.length === 0 ? <p className="py-10 text-center text-sm text-fog-400">{t.countries.empty}</p> : null}
      </Container>
    </AppShell>
  );
}
