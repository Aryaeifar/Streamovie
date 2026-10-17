import type { Dictionary } from "@/i18n/dictionaries/en";

export type BrowseKind = "all" | "movie" | "series";
export type BrowseSort = "created" | "imdb";

type HomeKey = keyof Dictionary["home"];

export type BrowseCategory = {
  slug: string;
  kind: BrowseKind;
  sort: BrowseSort;
  titleKey: HomeKey;
  subtitleKey: HomeKey;
};

export const browseCategories: BrowseCategory[] = [
  { slug: "trending", kind: "all", sort: "created", titleKey: "trending", subtitleKey: "trendingSubtitle" },
  { slug: "movies", kind: "movie", sort: "created", titleKey: "movies", subtitleKey: "moviesSubtitle" },
  { slug: "series", kind: "series", sort: "created", titleKey: "seriesRow", subtitleKey: "seriesSubtitle" },
  { slug: "imdb-movies", kind: "movie", sort: "imdb", titleKey: "imdbMovies", subtitleKey: "imdbMoviesSubtitle" },
  { slug: "imdb-series", kind: "series", sort: "imdb", titleKey: "imdbSeries", subtitleKey: "imdbSeriesSubtitle" },
];

export function getBrowseCategory(slug: string): BrowseCategory | undefined {
  return browseCategories.find((category) => category.slug === slug);
}
