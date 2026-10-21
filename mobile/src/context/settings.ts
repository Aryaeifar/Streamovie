import {createContext} from 'react';
import type {Locale, ProfileId, ThemeId, TVHomeLayout} from '../types/media';

export type AppSettings = {
  theme: ThemeId;
  locale: Locale;
  isPersian: boolean;
  showTop250Movies: boolean;
  showTop250Series: boolean;
  liquidGlass: boolean;
  landscapeCards: boolean;
  tvHomeLayout: TVHomeLayout;
  activeProfile: ProfileId;
  setTheme: (value: ThemeId) => void;
  setLocale: (value: Locale) => void;
  setShowTop250Movies: (value: boolean) => void;
  setShowTop250Series: (value: boolean) => void;
  setLiquidGlass: (value: boolean) => void;
  setLandscapeCards: (value: boolean) => void;
  setTvHomeLayout: (value: TVHomeLayout) => void;
  setActiveProfile: (value: ProfileId) => void;
  openSettings: () => void;
  closeSettings: () => void;
  settingsOpen: boolean;
};

export const SettingsContextDefault: AppSettings = {
  theme: 'streamovie',
  locale: 'en',
  isPersian: false,
  showTop250Movies: true,
  showTop250Series: true,
  liquidGlass: true,
  landscapeCards: false,
  tvHomeLayout: 'modern',
  activeProfile: 'main',
  setTheme: () => {},
  setLocale: () => {},
  setShowTop250Movies: () => {},
  setShowTop250Series: () => {},
  setLiquidGlass: () => {},
  setLandscapeCards: () => {},
  setTvHomeLayout: () => {},
  setActiveProfile: () => {},
  openSettings: () => {},
  closeSettings: () => {},
  settingsOpen: false,
};

export const SettingsContext = createContext<AppSettings>(SettingsContextDefault);
