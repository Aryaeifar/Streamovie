"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Clapperboard, Film, Home, Search, Star, TrendingUp, Tv } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { isNavActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const items = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/browse/trending", label: t.nav.trending, icon: TrendingUp },
    { href: "/bookmarks", label: t.nav.bookmarks, icon: Bookmark },
    { href: "/browse/movies", label: t.nav.movies, icon: Film },
    { href: "/browse/series", label: t.nav.series, icon: Tv },
    { href: "/browse/imdb-movies", label: t.footer.topRated, icon: Star },
  ];

  return (
    <aside className="fixed inset-y-0 start-0 z-50 hidden w-[72px] flex-col items-center border-e border-white/[0.07] bg-ink-950/95 py-5 backdrop-blur-2xl lg:flex">
      <Link
        href="/"
        aria-label={t.brand.name}
        title={t.brand.name}
        className="mb-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white shadow-lg transition hover:border-brand-400/40 hover:text-brand-400"
      >
        <Clapperboard className="size-[19px]" />
      </Link>

      <nav aria-label={t.nav.menu} className="no-scrollbar flex w-full flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-2">
        <Link
          href="/browse/movies"
          title={t.search.label}
          aria-label={t.search.label}
          className="group relative mb-1 flex size-11 shrink-0 items-center justify-center rounded-xl text-fog-400 transition hover:bg-white/[0.07] hover:text-white"
        >
          <Search className="size-[20px] transition group-hover:scale-105" />
        </Link>
        {items.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex size-11 shrink-0 items-center justify-center rounded-xl text-fog-400 transition duration-200 hover:bg-white/[0.07] hover:text-white",
                active && "text-white",
              )}
            >
              {active ? <span aria-hidden className="absolute inset-0 rounded-xl bg-white/[0.10]" /> : null}
              {active ? <span aria-hidden className="absolute -start-2 h-5 w-[3px] rounded-full bg-brand-400 shadow-glow" /> : null}
              <Icon className="relative size-[20px] transition group-hover:scale-105" strokeWidth={active ? 2.4 : 2} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
