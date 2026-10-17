"use client";

import { useEffect, useLayoutEffect } from "react";
import { useUIStore } from "@/stores/use-ui-store";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Re-applies the persisted language choice before the first paint, so a returning
 * visitor lands on their saved language without a flash of the default one.
 */
export function LocaleHydrator() {
  useIsomorphicLayoutEffect(() => {
    void useUIStore.persist.rehydrate();
  }, []);

  return null;
}
