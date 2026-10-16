"use client";

import { useEffect, useState } from "react";
import { useLibraryStore } from "@/stores/use-library-store";

/**
 * zustand's persisted storage hydrates asynchronously, so the first client
 * render sees an empty library. Components that would otherwise flash an empty
 * state can wait for this to become true.
 */
export function useLibraryHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    typeof window === "undefined" ? false : useLibraryStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubscribe = useLibraryStore.persist.onFinishHydration(() => setHydrated(true));
    if (useLibraryStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  return hydrated;
}
