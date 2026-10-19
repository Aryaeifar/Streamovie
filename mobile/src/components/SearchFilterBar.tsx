import React from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';
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

export function SearchFilterBar({value, placeholder, isPersian, accent, filtersOpen, onChange, onSubmit, onToggleFilters, onClear}: Props) {
  return <View style={[styles.row, isPersian && styles.rowRtl]}>
    <View style={[styles.box, {borderColor: `${accent}44`}, isPersian && styles.rowRtl]}>
      <Text style={styles.glyph}>⌕</Text>
      <TextInput value={value} onChangeText={onChange} onSubmitEditing={onSubmit} placeholder={placeholder} placeholderTextColor="#aaa6ba" returnKeyType="search" style={[styles.input, isPersian ? styles.rtlText : styles.ltrText]} />
      <Pressable accessibilityRole="button" accessibilityLabel={isPersian ? 'باز کردن فیلترها' : 'Open filters'} onPress={onToggleFilters} style={[styles.filter, filtersOpen && {backgroundColor: `${accent}22`}] }><Text style={[styles.filterText, {color: accent}]}>☷</Text></Pressable>
    </View>
    {value.trim() ? <Pressable accessibilityRole="button" accessibilityLabel={isPersian ? 'پاک کردن جستجو' : 'Clear search'} onPress={onClear} style={styles.clear}><Text style={styles.clearText}>×</Text></Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 8, paddingHorizontal: 18},
  rowRtl: {flexDirection: 'row-reverse'},
  box: {flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderWidth: 1, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.055)'},
  glyph: {color: '#aaa', fontSize: 24, marginHorizontal: 5},
  input: {flex: 1, minHeight: 48, color: '#f6f3ff', paddingHorizontal: 9, paddingVertical: 8, fontSize: 15},
  rtlText: {fontFamily: 'Vazirmatn', writingDirection: 'rtl', textAlign: 'right'},
  ltrText: {writingDirection: 'ltr', textAlign: 'left'},
  filter: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.07)'},
  filterText: {fontSize: 23, fontWeight: '700'},
  clear: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)'},
  clearText: {color: '#fff', fontSize: 22},
});
