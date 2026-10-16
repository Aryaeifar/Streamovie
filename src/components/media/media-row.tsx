"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { MediaCard } from "@/components/media/media-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import type { APIMedia } from "@/lib/api/types";
import type { MediaKind } from "@/lib/media";
import { format, useI18n } from "@/hooks/use-i18n";

export type RowItem = { media: APIMedia; kind: MediaKind };

type MediaRowProps = {
  id: string;
  title: string;
  subtitle?: string;
  items?: RowItem[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
};

export function MediaRow({ id, title, subtitle, items, loading, error, onRetry }: MediaRowProps) {
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: number) => {
    scroller.current?.scrollBy({ left: direction * 560, behavior: "smooth" });
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
    </>
  );

  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <SectionHeading
        title={title}
        subtitle={subtitle ?? (items?.length ? format(t.home.titlesCount, { count: items.length }) : undefined)}
        actions={nav}
      />

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="aspect-[2/3] w-40 shrink-0 rounded-card sm:w-44" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title={format(t.home.loadError, { title })} description={error.message} retryLabel={t.actions.retry} onRetry={onRetry} />
      ) : items?.length ? (
        <div
          ref={scroller}
          className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
        >
          {items.map(({ media, kind }, index) => (
            <motion.div
              key={`${kind}-${media.id}-${index}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
              className="w-40 shrink-0 snap-start sm:w-44"
            >
              <MediaCard media={media} kind={kind} />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Film} title={t.home.empty} description={subtitle} />
      )}
    </section>
  );
}
