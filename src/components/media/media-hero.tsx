"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { getCover, getGenres, getPoster, getRating, getTitle, getYear, parseDescription, type MediaKind } from "@/lib/media";
import { isPersianText } from "@/lib/text";
import type { APIMedia } from "@/lib/api/types";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

export type HeroItem = { media: APIMedia; kind: MediaKind };

export function MediaHero({ items }: { items: HeroItem[] }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % items.length), 7000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  const active = items[index % items.length];
  const safeIndex = index % items.length;
  const { media, kind } = active;
  const title = getTitle(media);
  const persian = isPersianText(title);
  const backdrop = getCover(media) ?? getPoster(media);
  const rating = getRating(media);
  const year = getYear(media);
  const genres = getGenres(media).slice(0, 3);
  const overview = parseDescription(media.description).overview;

  const step = (direction: number) => setIndex((value) => (value + direction + items.length) % items.length);
  const previews = items.map((item, i) => ({ item, i })).filter(({ i }) => i !== safeIndex).slice(0, 5);

  return (
    <section className="relative isolate min-h-[64vh] overflow-hidden rounded-hero border border-white/10 bg-ink-900 sm:min-h-[70vh]">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${kind}-${media.id}`}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute inset-0 -z-20"
        >
          {backdrop ? (
            <Image src={backdrop} alt="" fill priority unoptimized sizes="100vw" className="object-cover object-center" />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,6,11,.94)_0%,rgba(6,6,11,.72)_38%,rgba(6,6,11,.28)_66%,rgba(6,6,11,.7)_100%)] rtl:bg-[linear-gradient(270deg,rgba(6,6,11,.94)_0%,rgba(6,6,11,.72)_38%,rgba(6,6,11,.28)_66%,rgba(6,6,11,.7)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />

      <div className="relative flex min-h-[64vh] flex-col justify-end gap-10 p-6 sm:min-h-[70vh] sm:p-10 lg:flex-row lg:items-end lg:p-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${kind}-${media.id}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <Badge variant="solid" className="uppercase">
                {t.home.featured}
              </Badge>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-fog-400">
                {kind === "series" ? t.details.series : t.details.movie}
              </span>
            </div>

            <h1
              lang={persian ? "fa" : "en"}
              dir={persian ? "rtl" : "ltr"}
              className="text-balance text-4xl font-black leading-[1.05] tracking-tight text-white drop-shadow-xl sm:text-5xl lg:text-6xl"
            >
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fog-200">
              {rating > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-gold-300">
                  <Star className="size-4" fill="currentColor" />
                  {rating.toFixed(1)}
                </span>
              ) : null}
              {year ? <span className="tabular-nums">{year}</span> : null}
              {genres.length ? (
                <span className="text-fog-300">{genres.join(" · ")}</span>
              ) : null}
            </div>

            {overview ? (
              <p
                lang={isPersianText(overview) ? "fa" : "en"}
                dir={isPersianText(overview) ? "rtl" : "ltr"}
                className="line-clamp-3 max-w-xl text-sm leading-7 text-fog-300 sm:text-base"
              >
                {overview}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <ButtonLink href={`/${kind === "movie" ? "movies" : "series"}/${media.id}`} size="lg">
                <Play className="size-4" fill="currentColor" />
                {t.actions.view}
              </ButtonLink>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="lg:ms-auto">
          <div className="grid w-full max-w-sm grid-cols-3 gap-2.5 sm:grid-cols-5 lg:max-w-[15rem] lg:grid-cols-2">
            {previews.map(({ item, i }) => {
              const image = getCover(item.media) ?? getPoster(item.media);
              const previewTitle = getTitle(item.media);
              return (
                <button
                  key={`${item.kind}-${item.media.id}`}
                  onClick={() => setIndex(i)}
                  aria-label={previewTitle}
                  className={cn(
                    "group relative aspect-[16/10] overflow-hidden rounded-lg border border-white/12 bg-ink-800",
                    "transition hover:border-brand-400/70 focus-visible:border-brand-400",
                  )}
                >
                  {image ? (
                    <Image src={image} alt="" fill unoptimized sizes="140px" className="object-cover transition duration-500 group-hover:scale-110" />
                  ) : (
                    <span className="absolute inset-0 bg-white/5" />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button variant="outline" size="icon-sm" aria-label={t.actions.previous} onClick={() => step(-1)}>
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label={t.actions.next} onClick={() => step(1)}>
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
            <span className="ms-1 text-xs tabular-nums text-fog-400" dir="ltr">
              {String(safeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
