"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { Bookmark, Clapperboard, ChevronDown, CircleUserRound } from "lucide-react";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { SearchBar } from "@/components/layout/search-bar";
import { useI18n } from "@/hooks/use-i18n";
import { useLibraryStore } from "@/stores/use-library-store";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const savedCount = useLibraryStore((state) => state.watchlist.length);
  const bookmarksActive = pathname === "/bookmarks";
  const isHome = pathname === "/";
  const [activeSection, setActiveSection] = useState("featured");

  useEffect(() => {
    if (!isHome) return;
    const sectionIds = ["featured", "trending", "movies", "series", "imdb-movies", "imdb-series"];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => Math.abs(first.boundingClientRect.top) - Math.abs(second.boundingClientRect.top));
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.1, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHome]);

  if (isHome) {
    const tabs = [
      ["featured", t.home.featured],
      ["trending", t.home.trending],
      ["movies", t.home.movies],
      ["series", t.home.seriesRow],
      ["imdb-movies", t.home.imdbMovies],
      ["imdb-series", t.home.imdbSeries],
    ];

    return (
      <header
        className="pointer-events-none fixed inset-x-0 top-3 z-40 h-[64px] w-full px-2 sm:px-4 lg:px-6"
      >
        <LayoutGroup id="landing-section-tabs">
          <nav
            aria-label={t.nav.menu}
            className="pointer-events-auto absolute left-1/2 top-1/2 grid w-[calc(100%-1rem)] max-w-[960px] -translate-x-1/2 -translate-y-1/2 grid-cols-3 gap-1 rounded-[1.35rem] border border-white/[0.09] bg-black/35 p-1.5 shadow-xl backdrop-blur-xl md:flex md:justify-between md:rounded-full"
          >
            {tabs.map(([sectionId, label]) => {
              const active = activeSection === sectionId;
              return (
                <motion.button
                  key={sectionId}
                  type="button"
                  aria-current={active ? "location" : undefined}
                  onClick={() => {
                    setActiveSection(sectionId);
                    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "relative min-w-0 rounded-full px-2 py-2 text-center text-sm font-bold leading-tight transition-colors md:flex-1 md:px-3 md:py-2",
                    active ? "text-[#111]" : "text-white/65 hover:text-white",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="landing-section-bubble"
                      initial={false}
                      transition={{ type: "spring", stiffness: 520, damping: 30, mass: 0.65, bounce: 0.28 }}
                      className="absolute inset-0 rounded-full bg-white shadow-sm"
                    />
                  ) : null}
                  <span className="relative z-10">{label}</span>
                </motion.button>
              );
            })}
          </nav>
        </LayoutGroup>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="relative mx-auto flex min-h-[72px] w-full max-w-[1720px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label={t.brand.name} className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-lg bg-brand-500 text-ink-950">
            <Clapperboard className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white">{t.brand.name}</span>
        </Link>
        <div className="ms-auto flex w-full max-w-xl shrink-0 items-center gap-2.5">
          <div className="min-w-0 flex-1"><SearchBar /></div>
          <LanguageToggle className="hidden sm:inline-flex" />
          <Link
            href="/bookmarks"
            aria-label={t.nav.bookmarks}
            className={cn(
              "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-fog-200 transition hover:bg-white/10 hover:text-white",
              bookmarksActive && "border-brand-400/50 bg-brand-500/15 text-brand-200",
            )}
          >
            <Bookmark className="size-[18px]" />
            {savedCount > 0 ? (
              <span className="absolute -end-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {savedCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            aria-label="Profile"
            className="hidden size-10 items-center justify-center gap-1 rounded-full text-fog-300 transition hover:bg-white/10 hover:text-white sm:flex"
          >
            <CircleUserRound className="size-6" />
            <ChevronDown className="size-3" />
          </button>
        </div>
      </div>
    </header>
  );
}
