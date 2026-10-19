import React, {useState} from 'react';
import {Image, Pressable, StyleSheet, TextInput, View} from 'react-native';
import {Text} from './ui/Text';

type Props = {
  value: string;
  placeholder: string;
  isPersian: boolean;
  accent: string;
  filtersOpen: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onToggleFilters: () => void;
  onClear: () => void;
};

const SEARCH_ICON = require('../../assets/nav-icons/search.png');

export function SearchFilterBar({
  value,
  placeholder,
  accent,
  filtersOpen,
  onChange,
  onSubmit,
  onToggleFilters,
  onClear,
}: Props) {
  const [inputFocused, setInputFocused] = useState(false);
  const [filterFocused, setFilterFocused] = useState(false);

  return (
    <View style={barStyles.row}>
      <View
        style={[
          barStyles.box,
          inputFocused && {
            borderColor: accent,
            backgroundColor: 'rgba(24, 29, 40, 0.96)',
          },
        ]}>
        <Image
          source={SEARCH_ICON}
          resizeMode="contain"
          style={{
            width: 17,
            height: 17,
            tintColor: inputFocused ? accent : '#8b949e',
            marginRight: 6,
          }}
        />
        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#7d8597"
          returnKeyType="search"
          style={barStyles.input}
        />
        {value.trim() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={onClear}
            style={barStyles.clearInline}>
            <Text style={barStyles.clearText}>×</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle filters"
          onFocus={() => setFilterFocused(true)}
          onBlur={() => setFilterFocused(false)}
          onPress={onToggleFilters}
          style={[
            barStyles.filterPill,
            filtersOpen && barStyles.filterPillActive,
            filterFocused && {borderColor: accent, borderWidth: 2},
          ]}>
          <Text
            style={[
              barStyles.filterText,
              filtersOpen && barStyles.filterTextActive,
            ]}>
            Filters
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  box: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 999,
    backgroundColor: 'rgba(20, 24, 33, 0.90)',
  },
  input: {
    flex: 1,
    minHeight: 42,
    color: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  filterPill: {
    height: 32,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterPillActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d0d7de',
  },
  filterTextActive: {
    color: '#090b10',
    fontWeight: '700',
  },
  clearInline: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  clearText: {color: '#fff', fontSize: 16, lineHeight: 18},
});
