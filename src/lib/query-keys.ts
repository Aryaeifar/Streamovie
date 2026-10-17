export const queryKeys = {
  all: ["streamovie"] as const,
  movies: (page: number, genreId: number, sort: string) => ["streamovie", "movies", { page, genreId, sort }] as const,
  series: (page: number, genreId: number, sort: string) => ["streamovie", "series", { page, genreId, sort }] as const,
  search: (query: string) => ["streamovie", "search", query] as const,
  seasons: (seriesId: number) => ["streamovie", "seasons", seriesId] as const,
  genres: ["streamovie", "genres"] as const,
  browse: (kind: string, sort: string, genreId: number) =>
    ["streamovie", "browse", { kind, sort, genreId }] as const,
};
