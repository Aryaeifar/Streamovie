import { Bookmark, Film, Home, Map, Star, TrendingUp, Tv, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/i18n";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavSection = { label: string; items: NavItem[] };

/** Grouped navigation rendered inside the desktop rail. */
export function sidebarNav(t: Dictionary): NavSection[] {
  return [
    {
      label: t.nav.menu,
      items: [
        { href: "/", label: t.nav.home, icon: Home },
        { href: "/browse/movies", label: t.nav.movies, icon: Film },
        { href: "/browse/series", label: t.nav.series, icon: Tv },
        { href: "/browse/trending", label: t.nav.trending, icon: TrendingUp },
        { href: "/countries", label: t.nav.countries, icon: Map },
      ],
    },
    {
      label: t.nav.library,
      items: [
        { href: "/browse/imdb-movies", label: t.footer.topRated, icon: Star },
        { href: "/bookmarks", label: t.nav.bookmarks, icon: Bookmark },
      ],
    },
  ];
}

/** Flat navigation used by the mobile bottom bar. */
export function mobileNav(t: Dictionary): NavItem[] {
  return [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/browse/movies", label: t.nav.movies, icon: Film },
    { href: "/browse/series", label: t.nav.series, icon: Tv },
    { href: "/browse/trending", label: t.nav.trending, icon: TrendingUp },
    { href: "/bookmarks", label: t.nav.bookmarks, icon: Bookmark },
  ];
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
