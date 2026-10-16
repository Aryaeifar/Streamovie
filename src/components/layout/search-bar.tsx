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
      <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-fog-500" />
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
        className="h-11 w-full rounded-full border border-white/10 bg-white/[0.06] ps-10 pe-10 text-sm text-fog-100 outline-none transition placeholder:text-fog-500 hover:border-white/20 focus:border-brand-400/60 focus:bg-white/[0.09]"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          aria-label={t.search.clear}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-fog-400 transition hover:text-white"
        >
          <X className="size-4" />
        </button>
      ) : null}

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-14 z-50 overflow-hidden rounded-2xl border border-white/10 bg-ink-850/95 shadow-[var(--shadow-lift)] backdrop-blur-xl"
        >
          <p className="border-b border-white/5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-fog-500">
            {results.isLoading ? t.search.searching : t.search.results}
          </p>

          {results.error ? (
            <p className="px-4 py-5 text-sm text-danger-400">
              {t.search.failed}: {results.error.message}
            </p>
          ) : items.length ? (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
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
                        "flex w-full items-center gap-3 px-3 py-2.5 text-start transition",
                        index === active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                      )}
                    >
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-ink-800">
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
