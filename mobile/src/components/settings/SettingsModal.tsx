import React, {useContext} from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import {Text} from '../ui/Text';
import type {Locale, ThemeId} from '../../types/media';
import {SettingsContext} from '../../context/settings';
import {THEMES} from '../../lib/theme';
import {styles} from '../styles';

type Props = {
  visible: boolean;
  locale: Locale;
  theme: ThemeId;
  isTV: boolean;
  showTop250Movies: boolean;
  showTop250Series: boolean;
  onClose: () => void;
  onLocale: (value: Locale) => void;
  onTheme: (value: ThemeId) => void;
  onShowTop250Movies: (value: boolean) => void;
  onShowTop250Series: (value: boolean) => void;
};

export function SettingsModal({
  visible,
  theme,
  isTV,
  showTop250Movies,
  showTop250Series,
  onClose,
  onTheme,
  onShowTop250Movies,
  onShowTop250Series,
}: Props) {
  const {liquidGlass, landscapeCards, setLiquidGlass, setLandscapeCards} =
    useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const themeIds = Object.keys(THEMES) as ThemeId[];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.settingsPanel,
              isTV && styles.settingsPanelTV,
              {
                backgroundColor: THEMES[theme].panel,
                borderColor: 'rgba(255, 255, 255, 0.14)',
              },
            ]}>
            <View style={styles.settingsHeader}>
              <View>
                <Text style={styles.settingsTitle}>Profile & Appearance</Text>
                <Text style={styles.settingsDescription}>
                  Customize your NuvioMobile theme and catalog preferences
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={styles.settingsClose}>
                <Text style={styles.settingsCloseText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.settingsOptions}
              contentContainerStyle={styles.settingsOptionsContent}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.settingsSectionTitle}>Theme</Text>
              <View style={styles.themeOptions}>
                {themeIds.map(id => {
                  const selected = theme === id;
                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      onPress={() => onTheme(id)}
                      style={[
                        styles.themeOption,
                        {width: `${isTV ? 32 : 48.5}%`},
                        selected && {
                          borderColor: THEMES[id].accent,
                          backgroundColor: `${THEMES[id].accent}1f`,
                        },
                      ]}>
                      <View
                        style={[
                          styles.themeSwatch,
                          {
                            backgroundColor: THEMES[id].bg,
                            borderColor: THEMES[id].accent,
                          },
                        ]}>
                        <View
                          style={[
                            styles.themeSwatchBar,
                            {backgroundColor: THEMES[id].accent},
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
                        {THEMES[id].label}
                        {selected ? '  ✓' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.settingsSectionTitle}>Layout & Cards</Text>
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

              <Text style={styles.settingsSectionTitle}>Catalog Rows</Text>
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
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.settingsDone}>
              <Text style={styles.settingsDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

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
