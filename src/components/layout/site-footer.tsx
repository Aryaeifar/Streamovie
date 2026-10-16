import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useI18n } from "@/hooks/use-i18n";

export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/[0.06] bg-ink-950/60">
      <Container className="py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-magenta-500 text-white">
                <Clapperboard className="size-[18px]" />
              </span>
              <span className="font-extrabold tracking-tight text-fog-50">{t.brand.name}</span>
            </div>
            <p className="text-sm text-fog-400">{t.brand.tagline}</p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-widest text-fog-500">{t.footer.sections}</span>
            <Link href="/#movies" className="text-fog-300 transition hover:text-white">{t.nav.movies}</Link>
            <Link href="/#series" className="text-fog-300 transition hover:text-white">{t.nav.series}</Link>
            <Link href="/#trending" className="text-fog-300 transition hover:text-white">{t.nav.trending}</Link>
            <Link href="/bookmarks" className="text-fog-300 transition hover:text-white">{t.nav.bookmarks}</Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-xs text-fog-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t.brand.name}. {t.footer.rights}
          </p>
          <p>{t.footer.disclaimer}</p>
        </div>
      </Container>
    </footer>
  );
}
