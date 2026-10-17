"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Clapperboard } from "lucide-react";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { SearchBar } from "@/components/layout/search-bar";
import { Container } from "@/components/ui/container";
import { useI18n } from "@/hooks/use-i18n";
import { useLibraryStore } from "@/stores/use-library-store";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const savedCount = useLibraryStore((state) => state.watchlist.length);
  const bookmarksActive = pathname === "/bookmarks";

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <Container>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 py-3">
          <Link href="/" className="order-1 flex shrink-0 items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-magenta-500 text-white shadow-lg shadow-brand-700/30">
              <Clapperboard className="size-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-fog-50">{t.brand.name}</span>
          </Link>

          <div className="order-3 w-full md:order-2 md:ms-auto md:w-72 lg:w-80">
            <SearchBar />
          </div>

          <div className="order-2 ms-auto flex items-center gap-2 md:order-3 md:ms-0">
            <LanguageToggle className="hidden sm:inline-flex" />
            <Link
              href="/bookmarks"
              aria-label={t.nav.bookmarks}
              className={cn(
                "relative inline-flex size-10 items-center justify-center rounded-full border transition",
                bookmarksActive
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
          </div>
        </div>
      </Container>
    </header>
  );
}
