import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { APIMedia } from "@/lib/api/types";

type SavedMedia = { media: APIMedia; kind: "movie" | "series" };

interface LibraryState {
  watchlist: number[];
  savedMedia: Record<number, SavedMedia>;
  addToWatchlist: (mediaId: number, media?: APIMedia, kind?: "movie" | "series") => void;
  removeFromWatchlist: (mediaId: number) => void;
  isInWatchlist: (mediaId: number) => boolean;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      savedMedia: {},
      addToWatchlist: (mediaId, media, kind = "movie") => set((state) => ({
        watchlist: state.watchlist.includes(mediaId) ? state.watchlist : [...state.watchlist, mediaId],
        savedMedia: media ? { ...state.savedMedia, [mediaId]: { media, kind } } : state.savedMedia,
      })),
      removeFromWatchlist: (mediaId) => set((state) => {
        const savedMedia = { ...state.savedMedia };
        delete savedMedia[mediaId];
        return { watchlist: state.watchlist.filter((id) => id !== mediaId), savedMedia };
      }),
      isInWatchlist: (mediaId) => get().watchlist.includes(mediaId),
    }),
    { name: "streamovie-library", storage: createJSONStorage(() => localStorage) },
  ),
);
