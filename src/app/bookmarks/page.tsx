"use client";

import { Bookmark } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MediaCard } from "@/components/media/media-card";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { format, useI18n } from "@/hooks/use-i18n";
import { useLibraryHydrated } from "@/hooks/use-library-hydrated";
import { useLibraryStore } from "@/stores/use-library-store";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";

export default function BookmarksPage() {
  const { t } = useI18n();
  const hydrated = useLibraryHydrated();
  const watchlist = useLibraryStore((state) => state.watchlist);
  const savedMedia = useLibraryStore((state) => state.savedMedia);
  const setSelectedMedia = useSelectedMediaStore((state) => state.setSelectedMedia);
  const saved = watchlist.map((id) => ({ id, ...savedMedia[id] })).filter((item) => item.media && item.kind);

  return (
    <AppShell>
      <Container className="space-y-8 py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-fog-50 sm:text-4xl">
              <Bookmark className="size-7 text-brand-400" />
              {t.bookmarks.title}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-fog-400">{t.bookmarks.subtitle}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-fog-300">
            {format(t.bookmarks.savedCount, { count: saved.length })}
          </span>
        </header>

        {!hydrated ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="aspect-[2/3] rounded-card" />
            ))}
          </div>
        ) : saved.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {saved.map(({ id, media, kind }) => (
              <MediaCard
                key={`${kind}-${id}`}
                media={media!}
                kind={kind!}
                onSelect={() => setSelectedMedia(kind!, media!)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Bookmark}
            title={t.bookmarks.emptyTitle}
            description={t.bookmarks.emptyBody}
            action={
              <ButtonLink href="/">
                <Bookmark className="size-4" />
                {t.actions.browse}
              </ButtonLink>
            }
          />
        )}
      </Container>
    </AppShell>
  );
}
