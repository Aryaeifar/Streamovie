"use client";

import { useEffect, useState } from "react";
import { useLibraryStore } from "@/stores/use-library-store";

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
