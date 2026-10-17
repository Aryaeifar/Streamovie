import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { APIMedia } from "@/lib/api/types";

type MediaKind = "movie" | "series";

type SelectedMediaState = {
  selected: Partial<Record<MediaKind, Record<number, APIMedia>>>;
  setSelectedMedia: (kind: MediaKind, media: APIMedia) => void;
  getSelectedMedia: (kind: MediaKind, mediaId: number) => APIMedia | undefined;
};

export const useSelectedMediaStore = create<SelectedMediaState>()(
  persist(
    (set, get) => ({
      selected: {},
      setSelectedMedia: (kind, media) => set((state) => ({
        selected: {
          ...state.selected,
          [kind]: { ...state.selected[kind], [Number(media.id)]: media },
        },
      })),
      getSelectedMedia: (kind, mediaId) => get().selected[kind]?.[mediaId],
    }),
    {
      name: "streamovie-selected",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selected: state.selected }),
    },
  ),
);
