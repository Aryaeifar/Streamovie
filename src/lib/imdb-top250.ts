import { imdbTop250Movies, imdbTop250Series } from "@/data/imdb-top250";
import type { APIMedia } from "@/lib/api/types";
import type { MediaKind } from "@/lib/media";

type ChartEntry = (typeof imdbTop250Movies)[number] | (typeof imdbTop250Series)[number];

function normalizeTitle(title: string) {
  return title
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function chartFor(kind: MediaKind): readonly ChartEntry[] {
  return kind === "movie" ? imdbTop250Movies : imdbTop250Series;
}

const chartTitleMaps = new Map<MediaKind, Map<string, ChartEntry[]>>(
  (["movie", "series"] as const).map((kind) => {
    const entriesByTitle = new Map<string, ChartEntry[]>();
    for (const entry of chartFor(kind)) {
      for (const title of [entry.title, entry.originalTitle]) {
        const normalized = normalizeTitle(title);
        if (!normalized) continue;
        const entries = entriesByTitle.get(normalized) ?? [];
        entries.push(entry);
        entriesByTitle.set(normalized, entries);
      }
    }
    return [kind, entriesByTitle];
  }),
);

function catalogTitles(media: APIMedia) {
  const titles = [media.title, media.name].filter((title): title is string => typeof title === "string");
  const description = String(media.description ?? media.summary ?? "");
  for (const line of description.split(/\r?\n/)) {
    if (!/(?:نام اصلی|نام انگلیسی)\s*[:：]/.test(line)) continue;
    const title = line.split(/[:：]/).slice(1).join(":").trim();
    if (title) titles.push(title);
  }
  return [...new Set(titles)];
}

function catalogYear(media: APIMedia, title: string) {
  const year = Number(media.year);
  if (Number.isInteger(year) && year >= 1880 && year <= 2100) return year;
  const titleYear = title.match(/\b(18\d{2}|19\d{2}|20\d{2}|2100)\s*$/)?.[1];
  return titleYear ? Number(titleYear) : undefined;
}

function findChartEntry(media: APIMedia, kind: MediaKind) {
  const entriesByTitle = chartTitleMaps.get(kind)!;
  for (const title of catalogTitles(media)) {
    const normalized = normalizeTitle(title);
    const candidates = entriesByTitle.get(normalized) ?? entriesByTitle.get(normalized.replace(/(?:18|19|20)\d{2}$/, "")) ?? [];
    const year = catalogYear(media, title);
    const match = candidates.find((entry) => !year || !entry.year || year === entry.year);
    if (match) return match;
  }
  return undefined;
}

/** Strictly checks catalog titles against the saved IMDb chart snapshot. */
export function isInImdbTop250(media: APIMedia, kind: MediaKind) {
  return Boolean(findChartEntry(media, kind));
}

/** Returns the chart position used to keep verified matches in IMDb order. */
export function getImdbTop250Rank(media: APIMedia, kind: MediaKind) {
  const chart = chartFor(kind);
  const entry = findChartEntry(media, kind);
  return entry ? chart.findIndex((candidate) => candidate.id === entry.id) + 1 : Number.MAX_SAFE_INTEGER;
}
