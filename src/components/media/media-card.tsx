"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, BookmarkCheck, ImageOff, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";
import { getGenres, getPoster, getRating, getTitle, getYear, parseDescription, type MediaKind } from "@/lib/media";
import { isPersianText } from "@/lib/text";
import type { APIMedia } from "@/lib/api/types";
import { useLibraryStore } from "@/stores/use-library-store";
import { cn } from "@/lib/utils";

type MediaCardProps = {
  media: APIMedia;
  kind: MediaKind;
  compact?: boolean;
  onSelect?: () => void;
  className?: string;
};

export function MediaCard({ media, kind, compact = false, onSelect, className }: MediaCardProps) {
  const { t } = useI18n();
  const title = getTitle(media);
  const poster = getPoster(media);
  const rating = getRating(media);
  const year = getYear(media);
  const genres = getGenres(media).slice(0, 3);
  const description = parseDescription(media.description ?? media.summary).overview;
  const persian = isPersianText(title);
  const href = `/${kind === "movie" ? "movies" : "series"}/${media.id}`;
  const saved = useLibraryStore((state) => state.watchlist.includes(media.id));
  const addToWatchlist = useLibraryStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useLibraryStore((state) => state.removeFromWatchlist);

  return (
    <article className={cn(
      "group relative flex flex-col bg-transparent",
      "transition duration-300 ease-out hover:-translate-y-1 focus-within:-translate-y-1",
      className,
    )}>
      <Link href={href} onClick={onSelect} aria-label={title} className="flex flex-1 flex-col">
        <div className={cn("relative overflow-hidden rounded-xl border border-white/[0.08] bg-ink-800 shadow-lg shadow-black/20", compact ? "aspect-[16/10]" : "aspect-[2/3]")}>
          {poster ? (
            <Image
              src={poster}
              alt={title}
              fill
              unoptimized
              sizes={compact ? "(max-width:640px) 45vw, 220px" : "(max-width:640px) 45vw, (max-width:1024px) 28vw, 16vw"}
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-fog-500"><ImageOff className="size-7" /></div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
          {rating > 0 ? <span className="absolute start-2 bottom-2 inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-xs font-bold tabular-nums text-gold-300 backdrop-blur-sm"><Star className="size-3" fill="currentColor" />{rating.toFixed(1)}</span> : null}

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/95 to-black/35 p-3 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100 sm:p-4">
            <h3 lang={persian ? "fa" : "en"} dir={persian ? "rtl" : "ltr"} className="line-clamp-2 text-start text-sm font-bold leading-snug text-white sm:text-base">
              {title}
            </h3>
            {description ? <p className="mt-2 line-clamp-3 text-start text-xs leading-5 text-fog-300">{description}</p> : null}
            {genres.length ? <div className="mt-3 flex flex-wrap gap-1.5">{genres.map((genre) => <Badge key={genre} variant="soft" size="sm" className="border-white/10 bg-white/10">{genre}</Badge>)}</div> : null}
          </div>
        </div>

        <div className={cn("flex flex-1 flex-col", compact ? "gap-0.5 px-1.5 py-2" : "gap-1 px-1.5 py-2.5")}>
          <h3 lang={persian ? "fa" : "en"} dir={persian ? "rtl" : "ltr"} className={cn("line-clamp-2 font-semibold leading-snug text-fog-100 transition group-hover:text-white", compact ? "text-xs" : "min-h-10 text-sm")}>
            {title}
          </h3>
          {year ? <span className="mt-auto text-xs tabular-nums text-fog-500">{year}</span> : null}
        </div>
      </Link>

      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? t.bookmarks.remove : t.bookmarks.add}
        title={saved ? t.bookmarks.remove : t.bookmarks.add}
        onClick={() => (saved ? removeFromWatchlist(media.id) : addToWatchlist(media.id, media, kind))}
        className="absolute end-2 top-2 z-10 flex size-9 translate-y-1 items-center justify-center rounded-lg border border-white/15 bg-black/70 text-fog-100 opacity-0 shadow-lg backdrop-blur transition duration-200 hover:border-brand-400/50 hover:bg-brand-500 hover:text-white group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
      >
        {saved ? <BookmarkCheck className="size-4 text-brand-300" /> : <Bookmark className="size-4" />}
      </button>
    </article>
  );
}
