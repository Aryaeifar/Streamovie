export type OMDbRating = { Source: string; Value: string };
export type OMDbEpisode = {
  Title?: string;
  Released?: string;
  Episode?: string;
  imdbRating?: string;
  imdbID?: string;
  Season?: string;
};

export type OMDbSeries = {
  Title?: string;
  Year?: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Awards?: string;
  imdbRating?: string;
  imdbVotes?: string;
  imdbID?: string;
  totalSeasons?: string;
  Type?: string;
  Country?: string;
  Language?: string;
  Production?: string;
  Ratings?: OMDbRating[];
  Response?: "True" | "False";
  Error?: string;
};

export type OMDbSeason = {
  Title?: string;
  Season?: string;
  totalSeasons?: string;
  Episodes?: OMDbEpisode[];
  Response?: "True" | "False";
  Error?: string;
};

export async function fetchOMDbSeries(title: string, year?: string, imdbId?: string) {
  const params = new URLSearchParams({ title });
  if (year) params.set("year", year.match(/\d{4}/)?.[0] ?? year);
  if (imdbId) params.set("imdbId", imdbId);
  const response = await fetch(`/api/omdb?${params.toString()}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not load OMDb details");
  }
  return (await response.json()) as OMDbSeries;
}

export async function fetchOMDbSeason(title: string, season: number, year?: string, imdbId?: string) {
  const params = new URLSearchParams({ title, season: String(season) });
  if (year) params.set("year", year.match(/\d{4}/)?.[0] ?? year);
  if (imdbId) params.set("imdbId", imdbId);
  const response = await fetch(`/api/omdb?${params.toString()}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not load OMDb episodes");
  }
  return (await response.json()) as OMDbSeason;
}
