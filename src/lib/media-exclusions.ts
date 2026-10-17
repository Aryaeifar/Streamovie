import type { APIMedia } from "@/lib/api/types";

const excludedTitles = new Set([
  "نسخه جدید ملودی باکس",
  "نسخه جدید هورتون",
].map(normalizeTitle));

function normalizeTitle(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLocaleLowerCase("fa");
}

export function isExcludedMedia(media: APIMedia) {
  return [media.title, media.name].some(
    (title) => typeof title === "string" && excludedTitles.has(normalizeTitle(title)),
  );
}

export function excludeHiddenMedia(items: APIMedia[]) {
  return items.filter((item) => !isExcludedMedia(item));
}
