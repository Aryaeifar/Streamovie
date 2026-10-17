"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Bookmark, BookmarkCheck, Heart, Play, Plus, Star } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useLibraryHydrated } from "@/hooks/use-library-hydrated";
import { getCover, getGenres, getHeroImage, getPoster, getTitle, getYear, parseDescription, type MediaKind } from "@/lib/media";
import { isPersianText } from "@/lib/text";
import type { APIMedia } from "@/lib/api/types";
import { useLibraryStore } from "@/stores/use-library-store";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";
import { cn } from "@/lib/utils";

export type HeroItem = {
  media: APIMedia;
  kind: MediaKind;
  artwork?: string;
  titleFa?: string;
  descriptionFa?: string;
};

const roundAction =
  "inline-flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/15";

export function SpotlightHero({ items }: { items: HeroItem[] }) {
  const { t, isRtl } = useI18n();
  const [index, setIndex] = useState(0);
  const [failedArtwork, setFailedArtwork] = useState<Record<string, boolean>>({});
  const hydrated = useLibraryHydrated();
  const setSelectedMedia = useSelectedMediaStore((state) => state.setSelectedMedia);
  const watchlist = useLibraryStore((state) => state.watchlist);
  const addToWatchlist = useLibraryStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useLibraryStore((state) => state.removeFromWatchlist);
  const likes = useLibraryStore((state) => state.likes);
  const toggleLike = useLibraryStore((state) => state.toggleLike);

  const spotlight = items.slice(0, 6);
  useEffect(() => {
    if (spotlight.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % spotlight.length);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [spotlight.length, index]);

  const safeIndex = Math.max(0, Math.min(index, spotlight.length - 1));
  useEffect(() => {
    if (spotlight.length < 2) return;
    const upcoming = spotlight[(safeIndex + 1) % spotlight.length];
    if (!upcoming) return;
    const source = upcoming.artwork && !failedArtwork[upcoming.artwork]
      ? upcoming.artwork
      : getHeroImage(upcoming.media);
    if (!source) return;

    const preloadedImage = new window.Image();
    preloadedImage.decoding = "async";
    preloadedImage.fetchPriority = "low";
    preloadedImage.onerror = () => {
      if (upcoming.artwork) {
        setFailedArtwork((previous) => previous[upcoming.artwork!] ? previous : ({ ...previous, [upcoming.artwork!]: true }));
      }
    };
    preloadedImage.src = source;

    return () => {
      preloadedImage.onload = null;
      preloadedImage.onerror = null;
    };
  }, [failedArtwork, index, items, safeIndex, spotlight.length]);

  if (!spotlight.length) return null;

  const item = spotlight[safeIndex];
  const { media, kind } = item;

  const title = isRtl && item.titleFa ? item.titleFa : getTitle(media);
  const backdrop = item.artwork && !failedArtwork[item.artwork] ? item.artwork : getHeroImage(media);
  const year = getYear(media);
  const genres = getGenres(media).slice(0, 3);
  const overview = isRtl && item.descriptionFa ? item.descriptionFa : parseDescription(media.description ?? media.summary).overview;
  const imdbRatingValue = Number(media.imdb ?? media.imdb_rating ?? media.imdbRating);
  const imdbRating = Number.isFinite(imdbRatingValue) ? imdbRatingValue : 0;
  const href = `/${kind === "movie" ? "movies" : "series"}/${media.id}`;
  const saved = hydrated && watchlist.includes(media.id);
  const liked = hydrated && likes.includes(media.id);

  return (
    <section id="featured" className="scroll-mt-20 relative isolate min-h-[620px] w-full overflow-hidden bg-ink-950 sm:min-h-[680px] lg:min-h-[min(76svh,820px)]">
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
            <Image
              src={backdrop}
              alt={`${title} featured artwork`}
              fill
              priority
              unoptimized
              sizes="100vw"
              onError={() => {
                if (item.artwork) {
                  setFailedArtwork((previous) => previous[item.artwork!] ? previous : ({ ...previous, [item.artwork!]: true }));
                }
              }}
              className="object-cover object-center"
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `linear-gradient(${isRtl ? "270deg" : "90deg"}, color-mix(in srgb, var(--color-ink-950) 96%, transparent) 0%, color-mix(in srgb, var(--color-ink-950) 84%, transparent) 26%, color-mix(in srgb, var(--color-ink-950) 36%, transparent) 58%, transparent 100%)`,
        }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `linear-gradient(0deg, var(--color-ink-950) 0%, color-mix(in srgb, var(--color-ink-950) 88%, transparent) 8%, transparent 46%, color-mix(in srgb, var(--color-ink-950) 25%, transparent) 100%)`,
        }}
      />

      <div className="relative flex min-h-[620px] flex-col gap-8 px-5 pb-8 pt-12 sm:min-h-[680px] sm:px-9 sm:pb-10 lg:min-h-[min(76svh,820px)] lg:px-14 lg:pb-12 lg:pt-10">
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
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-400">
                <span className="size-1.5 rounded-full bg-brand-400 shadow-glow" />
                {t.home.featured}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-fog-200 sm:text-base">
                {imdbRating > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-gold-300">
                    <Star className="size-4" fill="currentColor" />
                    <span className="font-bold tabular-nums">{imdbRating.toFixed(1)}</span>
                    <span className="text-xs font-semibold text-fog-300">IMDb</span>
                  </span>
                ) : null}
                {imdbRating > 0 && year ? <span className="text-fog-600">•</span> : null}
                {year ? <span className="tabular-nums">{year}</span> : null}
                {(year || imdbRating > 0) && genres.length ? <span className="text-fog-600">•</span> : null}
                {genres.length ? <span>{genres.join(", ")}</span> : null}
              </div>

              <h1
                lang={isPersianText(title) ? "fa" : "en"}
                dir={isPersianText(title) ? "rtl" : "ltr"}
                className="mt-3 text-balance text-5xl font-black uppercase leading-[0.93] tracking-tight text-white drop-shadow-2xl sm:text-6xl lg:text-7xl xl:text-8xl"
              >
                {title}
              </h1>

              {overview ? (
                <p
                  lang={isPersianText(overview) ? "fa" : "en"}
                  dir={isPersianText(overview) ? "rtl" : "ltr"}
                  className="mt-4 line-clamp-3 max-w-xl text-sm leading-6 text-fog-100/90 sm:text-base sm:leading-7"
                >
                  {overview}
                </p>
              ) : null}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={href}
                  onClick={() => setSelectedMedia(kind, media)}
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand-500 px-7 text-sm font-bold text-ink-950 shadow-glow transition hover:bg-brand-400"
                >
                  <Play className="size-4" fill="currentColor" />
                  {t.actions.watchNow}
                </Link>
                <Link
                  href={href}
                  onClick={() => setSelectedMedia(kind, media)}
                  className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/30 bg-black/20 px-7 text-sm font-semibold text-white backdrop-blur transition hover:border-white/60 hover:bg-white/10"
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
                      "relative block h-[62px] w-[108px] overflow-hidden rounded-md border transition sm:h-[70px] sm:w-[124px]",
                      active ? "border-brand-400 ring-1 ring-brand-400/60" : "border-white/15 opacity-55 hover:opacity-100",
                    )}
                  >
                    {image ? (
                      <Image src={image} alt="" fill unoptimized sizes="120px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 bg-white/5" />
                    )}
                  </span>
                  <span className={cn("mt-1.5 block h-[2px] rounded-full transition", active ? "bg-brand-400" : "bg-transparent")} />
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
