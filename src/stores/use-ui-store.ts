import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

interface UIState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      locale: defaultLocale,
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set((state) => ({ locale: state.locale === "en" ? "fa" : "en" })),
      searchQuery: "",
      setSearchQuery: (searchQuery) => set({ searchQuery }),
    }),
    {
      name: "streamovie-ui",
      storage: createJSONStorage(() => localStorage),
      // Only the language choice is persisted; `searchQuery` stays in-memory.
      partialize: (state) => ({ locale: state.locale }),
      // Hydrate on the client after mount so the first render matches the SSR
      // output (default locale) and does not trip hydration mismatches.
      skipHydration: true,
    },
  ),
);
