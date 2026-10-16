import { apiKey, requestWithFallback, requireApiKey } from "@/lib/api/client";
import type { APISeason, APIMedia, MediaSort, SearchResponse } from "@/lib/api/types";

function key() {
  return encodeURIComponent(requireApiKey());
}

export const mediaApi = {
  fetchMovies(page = 0, genreId = 0, sort: MediaSort = "created") {
    return requestWithFallback<APIMedia[]>(`/api/movie/by/filtres/${genreId}/${encodeURIComponent(sort)}/${page}/${key()}`);
  },

  fetchSeries(page = 0, genreId = 0, sort: MediaSort = "created") {
    return requestWithFallback<APIMedia[]>(`/api/serie/by/filtres/${genreId}/${encodeURIComponent(sort)}/${page}/${key()}`);
  },

  search(query: string) {
    return requestWithFallback<SearchResponse>(`/api/search/${encodeURIComponent(query)}/${key()}/`).then((result) => result.posters);
  },

  fetchSeasons(seriesId: number) {
    return requestWithFallback<APISeason[]>(`/api/season/by/serie/${seriesId}/${key()}/`);
  },
};

export { apiKey };
