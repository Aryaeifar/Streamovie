import type {ThemeId} from '../types/media';
export const COLORS = {bg: '#080808', panel: '#141414', panel2: '#202020', accent: '#e50914', accentSoft: '#471015', text: '#f6f3ff', muted: '#aaa6ba', line: 'rgba(255,255,255,0.10)'};
export const THEMES: Record<ThemeId, {label: string; bg: string; panel: string; accent: string; accentDark: string; text?: string; muted?: string}> = {
  netflix: {label: 'Netflix', bg: '#080808', panel: '#141414', accent: '#e50914', accentDark: '#b20710'},
  midnight: {label: 'Midnight', bg: '#06060b', panel: '#15121c', accent: '#a78bfa', accentDark: '#d946ef'},
  aurora: {label: 'Aurora', bg: '#04090a', panel: '#101819', accent: '#34d399', accentDark: '#22d3ee'},
  ocean: {label: 'Ocean', bg: '#04070f', panel: '#101522', accent: '#38bdf8', accentDark: '#6366f1'},
  sunset: {label: 'Sunset', bg: '#0b0704', panel: '#19100b', accent: '#fb923c', accentDark: '#f43f5e'},
  candy: {label: 'Candy', bg: '#0b050c', panel: '#1a101c', accent: '#f472b6', accentDark: '#a855f7'},
  noir: {label: 'Noir', bg: '#0a0a0a', panel: '#181818', accent: '#a1a1aa', accentDark: '#71717a'},
  light: {label: 'Light', bg: '#f5f5f7', panel: '#ffffff', accent: '#e50914', accentDark: '#b20710', text: '#111111', muted: '#555555'},
};
