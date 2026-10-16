import type { APIMedia, APISeason } from "@/lib/api/types";

export type MediaKind = "movie" | "series";

export type SourceLink = {
  id?: number;
  quality: string;
  type?: string;
  url: string;
  /** A teaser/trailer rather than the feature itself. */
  isTrailer: boolean;
};

export type DescriptionBlock = { label: string; value: string };

export type ParsedDescription = {
  overview?: string;
  fields: DescriptionBlock[];
};

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getTitle(media: APIMedia): string {
  return firstString(media.title, media.name) ?? "Untitled";
}

export function getPoster(media: APIMedia): string | undefined {
  return firstString(media.image, media.poster, media.poster_url, media.thumbnail);
}

export function getCover(media: APIMedia): string | undefined {
  return firstString(
    media.cover,
    media.backdrop,
    media.backdrop_url,
    media.banner,
    media.wallpaper,
    media.image,
  );
}

export function getYear(media: APIMedia): string | undefined {
  const value = firstString(media.year, media.release_year, media.release_date);
  return value;
}

/** Prefers the real IMDb score over the (often zero) `rating` field. */
export function getRating(media: APIMedia): number {
  const imdb = toNumber(media.imdb);
  if (imdb > 0) return imdb;
  return toNumber(media.rating ?? media.rate);
}

export function getDuration(media: APIMedia): string | undefined {
  return firstString(media.duration, media.runtime, media.length);
}

export function getClassification(media: APIMedia): string | undefined {
  return firstString(media.classification, media.age_rating);
}

function titlesFrom(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return firstString((item as APIMedia).title, (item as APIMedia).name);
        return undefined;
      })
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === "string") {
    return value
      .split(/[,،]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function getGenres(media: APIMedia): string[] {
  return titlesFrom(media.genres ?? media.genre);
}

export function getCountries(media: APIMedia): string[] {
  return titlesFrom(media.country ?? media.countries);
}

export function getSources(media: APIMedia | APISeason | Record<string, unknown>): SourceLink[] {
  const raw = (media as Record<string, unknown>).sources;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index): SourceLink | undefined => {
      const record = (item ?? {}) as Record<string, unknown>;
      const url = firstString(record.url, record.link, record.src);
      if (!url) return undefined;
      const quality = firstString(record.quality, record.resolution, record.label) ?? "Source";
      return {
        id: typeof record.id === "number" ? record.id : index,
        quality,
        type: firstString(record.type, record.format),
        url,
        isTrailer: /تیزر|trailer|teaser/i.test(quality),
      };
    })
    .filter((item): item is SourceLink => Boolean(item));
}

const OVERVIEW_LABEL = /خلاصه/;

const KNOWN_LABELS: Record<string, string> = {
  "نام پارسی": "نام پارسی",
  "سایر عناوین": "سایر عناوین",
  کارگردان: "کارگردان",
  ستارگان: "بازیگران",
  "پخش از شبکه": "شبکه",
  "وضعیت سریال": "وضعیت",
};

/**
 * The catalog returns `description` as a Persian multi-line block of
 * `label: value` pairs plus a plot summary. Splits that into an overview and
 * an ordered list of labelled fields.
 */
export function parseDescription(description: unknown): ParsedDescription {
  if (typeof description !== "string" || !description.trim()) return { fields: [] };

  const normalized = description.replace(/\r\n/g, "\n");
  const fields: DescriptionBlock[] = [];
  let overview: string | undefined;

  for (const block of normalized.split(/\n\s*\n/)) {
    const text = block.trim();
    if (!text) continue;

    const separator = text.indexOf(":");
    if (separator === -1) continue;

    const label = text.slice(0, separator).replace(/\s+/g, " ").trim();
    const value = text.slice(separator + 1).replace(/[ \t]+/g, " ").trim();
    if (!value) continue;

    if (OVERVIEW_LABEL.test(label)) {
      overview = value;
      continue;
    }

    const canonical = KNOWN_LABELS[label];
    if (!canonical) continue;
    fields.push({ label: canonical, value });
  }

  return { overview, fields };
}

/** The ISO-ish quality string, e.g. "1080 زیرنویس" -> nice display label. */
export function formatQuality(quality: string): string {
  return quality.replace(/\s+/g, " ").trim();
}

export function getMediaKind(media: APIMedia): MediaKind {
  const type = firstString(media.type, media.kind, media.media_type)?.toLowerCase();
  if (type && /serie|series|tv/.test(type)) return "series";
  return "movie";
}

export type Episode = { key: string; id?: number; title: string; sources: SourceLink[] };

export function getSeasonTitle(season: APISeason, index: number): string {
  return firstString(season.title, season.name) ?? `Season ${index + 1}`;
}

export function getEpisodes(season: APISeason): Episode[] {
  const raw = season.episodes ?? season.parts ?? season.items;
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const record = (item ?? {}) as Record<string, unknown>;
    const title = firstString(record.title, record.name) ?? `Episode ${index + 1}`;
    const id = typeof record.id === "number" ? record.id : undefined;
    return { key: `${id ?? index}-${index}`, id, title, sources: getSources(record) };
  });
}

