"use client";

import { useEffect, useState } from "react";
import { useSelectedMediaStore } from "@/stores/use-selected-media-store";

export function useSelectedMediaHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    typeof window === "undefined" ? false : useSelectedMediaStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubscribe = useSelectedMediaStore.persist.onFinishHydration(() => setHydrated(true));
    if (useSelectedMediaStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  return hydrated;
}
