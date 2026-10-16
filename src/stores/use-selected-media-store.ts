import { create } from "zustand";
import type { APIMedia } from "@/lib/api/types";

type SelectedMediaState = {
  selected: Partial<Record<"movie" | "series", Record<number, APIMedia>>>;
  setSelectedMedia: (kind: "movie" | "series", media: APIMedia) => void;
  getSelectedMedia: (kind: "movie" | "series", mediaId: number) => APIMedia | undefined;
};

export const useSelectedMediaStore = create<SelectedMediaState>((set, get) => ({
  selected: {},
  setSelectedMedia: (kind, media) => set((state) => ({
    selected: {
      ...state.selected,
      [kind]: { ...state.selected[kind], [Number(media.id)]: media },
    },
  })),
  getSelectedMedia: (kind, mediaId) => get().selected[kind]?.[mediaId],
}));
