import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import type {AppTab, Locale} from '../../types/media';
type Props = {selected: AppTab | string; locale: Locale; accent: string; onSelect: (tab: AppTab) => void};
const items: {name: AppTab; en: string; fa: string; icon: number}[] = [
  {name: 'Home', en: 'Home', fa: 'خانه', icon: require('../../../assets/nav-icons/home.png')},
  {name: 'Movies', en: 'Movies', fa: 'فیلم‌ها', icon: require('../../../assets/nav-icons/movies.png')},
  {name: 'Series', en: 'Series', fa: 'سریال‌ها', icon: require('../../../assets/nav-icons/series.png')},
  {name: 'Trending', en: 'Trending', fa: 'محبوب', icon: require('../../../assets/nav-icons/trending.png')},
  {name: 'Saved', en: 'Saved', fa: 'ذخیره‌شده', icon: require('../../../assets/nav-icons/saved.png')},
];
export function BottomNavigation({selected, locale, accent, onSelect}: Props) {
  return <View style={[styles.bar, locale === 'fa' && styles.rtl]}>{items.map(item => { const active = selected === item.name; return <Pressable key={item.name} accessibilityRole="tab" accessibilityState={{selected: active}} onPress={() => onSelect(item.name)} style={[styles.item, active && {backgroundColor: `${accent}20`}]}><Image source={item.icon} resizeMode="contain" style={{width: 21, height: 21, tintColor: active ? accent : '#92929b'}} /><Text style={[styles.label, locale === 'fa' && styles.persian, active && {color: '#fff'}]}>{locale === 'fa' ? item.fa : item.en}</Text></Pressable>; })}</View>;
}
const styles = StyleSheet.create({bar: {height: 72, flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 28, backgroundColor: 'rgba(25,25,27,0.96)', paddingHorizontal: 7, marginHorizontal: 12, marginBottom: 7, overflow: 'hidden'}, rtl: {flexDirection: 'row-reverse'}, item: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, marginVertical: 6, borderRadius: 22}, label: {color: '#92929b', fontSize: 10, fontWeight: '600'}, persian: {fontFamily: 'Vazirmatn'}});
