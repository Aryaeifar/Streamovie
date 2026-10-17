export interface APIMedia {
  id: number;
  title?: string;
  name?: string;
  poster?: string;
  poster_url?: string;
  image?: string;
  thumbnail?: string;
  year?: string | number;
  rate?: string | number;
  rating?: string | number;
  description?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface APISeason {
  id: number;
  [key: string]: unknown;
}

export interface APIGenre {
  id: number;
  title?: string;
  name?: string;
  [key: string]: unknown;
}

export interface APICountry {
  id: number;
  title: string;
  image: string;
}

export interface SearchResponse {
  posters: APIMedia[];
}

export type MediaSort = string;
