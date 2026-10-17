import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";
import { defaultTheme, type ThemeId } from "@/lib/themes";

interface UIState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  settingsOpen: boolean;
  setSettingsOpen: (settingsOpen: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      locale: defaultLocale,
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set((state) => ({ locale: state.locale === "en" ? "fa" : "en" })),
      theme: defaultTheme,
      setTheme: (theme) => set({ theme }),
      settingsOpen: false,
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      // Rail is open by default (and intentionally not persisted).
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      searchQuery: "",
      setSearchQuery: (searchQuery) => set({ searchQuery }),
    }),
    {
      name: "streamovie-ui",
      storage: createJSONStorage(() => localStorage),
      // Only the user's language + theme choices are persisted; `searchQuery`
      // stays in-memory.
      partialize: (state) => ({ locale: state.locale, theme: state.theme }),
      // Hydrate on the client after mount so the first render matches the SSR
      // output (defaults) and does not trip hydration mismatches.
      skipHydration: true,
    },
  ),
);
