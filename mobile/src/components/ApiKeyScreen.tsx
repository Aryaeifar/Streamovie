import React from 'react';
import {TextInput, View} from 'react-native';
import type {Locale} from '../types/media';
import type {THEMES} from '../lib/theme';
import {Text} from './ui/Text';
import {Action} from './ui/Button';
import {styles} from './styles';

type Props = {
  locale: Locale;
  isPersian: boolean;
  palette: (typeof THEMES)[keyof typeof THEMES];
  keyInput: string;
  onChangeKey: (value: string) => void;
  onSubmit: () => void;
};

export function ApiKeyScreen({
  palette,
  keyInput,
  onChangeKey,
  onSubmit,
}: Props) {
  return (
    <View style={[styles.safe, {backgroundColor: palette.bg}]}>
      <View style={styles.keyPanel}>
        <View style={[styles.keyCard, {backgroundColor: palette.panel}]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <View style={[styles.brandMark, {backgroundColor: palette.accent}]}>
              <Text style={styles.brandMarkText}>S</Text>
            </View>
            <View>
              <Text style={styles.brand}>Streamovie</Text>
              <Text style={styles.tagline}>Media Catalog Hub</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Connect your catalog</Text>
          <Text style={styles.body}>
            Enter your Streamovie API key to load movies, series, ratings, and streams. The key is stored locally on this device.
          </Text>
          <View style={styles.searchBox}>
            <TextInput
              value={keyInput}
              onChangeText={onChangeKey}
              placeholder="Catalog API key"
              placeholderTextColor="#7d8597"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={[styles.searchInput, styles.ltrInput]}
            />
          </View>
          <Action label="Continue" active onPress={onSubmit} />
        </View>
      </View>
    </View>
  );
}
