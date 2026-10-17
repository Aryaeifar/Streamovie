"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { MediaCard } from "@/components/media/media-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import type { APIMedia } from "@/lib/api/types";
import type { MediaKind } from "@/lib/media";
import { format, useI18n } from "@/hooks/use-i18n";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";

export type RowItem = { media: APIMedia; kind: MediaKind };

type MediaRowProps = {
  id: string;
  title: string;
  subtitle?: string;
  items?: RowItem[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  moreHref?: string;
};

export function MediaRow({ id, title, subtitle, items, loading, error, onRetry, moreHref }: MediaRowProps) {
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const setSelectedMedia = useSelectedMediaStore((state) => state.setSelectedMedia);

  const scrollBy = (direction: number) => {
    const distance = Math.max(280, (scroller.current?.clientWidth ?? 560) * 0.8);
    scroller.current?.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  const nav = (
    <>
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label={`${t.actions.previous} ${title}`}
        onClick={() => scrollBy(-1)}
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </Button>
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label={`${t.actions.next} ${title}`}
        onClick={() => scrollBy(1)}
      >
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Button>
      {moreHref ? (
        <ButtonLink href={moreHref} variant="secondary" size="sm" className="ms-0.5">
          {t.actions.seeMore}
          <ChevronRight className="size-4 rtl:rotate-180" />
        </ButtonLink>
      ) : null}
    </>
  );

  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <SectionHeading
        title={title}
        subtitle={subtitle ?? (items?.length ? format(t.home.titlesCount, { count: items.length }) : undefined)}
        actions={<div className="hidden sm:flex sm:items-center sm:gap-2">{nav}</div>}
      />

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="aspect-[2/3] w-48 shrink-0 rounded-card sm:w-56 lg:w-60" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title={format(t.home.loadError, { title })} description={error.message} retryLabel={t.actions.retry} onRetry={onRetry} />
      ) : items?.length ? (
        <div
          ref={scroller}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:-mx-1 sm:gap-4 sm:px-1"
        >
          {items.map(({ media, kind }, index) => (
            <motion.div
              key={`${kind}-${media.id}-${index}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
              className="w-[42vw] max-w-[184px] shrink-0 snap-start min-[390px]:w-[44vw] sm:w-52 sm:max-w-none md:w-56 lg:w-60"
            >
              <MediaCard media={media} kind={kind} onSelect={() => setSelectedMedia(kind, media)} />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Film} title={t.home.empty} description={subtitle} />
      )}
    </section>
  );
}
