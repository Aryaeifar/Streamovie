"use client";

import { useEffect, useLayoutEffect } from "react";
import { getDictionary, getDirection } from "@/i18n";
import { useUIStore } from "@/stores/use-ui-store";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

export function useI18n() {
  const locale = useUIStore((state) => state.locale);
  const setLocale = useUIStore((state) => state.setLocale);
  const toggleLocale = useUIStore((state) => state.toggleLocale);

  const dir = getDirection(locale);
  const t = getDictionary(locale);

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
  }, [locale, dir]);

  return { locale, dir, isRtl: dir === "rtl", setLocale, toggleLocale, t, format };
}
