import Image from "next/image";
import Link from "next/link";
import { ImageOff, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPoster, getRating, getTitle, getYear, type MediaKind } from "@/lib/media";
import { isPersianText } from "@/lib/text";
import type { APIMedia } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type MediaCardProps = {
  media: APIMedia;
  kind: MediaKind;
  compact?: boolean;
  onSelect?: () => void;
  className?: string;
};

export function MediaCard({ media, kind, compact = false, onSelect, className }: MediaCardProps) {
  const title = getTitle(media);
  const poster = getPoster(media);
  const rating = getRating(media);
  const year = getYear(media);
  const persian = isPersianText(title);
  const href = `/${kind === "movie" ? "movies" : "series"}/${media.id}`;

  return (
    <Link
      href={href}
      onClick={onSelect}
      aria-label={title}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border border-white/[0.07] bg-ink-850",
        "transition duration-300 ease-out hover:-translate-y-1.5 hover:border-brand-400/40 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden bg-ink-800", compact ? "aspect-[16/10]" : "aspect-[2/3]")}>
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
          <div className="flex h-full w-full items-center justify-center text-fog-500">
            <ImageOff className="size-7" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent opacity-70 transition group-hover:opacity-90" />

        <Badge variant="soft" size="sm" className="absolute start-2 top-2 uppercase">
          {kind}
        </Badge>

        {rating > 0 ? (
          <Badge variant="soft" size="sm" className="absolute end-2 top-2 gap-1 text-gold-300">
            <Star className="size-3" fill="currentColor" />
            {rating.toFixed(1)}
          </Badge>
        ) : null}
      </div>

      <div className={cn("flex flex-1 flex-col", compact ? "gap-0.5 p-2.5" : "gap-1 p-3")}>
        <h3
          lang={persian ? "fa" : "en"}
          dir={persian ? "rtl" : "ltr"}
          className={cn(
            "line-clamp-2 font-semibold leading-snug text-fog-100 transition group-hover:text-white",
            compact ? "text-xs" : "min-h-10 text-sm",
          )}
        >
          {title}
        </h3>
        {year ? <span className="mt-auto text-xs text-fog-500 tabular-nums">{year}</span> : null}
      </div>
    </Link>
  );
}
