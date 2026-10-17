"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Clock, Film, ImageOff, Search, Star, Tv, X } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useI18n } from "@/hooks/use-i18n";
import { useMediaSearch } from "@/hooks/use-media-search";
import { getMediaKind, getPoster, getRating, getTitle, getYear } from "@/lib/media";
import { isPersianText } from "@/lib/text";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const debounced = useDebouncedValue(query, 350);
  const setSelectedMedia = useSelectedMediaStore((state) => state.setSelectedMedia);
  const results = useMediaSearch(debounced);
  const items = results.data?.slice(0, 8) ?? [];
  const showPanel = open && debounced.trim().length > 0;

  useEffect(() => setActive(0), [debounced]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const go = (index: number) => {
    const item = items[index];
    if (!item) return;
    const kind = getMediaKind(item);
    setSelectedMedia(kind, item);
    setOpen(false);
    setQuery("");
    router.push(`/${kind === "movie" ? "movies" : "series"}/${item.id}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setQuery("");
      setOpen(false);
      return;
    }
    if (!showPanel || !items.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => (value + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => (value - 1 + items.length) % items.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(active);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className={cn("pointer-events-none absolute start-3.5 top-1/2 size-[17px] -translate-y-1/2 transition", open ? "text-brand-300" : "text-fog-500")} />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t.search.placeholder}
        aria-label={t.search.label}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        className={cn(
          "h-11 w-full rounded-full border bg-ink-950/50 ps-10 pe-11 text-sm text-fog-100 outline-none transition placeholder:text-fog-500",
          open ? "border-brand-400/35 bg-ink-950/75 shadow-[0_0_0_4px_rgb(var(--color-brand-500)/0.08)]" : "border-white/10 hover:border-white/20",
        )}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          aria-label={t.search.clear}
          className="absolute end-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-fog-400 transition hover:bg-white/[0.08] hover:text-white"
        >
          <X className="size-4" />
        </button>
      ) : null}

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.65rem)] z-50 overflow-hidden rounded-2xl border border-white/[0.1] bg-ink-900/95 shadow-[0_24px_70px_-25px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-fog-400">
              {results.isLoading ? t.search.searching : t.search.results}
            </p>
            {!results.isLoading && !results.error ? <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-semibold tabular-nums text-fog-400">{items.length}</span> : null}
          </div>

          {results.error ? (
            <p className="px-4 py-5 text-sm text-danger-400">
              {t.search.failed}: {results.error.message}
            </p>
          ) : items.length ? (
            <ul className="max-h-[min(60vh,520px)] overflow-y-auto p-1.5">
              {items.map((item, index) => {
                const kind = getMediaKind(item);
                const title = getTitle(item);
                const poster = getPoster(item);
                const rating = getRating(item);
                const year = getYear(item);
                return (
                  <li key={`${kind}-${item.id}-${index}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-start transition",
                        index === active ? "border-brand-400/15 bg-brand-500/[0.10]" : "hover:bg-white/[0.045]",
                      )}
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-white/[0.07] bg-ink-800 sm:size-14">
                        {poster ? (
                          <Image src={poster} alt="" fill unoptimized sizes="56px" className="object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-fog-600">
                            <ImageOff className="size-5" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          lang={isPersianText(title) ? "fa" : "en"}
                          dir={isPersianText(title) ? "rtl" : "ltr"}
                          className="block truncate text-sm font-semibold text-fog-100"
                        >
                          {title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-3 text-xs text-fog-400">
                          <span className="inline-flex items-center gap-1">
                            {kind === "series" ? <Tv className="size-3" /> : <Film className="size-3" />}
                            {kind === "series" ? t.details.series : t.details.movie}
                          </span>
                          {year ? <span className="inline-flex items-center gap-1 tabular-nums"><Clock className="size-3" />{year}</span> : null}
                          {rating > 0 ? (
                            <span className="inline-flex items-center gap-1 text-gold-300">
                              <Star className="size-3" fill="currentColor" />
                              {rating.toFixed(1)}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : !results.isLoading ? (
            <p className="px-4 py-6 text-sm text-fog-400">{t.search.empty}</p>
          ) : (
            <div className="space-y-1 p-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-16 skeleton-sheen rounded-lg" />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
