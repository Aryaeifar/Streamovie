import React from 'react';
import {View} from 'react-native';
import type {AppTab, Locale, Media} from '../types/media';
import type {THEMES} from '../lib/theme';
import {SearchFilterBar} from './SearchFilterBar';
import {Action} from './ui/Button';
import {styles} from './styles';

type Props = {
  selected: Media | null;
  tab: AppTab;
  searchDraft: string;
  isTV: boolean;
  isSearching?: boolean;
  resultCount?: number;
  palette: (typeof THEMES)[keyof typeof THEMES];
  locale: Locale;
  isPersian: boolean;
  onBack: () => void;
  onSettings: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onClearSearch: () => void;
};

export function AppHeader({
  selected,
  tab,
  searchDraft,
  isTV,
  isSearching = false,
  resultCount,
  palette,
  onBack,
  onSearchChange,
  onSearchSubmit,
  filtersOpen,
  onToggleFilters,
  onClearSearch,
}: Props) {
  if (selected) {
    return (
      <View style={[styles.pageHeader, isTV && styles.pageHeaderTV]}>
        <View style={styles.brandRow}>
          <Action label="‹  Back" onPress={onBack} />
        </View>
      </View>
    );
  }

  // On Home screen (without active search), Streamovie keeps the top completely clean
  if (tab === 'Home' && !searchDraft.trim()) {
    return null;
  }

  return (
    <View style={{paddingTop: isTV ? 16 : 10, paddingBottom: 6}}>
      {tab !== 'Saved' ? (
        <View style={isTV ? styles.tvSearchRow : undefined}>
          <SearchFilterBar
            value={searchDraft}
            placeholder="Search movies, series, genres..."
            isPersian={false}
            accent={palette.accent}
            isTV={isTV}
            isSearching={isSearching}
            resultCount={resultCount}
            filtersOpen={filtersOpen}
            showSuggestions={tab === 'Search'}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
            onToggleFilters={onToggleFilters}
            onClear={onClearSearch}
          />
        </View>
      ) : null}
    </View>
  );
}
