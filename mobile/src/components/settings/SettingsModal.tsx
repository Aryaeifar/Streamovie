import React, {useContext, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '../ui/Text';
import type {Locale, ThemeId} from '../../types/media';
import {SettingsContext} from '../../context/settings';
import {THEMES} from '../../lib/theme';
import {styles} from '../styles';

type Props = {
  visible?: boolean;
  locale: Locale;
  theme: ThemeId;
  isTV: boolean;
  showTop250Movies: boolean;
  showTop250Series: boolean;
  savedCount?: number;
  onClose: () => void;
  onLocale: (value: Locale) => void;
  onTheme: (value: ThemeId) => void;
  onShowTop250Movies: (value: boolean) => void;
  onShowTop250Series: (value: boolean) => void;
};

export function ProfileScreen({
  visible = true,
  theme,
  isTV,
  showTop250Movies,
  showTop250Series,
  savedCount = 0,
  onClose,
  onTheme,
  onShowTop250Movies,
  onShowTop250Series,
}: Props) {
  const {liquidGlass, landscapeCards, setLiquidGlass, setLandscapeCards} =
    useContext(SettingsContext);
  const palette = THEMES[theme];
  const accent = palette.accent;
  const themeIds = Object.keys(THEMES) as ThemeId[];
  const [selectedTheme, setSelectedTheme] = useState(theme);

  if (!visible) return null;

  return (
    <View style={[localStyles.root, {backgroundColor: palette.bg}]}>
      <SafeAreaView style={localStyles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={localStyles.scroll}
          contentContainerStyle={localStyles.content}
          showsVerticalScrollIndicator={false}>
          {/* Top app bar */}
          <View style={localStyles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[localStyles.backButton, {borderColor: 'rgba(255,255,255,0.14)'}]}>
              <Text style={localStyles.backText}>‹  Back</Text>
            </Pressable>
            <View style={localStyles.titleWrap}>
              <Text style={localStyles.title}>Profile</Text>
              <Text style={localStyles.subtitle}>Manage your Streamovie experience</Text>
            </View>
            <View style={localStyles.topSpacer} />
          </View>

          {/* Hero card */}
          <View
            style={[
              localStyles.heroCard,
              {backgroundColor: palette.panel, borderColor: 'rgba(255,255,255,0.10)'},
            ]}>
            <View
              style={[
                localStyles.avatar,
                {backgroundColor: accent, shadowColor: accent},
              ]}>
              <Text style={localStyles.avatarText}>S</Text>
            </View>
            <View style={localStyles.heroCopy}>
              <Text style={localStyles.heroTitle}>Streamovie Member</Text>
              <Text style={localStyles.heroSubtitle}>
                Personalized catalog, themes, and layout preferences
              </Text>
            </View>
            <View
              style={[
                localStyles.statusPill,
                {backgroundColor: `${accent}22`, borderColor: `${accent}55`},
              ]}>
              <View style={[localStyles.statusDot, {backgroundColor: accent}]} />
              <Text style={[localStyles.statusText, {color: accent}]}>Connected</Text>
            </View>
          </View>

          {/* Quick stats */}
          <View style={localStyles.statsRow}>
            <View style={[localStyles.statCard, {backgroundColor: palette.panel}]}>
              <Text style={localStyles.statValue}>{savedCount}</Text>
              <Text style={localStyles.statLabel}>Saved titles</Text>
            </View>
            <View style={[localStyles.statCard, {backgroundColor: palette.panel}]}>
              <Text style={localStyles.statValue}>{palette.label}</Text>
              <Text style={localStyles.statLabel}>Active theme</Text>
            </View>
            <View style={[localStyles.statCard, {backgroundColor: palette.panel}]}>
              <Text style={localStyles.statValue}>
                {landscapeCards ? 'Wide' : 'Portrait'}
              </Text>
              <Text style={localStyles.statLabel}>Card layout</Text>
            </View>
          </View>

          {/* Appearance */}
          <View style={[localStyles.sectionCard, {backgroundColor: palette.panel}]}>
            <View style={localStyles.sectionHeader}>
              <Text style={localStyles.sectionTitle}>Appearance</Text>
              <Text style={localStyles.sectionHint}>Choose a theme for the whole app</Text>
            </View>
            <View style={styles.themeOptions}>
              {themeIds.map(id => {
                const selected = theme === id;
                const itemPalette = THEMES[id];
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedTheme(id);
                      onTheme(id);
                    }}
                    style={[
                      styles.themeOption,
                      {width: `${isTV ? 32 : 48.5}%`},
                      selected && {
                        borderColor: itemPalette.accent,
                        backgroundColor: `${itemPalette.accent}1f`,
                      },
                    ]}>
                    <View
                      style={[
                        styles.themeSwatch,
                        {
                          backgroundColor: itemPalette.bg,
                          borderColor: itemPalette.accent,
                        },
                      ]}>
                      <View
                        style={[
                          styles.themeSwatchBar,
                          {backgroundColor: itemPalette.accent},
                        ]}
                      />
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: '800',
                        }}>
                        N
                      </Text>
                    </View>
                    <Text numberOfLines={1} style={styles.themeName}>
                      {itemPalette.label}
                      {selected ? '  ✓' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Layout & Cards */}
          <View style={[localStyles.sectionCard, {backgroundColor: palette.panel}]}>
            <View style={localStyles.sectionHeader}>
              <Text style={localStyles.sectionTitle}>Layout & Cards</Text>
              <Text style={localStyles.sectionHint}>Customize navigation and cards</Text>
            </View>
            {!isTV ? (
              <SettingsToggle
                label="Liquid Glass floating bottom bar"
                value={liquidGlass}
                accent={accent}
                onChange={setLiquidGlass}
              />
            ) : null}
            <SettingsToggle
              label="Landscape widescreen cards on catalog rails"
              value={landscapeCards}
              accent={accent}
              onChange={setLandscapeCards}
            />
          </View>

          {/* Catalog Rows */}
          <View style={[localStyles.sectionCard, {backgroundColor: palette.panel}]}>
            <View style={localStyles.sectionHeader}>
              <Text style={localStyles.sectionTitle}>Catalog Rows</Text>
              <Text style={localStyles.sectionHint}>Show or hide home rows</Text>
            </View>
            <SettingsToggle
              label="Show IMDb Top 250 Movies row"
              value={showTop250Movies}
              accent={accent}
              onChange={onShowTop250Movies}
            />
            <SettingsToggle
              label="Show IMDb Top 250 Series row"
              value={showTop250Series}
              accent={accent}
              onChange={onShowTop250Series}
            />
          </View>

          {/* About */}
          <View style={[localStyles.sectionCard, {backgroundColor: palette.panel}]}>
            <View style={localStyles.sectionHeader}>
              <Text style={localStyles.sectionTitle}>About</Text>
              <Text style={localStyles.sectionHint}>Streamovie mobile experience</Text>
            </View>
            <View style={localStyles.aboutRow}>
              <Text style={localStyles.aboutLabel}>Version</Text>
              <Text style={localStyles.aboutValue}>0.0.1</Text>
            </View>
            <View style={localStyles.aboutRow}>
              <Text style={localStyles.aboutLabel}>Platform</Text>
              <Text style={localStyles.aboutValue}>{isTV ? 'Android TV' : 'Android'}</Text>
            </View>
            <View style={localStyles.aboutRow}>
              <Text style={localStyles.aboutLabel}>Theme</Text>
              <Text style={localStyles.aboutValue}>{THEMES[selectedTheme].label}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[localStyles.doneButton, {backgroundColor: accent}]}>
            <Text style={localStyles.doneText}>Done</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export const SettingsModal = ProfileScreen;

function SettingsToggle({
  label,
  value,
  accent,
  onChange,
}: {
  label: string;
  value: boolean;
  accent: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingToggleRow}>
      <Text style={styles.settingToggleText}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: '#2a303c', true: `${accent}88`}}
        thumbColor={value ? accent : '#9ca3af'}
        accessibilityLabel={label}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  root: {flex: 1},
  safeArea: {flex: 1},
  scroll: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120, gap: 14},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  backButton: {
    minWidth: 74,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {color: '#f0f4f8', fontSize: 13, fontWeight: '700'},
  titleWrap: {flex: 1, alignItems: 'center'},
  title: {color: '#ffffff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3},
  subtitle: {color: '#8b949e', fontSize: 12, marginTop: 2},
  topSpacer: {width: 74},
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 8,
  },
  avatarText: {color: '#ffffff', fontSize: 26, fontWeight: '800'},
  heroCopy: {flex: 1, gap: 4},
  heroTitle: {color: '#ffffff', fontSize: 17, fontWeight: '700'},
  heroSubtitle: {color: '#8b949e', fontSize: 12, lineHeight: 17},
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {width: 7, height: 7, borderRadius: 3.5},
  statusText: {fontSize: 11, fontWeight: '700'},
  statsRow: {flexDirection: 'row', gap: 10},
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  statValue: {color: '#ffffff', fontSize: 15, fontWeight: '800'},
  statLabel: {color: '#8b949e', fontSize: 11, fontWeight: '600'},
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  sectionHeader: {gap: 2, marginBottom: 6},
  sectionTitle: {color: '#ffffff', fontSize: 16, fontWeight: '700'},
  sectionHint: {color: '#8b949e', fontSize: 12},
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  aboutLabel: {color: '#c9d1d9', fontSize: 13, fontWeight: '600'},
  aboutValue: {color: '#8b949e', fontSize: 13, fontWeight: '600'},
  doneButton: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneText: {color: '#090b10', fontSize: 14, fontWeight: '800'},
});
