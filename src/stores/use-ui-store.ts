import { create } from "zustand";
import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";

interface UIState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  locale: defaultLocale,
  setLocale: (locale) => set({ locale }),
  toggleLocale: () => set((state) => ({ locale: state.locale === "en" ? "fa" : "en" })),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
