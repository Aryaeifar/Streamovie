"use client";

import { useEffect, useLayoutEffect } from "react";
import { useUIStore } from "@/stores/use-ui-store";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Re-applies persisted preferences (language + theme) before the first paint, so
 * a returning visitor lands on their saved language and theme with no flash of
 * the defaults.
 */
export function PreferencesHydrator() {
  const theme = useUIStore((state) => state.theme);

  useIsomorphicLayoutEffect(() => {
    void useUIStore.persist.rehydrate();
  }, []);

  useIsomorphicLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
