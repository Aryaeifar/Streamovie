"use client";

import Link from "next/link";
import { ArrowUp, Clapperboard } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useI18n } from "@/hooks/use-i18n";

type FooterLink = { href: string; label: string };

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-fog-500">{title}</h3>
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="text-fog-300 transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const browseLinks: FooterLink[] = [
    { href: "/", label: t.nav.home },
    { href: "/#movies", label: t.nav.movies },
    { href: "/#series", label: t.nav.series },
    { href: "/#trending", label: t.nav.trending },
    { href: "/bookmarks", label: t.nav.bookmarks },
  ];

  const topRatedLinks: FooterLink[] = [
    { href: "/browse/trending", label: t.home.trending },
    { href: "/browse/imdb-movies", label: t.home.imdbMovies },
    { href: "/browse/imdb-series", label: t.home.imdbSeries },
  ];

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/[0.06] bg-ink-950/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-48"
        style={{
          backgroundImage:
            "radial-gradient(42rem 20rem at 50% 0%, rgb(var(--theme-glow-1) / 0.14), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent"
      />

      <Container className="relative py-12 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-8">
          <div className="max-w-sm space-y-4 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-magenta-500 text-white shadow-lg shadow-brand-700/30">
                <Clapperboard className="size-5" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-fog-50">{t.brand.name}</span>
            </Link>
            <p className="text-sm leading-relaxed text-fog-400">{t.footer.description}</p>
          </div>

          <FooterColumn title={t.footer.sections} links={browseLinks} />
          <FooterColumn title={t.footer.topRated} links={topRatedLinks} />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-xs text-fog-500 sm:flex-row sm:items-center sm:gap-4">
            <p>
              © {year} {t.brand.name}. {t.footer.rights}
            </p>
            <p>{t.footer.disclaimer}</p>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-fog-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowUp className="size-3.5" />
            {t.footer.backToTop}
          </button>
        </div>
      </Container>
    </footer>
  );
}
