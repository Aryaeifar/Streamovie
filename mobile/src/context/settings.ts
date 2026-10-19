import {createContext} from 'react';
import type {Locale, ThemeId} from '../types/media';

export type AppSettings = {theme: ThemeId; locale: Locale; isPersian: boolean; showTop250Movies: boolean; showTop250Series: boolean; setTheme: (value: ThemeId) => void; setLocale: (value: Locale) => void; setShowTop250Movies: (value: boolean) => void; setShowTop250Series: (value: boolean) => void; openSettings: () => void; closeSettings: () => void; settingsOpen: boolean};
export const SettingsContextDefault: AppSettings = {theme: 'netflix', locale: 'fa', isPersian: true, showTop250Movies: true, showTop250Series: true, setTheme: () => {}, setLocale: () => {}, setShowTop250Movies: () => {}, setShowTop250Series: () => {}, openSettings: () => {}, closeSettings: () => {}, settingsOpen: false};
export const SettingsContext = createContext<AppSettings>(SettingsContextDefault);
