import en, { type Dictionary } from "@/i18n/dictionaries/en";
import fa from "@/i18n/dictionaries/fa";
import type { Locale } from "@/i18n/config";

export const dictionaries: Record<Locale, Dictionary> = { en, fa };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "fa" ? "rtl" : "ltr";
}

export type { Dictionary };
