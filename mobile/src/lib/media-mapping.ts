import type {Media, MediaKind} from '../types/media';
import {asText} from './media-format';
import {imdbTop250Movies, imdbTop250Series} from '../imdb-top250';
const EXCLUDED_TITLES = new Set(['نسخه جدید ملودی باکس', 'نسخه جدید هورتون'].map(normalizeExcludedTitle));

function normalizeExcludedTitle(value: string) {
  return value.normalize('NFKC').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[^\p{L}\p{N}]/gu, '').toLocaleLowerCase('fa');
}

export function isExcludedTitle(raw: Record<string, any>) {
  return [raw.title, raw.name].some((title) => typeof title === 'string' && EXCLUDED_TITLES.has(normalizeExcludedTitle(title)));
}

function normalizeChartTitle(title: string) {
  return title.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

const CHARTS = {movie: imdbTop250Movies, series: imdbTop250Series} as const;

function getTop250Rank(media: Media) {
  const chart = CHARTS[media.kind];
  const raw = media.raw;
  const titles = [media.title, raw.original_title, raw.original_name, raw.originalTitle, raw.en_title];
  const description = asText(raw.description, raw.summary);
  for (const line of description.split(/\r?\n/)) {
    if (!/(?:نام اصلی|نام انگلیسی)\s*[:：]/.test(line)) continue;
    const original = line.split(/[:：]/).slice(1).join(':').trim();
    if (original) titles.push(original);
  }
  const yearValue = Number(media.year || raw.year || raw.release_year);
  const year = Number.isInteger(yearValue) && yearValue >= 1880 && yearValue <= 2100 ? yearValue : undefined;
  for (const title of [...new Set(titles.filter((value): value is string => typeof value === 'string' && value.length > 0))]) {
    const normalized = normalizeChartTitle(title);
    const entry = chart.find((candidate) => {
      const candidateTitles = [candidate.title, candidate.originalTitle].map(normalizeChartTitle);
      if (!candidateTitles.includes(normalized)) return false;
      const titleYear = title.match(/\b(18\d{2}|19\d{2}|20\d{2}|2100)\s*$/)?.[1];
      const actualYear = year ?? (titleYear ? Number(titleYear) : undefined);
      return !actualYear || !candidate.year || actualYear === candidate.year;
    });
    if (entry) return chart.findIndex((candidate) => candidate.id === entry.id) + 1;
  }
  return Number.MAX_SAFE_INTEGER;
}

export function rankTop250(items: Media[], kind: MediaKind) {
  return items.map((item) => ({item, rank: item.kind === kind ? getTop250Rank(item) : Number.MAX_SAFE_INTEGER}))
    .filter(({rank}) => rank !== Number.MAX_SAFE_INTEGER)
    .sort((first, second) => first.rank - second.rank)
    .map(({item}) => item);
}
const API_HOSTS = [
  'https://server-hi-speed-iran.info',
  'https://hostinnegar.com',
  'https://windowsdiba.info',
];
const encode = (value: string) => encodeURIComponent(value);

export function parseMedia(raw: Record<string, any>, kind: MediaKind): Media {
  return {
    id: Number(raw.id ?? raw.poster_id ?? 0),
    title: asText(raw.title, raw.name) || 'Untitled',
    image: asText(raw.image, raw.poster, raw.poster_url, raw.thumbnail),
    backdrop: asText(raw.backdrop_url, raw.backdrop, raw.backdrop_image, raw.banner, raw.wallpaper, raw.background_image, raw.cover, raw.image),
    year: asText(raw.year, raw.release_year, raw.release_date).slice(0, 4),
    rating: asText(raw.imdb, raw.rating, raw.rate),
    overview: asText(raw.overview, raw.summary, raw.description),
    kind,
    raw,
  };
}
