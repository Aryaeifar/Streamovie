"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Bookmark, BookmarkCheck, Heart, Play, Plus } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useLibraryHydrated } from "@/hooks/use-library-hydrated";
import { getCover, getGenres, getPoster, getTitle, getYear, parseDescription, type MediaKind } from "@/lib/media";
import { isPersianText } from "@/lib/text";
import type { APIMedia } from "@/lib/api/types";
import { useLibraryStore } from "@/stores/use-library-store";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";
import { cn } from "@/lib/utils";

export type HeroItem = { media: APIMedia; kind: MediaKind };

const roundAction =
  "inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-ink-950/40 text-white backdrop-blur-md transition hover:border-white/35 hover:bg-white/15";

export function SpotlightHero({ items }: { items: HeroItem[] }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const hydrated = useLibraryHydrated();
  const setSelectedMedia = useSelectedMediaStore((state) => state.setSelectedMedia);
  const watchlist = useLibraryStore((state) => state.watchlist);
  const addToWatchlist = useLibraryStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useLibraryStore((state) => state.removeFromWatchlist);
  const likes = useLibraryStore((state) => state.likes);
  const toggleLike = useLibraryStore((state) => state.toggleLike);

  const spotlight = items.slice(0, 5);
  if (!spotlight.length) return null;

  const safeIndex = Math.min(index, spotlight.length - 1);
  const { media, kind } = spotlight[safeIndex];

  const title = getTitle(media);
  const backdrop = getCover(media) ?? getPoster(media);
  const year = getYear(media);
  const genres = getGenres(media).slice(0, 3);
  const overview = parseDescription(media.description).overview;
  const href = `/${kind === "movie" ? "movies" : "series"}/${media.id}`;
  const saved = hydrated && watchlist.includes(media.id);
  const liked = hydrated && likes.includes(media.id);

  return (
    <section className="relative isolate min-h-[85svh] w-full overflow-hidden bg-ink-950">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${kind}-${media.id}`}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0 -z-20"
        >
          {backdrop ? (
            <Image src={backdrop} alt="" fill priority unoptimized sizes="100vw" className="object-cover object-center" />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,6,11,.97)_0%,rgba(6,6,11,.9)_30%,rgba(6,6,11,.5)_60%,rgba(6,6,11,.12)_100%)] rtl:bg-[linear-gradient(270deg,rgba(6,6,11,.97)_0%,rgba(6,6,11,.9)_30%,rgba(6,6,11,.5)_60%,rgba(6,6,11,.12)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/30" />

      <div className="relative flex min-h-[85svh] flex-col gap-8 px-6 pb-10 pt-20 sm:px-10 lg:px-14 lg:pb-14">
        <div className="flex flex-1 flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${kind}-${media.id}`}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium tracking-wide text-fog-300 sm:text-base">
                {year ? <span className="tabular-nums">{year}</span> : null}
                {year && genres.length ? <span className="text-fog-600">•</span> : null}
                {genres.length ? <span>{genres.join(", ")}</span> : null}
              </div>

              <h1
                lang={isPersianText(title) ? "fa" : "en"}
                dir={isPersianText(title) ? "rtl" : "ltr"}
                className="mt-4 text-balance text-5xl font-black uppercase leading-[0.95] tracking-tight text-white drop-shadow-2xl sm:text-6xl lg:text-7xl"
              >
                {title}
              </h1>

              {overview ? (
                <p
                  lang={isPersianText(overview) ? "fa" : "en"}
                  dir={isPersianText(overview) ? "rtl" : "ltr"}
                  className="mt-4 line-clamp-2 max-w-xl text-base leading-7 text-fog-200/90"
                >
                  {overview}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={href}
                  onClick={() => setSelectedMedia(kind, media)}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-ink-950 shadow-xl transition hover:bg-white/90"
                >
                  <Play className="size-4" fill="currentColor" />
                  {t.actions.watchNow}
                </Link>
                <Link
                  href={href}
                  onClick={() => setSelectedMedia(kind, media)}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/40 px-7 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
                >
                  <Play className="size-4" />
                  {t.actions.watchTrailer}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
          <div className="no-scrollbar -mx-1 flex max-w-full items-end gap-3 overflow-x-auto px-1 pb-1">
            {spotlight.map((item, i) => {
              const active = i === safeIndex;
              const image = getCover(item.media) ?? getPoster(item.media);
              const itemTitle = getTitle(item.media);
              return (
                <button
                  key={`${item.kind}-${item.media.id}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={itemTitle}
                  aria-current={active}
                  className="shrink-0"
                >
                  <span
                    className={cn(
                      "relative block h-[68px] w-[120px] overflow-hidden rounded-lg border transition",
                      active ? "border-white/80" : "border-white/15 opacity-60 hover:opacity-100",
                    )}
                  >
                    {image ? (
                      <Image src={image} alt="" fill unoptimized sizes="120px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 bg-white/5" />
                    )}
                  </span>
                  <span className={cn("mt-2 block h-[3px] rounded-full transition", active ? "bg-white" : "bg-transparent")} />
                </button>
              );
            })}
          </div>

          <div className="ms-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleLike(media.id)}
              aria-label={liked ? t.actions.unlike : t.actions.like}
              aria-pressed={liked}
              className={cn(roundAction, liked && "border-transparent bg-white text-ink-950 hover:bg-white")}
            >
              <Heart className="size-5" fill={liked ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() =>
                saved ? removeFromWatchlist(media.id) : addToWatchlist(media.id, media, kind)
              }
              aria-label={saved ? t.bookmarks.remove : t.bookmarks.add}
              aria-pressed={saved}
              className={cn(roundAction, saved && "border-transparent bg-white text-ink-950 hover:bg-white")}
            >
              {saved ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
            </button>
            <Link href={href} onClick={() => setSelectedMedia(kind, media)} aria-label={t.actions.details} className={roundAction}>
              <Plus className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
