import React from 'react';
import {View} from 'react-native';
import type {Locale, ThemeId} from '../../types/media';
import {THEMES} from '../../lib/theme';
import {Text} from './Text';
import {styles} from '../styles';

type Props = {
  palette: (typeof THEMES)[ThemeId];
  locale: Locale;
  sectionTitle: string;
  sectionSubtitle: string;
  count: number;
};

export function CatalogIntro({
  sectionTitle,
  sectionSubtitle,
  count,
}: Props) {
  return (
    <View style={styles.listIntro}>
      <View style={styles.listTitleRow}>
        <View style={styles.listTitleCopy}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          {sectionSubtitle ? (
            <Text style={styles.listSubtitle}>{sectionSubtitle}</Text>
          ) : null}
        </View>
        <Text style={styles.resultCount}>{count} titles</Text>
      </View>
    </View>
  );
}
