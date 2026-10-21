import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {Text} from './ui/Text';

type Props = {
  value: string;
  placeholder: string;
  isPersian: boolean;
  accent: string;
  isTV?: boolean;
  isSearching?: boolean;
  resultCount?: number;
  filtersOpen: boolean;
  showSuggestions?: boolean;
  quickSuggestions?: string[];
  onChange: (value: string) => void;
  onSubmit: () => void;
  onToggleFilters: () => void;
  onClear: () => void;
};

const SEARCH_ICON = require('../../assets/nav-icons/search.png');

const DEFAULT_SUGGESTIONS = [
  'Action',
  'Sci-Fi',
  'Drama',
  'Thriller',
  'Crime',
  'Comedy',
  'Animation',
  'Mystery',
];

export function SearchFilterBar({
  value,
  placeholder,
  accent,
  isTV = false,
  isSearching = false,
  resultCount,
  filtersOpen,
  showSuggestions = true,
  quickSuggestions = DEFAULT_SUGGESTIONS,
  onChange,
  onSubmit,
  onToggleFilters,
  onClear,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [clearFocused, setClearFocused] = useState(false);
  const [filterFocused, setFilterFocused] = useState(false);
  const [focusedChip, setFocusedChip] = useState<string | null>(null);

  const hasQuery = value.trim().length > 0;

  return (
    <View style={[barStyles.wrapper, isTV && barStyles.wrapperTV]}>
      <View style={[barStyles.row, isTV && barStyles.rowTV]}>
        {/* Standard Search Input Bar */}
        <Pressable
          accessible={false}
          onPress={() => inputRef.current?.focus()}
          style={[
            barStyles.box,
            isTV && barStyles.boxTV,
            inputFocused && [
              barStyles.boxFocused,
              {
                borderColor: accent,
                backgroundColor: isTV
                  ? 'rgba(18, 22, 32, 0.98)'
                  : 'rgba(16, 19, 28, 0.96)',
              },
            ],
          ]}>
          <Image
            source={SEARCH_ICON}
            resizeMode="contain"
            style={[
              barStyles.searchIcon,
              isTV && barStyles.searchIconTV,
              {tintColor: inputFocused || hasQuery ? accent : '#8b8ba0'},
            ]}
          />

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChange}
            onSubmitEditing={onSubmit}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={placeholder}
            placeholderTextColor="#6f6f85"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            style={[barStyles.input, isTV && barStyles.inputTV]}
          />

          {/* Live Debounced Search Status or Result Count */}
          {isSearching ? (
            <View style={barStyles.statusBadge}>
              <ActivityIndicator size="small" color={accent} />
              {isTV ? (
                <Text style={[barStyles.statusText, {color: accent}]}>
                  Searching…
                </Text>
              ) : null}
            </View>
          ) : hasQuery && typeof resultCount === 'number' ? (
            <View style={barStyles.countPill}>
              <Text style={barStyles.countPillText}>{resultCount}</Text>
            </View>
          ) : null}

          {/* Clear Search Button */}
          {hasQuery ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onFocus={() => setClearFocused(true)}
              onBlur={() => setClearFocused(false)}
              onPress={() => {
                onClear();
                inputRef.current?.focus();
              }}
              hitSlop={8}
              style={[
                barStyles.clearButton,
                isTV && barStyles.clearButtonTV,
                clearFocused && {
                  borderColor: accent,
                  backgroundColor: 'rgba(255, 255, 255, 0.20)',
                },
              ]}>
              <Text style={[barStyles.clearText, isTV && barStyles.clearTextTV]}>
                ×
              </Text>
            </Pressable>
          ) : null}
        </Pressable>

        {/* Standard Filter Toggle Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle filters"
          onFocus={() => setFilterFocused(true)}
          onBlur={() => setFilterFocused(false)}
          onPress={onToggleFilters}
          style={[
            barStyles.filterButton,
            isTV && barStyles.filterButtonTV,
            filtersOpen && barStyles.filterButtonActive,
            filterFocused && {
              borderColor: accent,
              transform: [{scale: 1.03}],
            },
          ]}>
          <Text
            style={[
              barStyles.filterText,
              isTV && barStyles.filterTextTV,
              filtersOpen && barStyles.filterTextActive,
            ]}>
            Filters
          </Text>
        </Pressable>
      </View>

      {/* Quick Search Suggestion Chips for TV & Mobile */}
      {showSuggestions && quickSuggestions.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={barStyles.suggestionsRow}>
          {quickSuggestions.map(term => {
            const active = value.trim().toLowerCase() === term.toLowerCase();
            const focused = focusedChip === term;
            return (
              <Pressable
                key={term}
                accessibilityRole="button"
                accessibilityLabel={`Search ${term}`}
                onFocus={() => setFocusedChip(term)}
                onBlur={() =>
                  setFocusedChip(prev => (prev === term ? null : prev))
                }
                onPress={() => {
                  if (active) {
                    onClear();
                  } else {
                    onChange(term);
                  }
                }}
                style={[
                  barStyles.suggestionChip,
                  isTV && barStyles.suggestionChipTV,
                  active && {
                    backgroundColor: `${accent}26`,
                    borderColor: accent,
                  },
                  focused && {
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.14)',
                    transform: [{scale: 1.04}],
                  },
                ]}>
                <Text
                  style={[
                    barStyles.suggestionChipText,
                    isTV && barStyles.suggestionChipTextTV,
                    (active || focused) && {color: '#ffffff', fontWeight: '700'},
                  ]}>
                  {term}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 10,
  },
  wrapperTV: {
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowTV: {
    gap: 12,
  },
  box: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 999,
    backgroundColor: 'rgba(12, 14, 22, 0.85)',
  },
  boxTV: {
    minHeight: 54,
    paddingLeft: 18,
    paddingRight: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(12, 14, 22, 0.92)',
  },
  boxFocused: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  searchIcon: {
    width: 17,
    height: 17,
    marginRight: 10,
  },
  searchIconTV: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    minHeight: 42,
    color: '#f6f6fb',
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  inputTV: {
    minHeight: 48,
    fontSize: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 6,
  },
  countPillText: {
    color: '#a9a9bd',
    fontSize: 11,
    fontWeight: '700',
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  clearButtonTV: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
  },
  clearText: {
    color: '#f6f6fb',
    fontSize: 17,
    lineHeight: 19,
    fontWeight: '600',
  },
  clearTextTV: {
    fontSize: 20,
    lineHeight: 22,
  },
  filterButton: {
    height: 46,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterButtonTV: {
    height: 54,
    paddingHorizontal: 22,
    borderWidth: 1.5,
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d5d5e2',
  },
  filterTextTV: {
    fontSize: 14.5,
  },
  filterTextActive: {
    color: '#090b10',
    fontWeight: '700',
  },
  suggestionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  suggestionChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  suggestionChipTV: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  suggestionChipText: {
    color: '#a9a9bd',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionChipTextTV: {
    fontSize: 13.5,
  },
});
