import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { APIMedia } from "@/lib/api/types";

type SavedMedia = { media: APIMedia; kind: "movie" | "series" };

interface LibraryState {
  watchlist: number[];
  savedMedia: Record<number, SavedMedia>;
  likes: number[];
  addToWatchlist: (mediaId: number, media?: APIMedia, kind?: "movie" | "series") => void;
  removeFromWatchlist: (mediaId: number) => void;
  isInWatchlist: (mediaId: number) => boolean;
  toggleLike: (mediaId: number) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      savedMedia: {},
      likes: [],
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
      toggleLike: (mediaId) => set((state) => ({
        likes: state.likes.includes(mediaId)
          ? state.likes.filter((id) => id !== mediaId)
          : [...state.likes, mediaId],
      })),
    }),
    { name: "streamovie-library", storage: createJSONStorage(() => localStorage) },
  ),
);
