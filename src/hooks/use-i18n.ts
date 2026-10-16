"use client";

import { useEffect } from "react";
import { getDictionary, getDirection } from "@/i18n";
import { useUIStore } from "@/stores/use-ui-store";

/** Formats a dictionary template like "Add {count} items" with the given values. */
export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

/**
 * Locale + dictionary access for the whole app. Keeps <html lang/dir> in sync
 * so RTL layout and Persian typography apply automatically.
 */
export function useI18n() {
  const locale = useUIStore((state) => state.locale);
  const setLocale = useUIStore((state) => state.setLocale);
  const toggleLocale = useUIStore((state) => state.toggleLocale);

  const dir = getDirection(locale);
  const t = getDictionary(locale);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
  }, [locale, dir]);

  return { locale, dir, isRtl: dir === "rtl", setLocale, toggleLocale, t, format };
}
