import type {ThemeId} from '../types/media';

export const COLORS = {
  bg: '#07090d',
  tvBg: '#0d1118',
  panel: '#12161f',
  panel2: '#181e2a',
  glass: 'rgba(22, 26, 35, 0.86)',
  glassStrong: 'rgba(14, 17, 24, 0.94)',
  glassLight: 'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.16)',
  accent: '#58a6ff',
  accentSoft: 'rgba(88, 166, 255, 0.18)',
  text: '#ffffff',
  textSecondary: '#d0d7de',
  muted: '#8b949e',
  line: 'rgba(255, 255, 255, 0.12)',
  gold: '#fbbf24',
  danger: '#fb7185',
  success: '#34d399',
};

export type ThemePalette = {
  label: string;
  bg: string;
  tvBg?: string;
  panel: string;
  panel2?: string;
  glass?: string;
  accent: string;
  accentDark: string;
  text?: string;
  muted?: string;
};

export const THEMES: Record<ThemeId, ThemePalette> = {
  nuvio: {
    label: 'Streamovie',
    bg: '#07090d',
    tvBg: '#0e131b',
    panel: '#121721',
    panel2: '#1a212f',
    glass: 'rgba(22, 26, 35, 0.86)',
    accent: '#58a6ff',
    accentDark: '#2563eb',
  },
  netflix: {
    label: 'Crimson',
    bg: '#070709',
    tvBg: '#0f1015',
    panel: '#12131a',
    panel2: '#1a1c24',
    glass: 'rgba(20, 21, 28, 0.86)',
    accent: '#e50914',
    accentDark: '#b20710',
  },
  midnight: {
    label: 'Midnight Violet',
    bg: '#06060b',
    tvBg: '#0e0d18',
    panel: '#12101d',
    panel2: '#1b182b',
    glass: 'rgba(18, 16, 29, 0.86)',
    accent: '#a78bfa',
    accentDark: '#7c3aed',
  },
  aurora: {
    label: 'Aurora Emerald',
    bg: '#05090a',
    tvBg: '#0b1315',
    panel: '#0e1719',
    panel2: '#152326',
    glass: 'rgba(14, 23, 25, 0.86)',
    accent: '#34d399',
    accentDark: '#059669',
  },
  ocean: {
    label: 'Ocean Cyan',
    bg: '#050810',
    tvBg: '#0b1220',
    panel: '#0f1626',
    panel2: '#172238',
    glass: 'rgba(15, 22, 38, 0.86)',
    accent: '#38bdf8',
    accentDark: '#0284c7',
  },
  sunset: {
    label: 'Sunset Amber',
    bg: '#090605',
    tvBg: '#140e0b',
    panel: '#17110d',
    panel2: '#231913',
    glass: 'rgba(23, 17, 13, 0.86)',
    accent: '#fb923c',
    accentDark: '#ea580c',
  },
  candy: {
    label: 'Neon Rose',
    bg: '#09050b',
    tvBg: '#140c18',
    panel: '#170f1b',
    panel2: '#24172a',
    glass: 'rgba(23, 15, 27, 0.86)',
    accent: '#f472b6',
    accentDark: '#db2777',
  },
  noir: {
    label: 'Monochrome Noir',
    bg: '#070708',
    tvBg: '#101114',
    panel: '#141417',
    panel2: '#1e1e23',
    glass: 'rgba(20, 20, 23, 0.86)',
    accent: '#e4e4e7',
    accentDark: '#71717a',
  },
};
