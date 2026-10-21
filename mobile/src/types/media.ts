export type MediaKind = 'movie' | 'series';
export type AppTab =
  | 'Home'
  | 'Search'
  | 'Movies'
  | 'Series'
  | 'Trending'
  | 'Saved'
  | 'Top Movies'
  | 'Top Series';
export type TVHomeLayout = 'modern' | 'classic' | 'grid';
export type ProfileId = 'main' | 'cinema' | 'night' | 'kids';
export type Source = {quality: string; url: string};
export type Genre = {id: number; title: string};
export type Episode = {title: string; sources: Source[]};
export type Season = {title: string; episodes: Episode[]};
export type Media = {
  id: number;
  title: string;
  image: string;
  backdrop: string;
  year: string;
  rating: string;
  overview: string;
  kind: MediaKind;
  raw: Record<string, any>;
};
export type Locale = 'en' | 'fa';
export type ThemeId =
  | 'nuvio'
  | 'netflix'
  | 'midnight'
  | 'aurora'
  | 'ocean'
  | 'sunset'
  | 'candy'
  | 'noir';
export type NavIconName =
  | 'home'
  | 'movies'
  | 'series'
  | 'trending'
  | 'saved'
  | 'search'
  | 'top'
  | 'settings'
  | 'play';
