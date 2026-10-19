import React, {useContext, useState} from 'react';
import {Pressable, View} from 'react-native';
import type {Locale} from '../../types/media';
import {SettingsContext} from '../../context/settings';
import {THEMES} from '../../lib/theme';
import {Text} from './Text';
import {styles} from '../styles';

type Props = {
  locale: Locale;
  showTop250Movies: boolean;
  showTop250Series: boolean;
  sectionY: React.MutableRefObject<Record<string, number>>;
  scrollRef: React.RefObject<any>;
};

export function HomeSectionTabs({
  showTop250Movies,
  showTop250Series,
  sectionY,
  scrollRef,
}: Props) {
  const {theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [activeKey, setActiveKey] = useState('featured');
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  const tabs: [string, string][] = [
    ['Featured', 'featured'],
    ['Series', 'series'],
    ['Movies', 'movies'],
  ];
  if (showTop250Movies) {
    tabs.push(['Top 250 Movies', 'topMovies']);
  }
  if (showTop250Series) {
    tabs.push(['Top 250 Series', 'topSeries']);
  }

  return (
    <View style={styles.homeSectionTabs}>
      {tabs.map(([label, target]) => {
        const active = activeKey === target;
        const focused = focusedKey === target;
        return (
          <Pressable
            key={target}
            onFocus={() => setFocusedKey(target)}
            onBlur={() => setFocusedKey(null)}
            onPress={() => {
              setActiveKey(target);
              scrollRef.current?.scrollTo({
                y: sectionY.current[target] ?? 0,
                animated: true,
              });
            }}
            style={[
              styles.homeSectionTab,
              active && styles.homeSectionTabActive,
              focused && {borderColor: accent, borderWidth: 2},
            ]}>
            <Text
              style={[
                styles.homeSectionTabText,
                active && styles.homeSectionTabTextActive,
              ]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
