"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bookmark, Clapperboard, Menu, X } from "lucide-react";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { SearchBar } from "@/components/layout/search-bar";
import { Container } from "@/components/ui/container";
import { useI18n } from "@/hooks/use-i18n";
import { useLibraryStore } from "@/stores/use-library-store";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const savedCount = useLibraryStore((state) => state.watchlist.length);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/#movies", label: t.nav.movies },
    { href: "/#series", label: t.nav.series },
    { href: "/#trending", label: t.nav.trending },
  ];

  const isActive = (href: string) => (href.startsWith("/#") ? false : pathname === href);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <Container>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 py-3">
          <Link href="/" className="order-1 flex shrink-0 items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-magenta-500 text-white shadow-lg shadow-brand-700/30">
              <Clapperboard className="size-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-fog-50">{t.brand.name}</span>
          </Link>

          <nav aria-label={t.nav.home} className="order-4 hidden items-center gap-1 lg:order-2 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive(link.href) ? "bg-white/[0.06] text-white" : "text-fog-300 hover:bg-white/5 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="order-2 ms-auto flex items-center gap-2 md:order-4">
            <LanguageToggle className="hidden sm:inline-flex" />
            <Link
              href="/bookmarks"
              aria-label={t.nav.bookmarks}
              className={cn(
                "relative inline-flex size-10 items-center justify-center rounded-full border transition",
                isActive("/bookmarks")
                  ? "border-brand-400/50 bg-brand-500/15 text-brand-200"
                  : "border-white/10 bg-white/5 text-fog-200 hover:bg-white/10 hover:text-white",
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
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? t.actions.close : t.nav.menu}
              aria-expanded={menuOpen}
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-fog-200 transition hover:bg-white/10 hover:text-white lg:hidden"
            >
              {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          </div>

          <div className="order-3 w-full md:ms-auto md:w-72 lg:order-3 lg:w-80">
            <SearchBar />
          </div>
        </div>

        {menuOpen ? (
          <nav aria-label={t.nav.home} className="flex flex-col gap-1 pb-4 lg:hidden">
            {[...links, { href: "/bookmarks", label: t.nav.bookmarks }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-fog-200 transition hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <LanguageToggle className="mt-2 self-start sm:hidden" />
          </nav>
        ) : null}
      </Container>
    </header>
  );
}
