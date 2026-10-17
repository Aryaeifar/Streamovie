import { apiKey, requestWithFallback, requireApiKey } from "@/lib/api/client";
import type { APICountry, APIGenre, APISeason, APIMedia, MediaSort, SearchResponse } from "@/lib/api/types";

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

  fetchCountries() {
    return requestWithFallback<APICountry[]>(`/api/country/all/${key()}/`);
  },

  fetchMediaByCountry(countryId: number, page = 0, sort: MediaSort = "created") {
    return requestWithFallback<APIMedia[]>(`/api/poster/by/filtres/0/${countryId}/${encodeURIComponent(sort)}/${page}/${key()}`);
  },

  search(query: string) {
    return requestWithFallback<SearchResponse>(`/api/search/${encodeURIComponent(query)}/${key()}/`).then((result) => result.posters);
  },

  fetchSeasons(seriesId: number) {
    return requestWithFallback<APISeason[]>(`/api/season/by/serie/${seriesId}/${key()}/`);
  },

  fetchGenres() {
    return requestWithFallback<APIGenre[]>(`/api/genre/all/${key()}/`);
  },
};

export { apiKey };
