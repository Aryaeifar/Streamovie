import React, {useContext} from 'react';
import {Image, Platform, Pressable, StyleSheet, View} from 'react-native';
import {Text} from '../ui/Text';
import {SettingsContext} from '../../context/settings';
import {THEMES} from '../../lib/theme';
import type {AppTab, Locale} from '../../types/media';

type Props = {
  selected: AppTab | string;
  locale: Locale;
  accent: string;
  onSelect: (tab: AppTab) => void;
};

const items: {
  key: 'Home' | 'Search' | 'Saved' | 'Profile';
  label: string;
  icon: number;
}[] = [
  {
    key: 'Home',
    label: 'Home',
    icon: require('../../../assets/nav-icons/home.png'),
  },
  {
    key: 'Search',
    label: 'Search',
    icon: require('../../../assets/nav-icons/search.png'),
  },
  {
    key: 'Saved',
    label: 'Library',
    icon: require('../../../assets/nav-icons/saved.png'),
  },
  {
    key: 'Profile',
    label: 'Profile',
    icon: require('../../../assets/nav-icons/settings.png'),
  },
];

export function BottomNavigation({selected, onSelect}: Props) {
  const {theme, liquidGlass, openSettings, settingsOpen} =
    useContext(SettingsContext);
  const palette = THEMES[theme];

  const isTabSelected = (key: 'Home' | 'Search' | 'Saved' | 'Profile') => {
    if (key === 'Profile') return settingsOpen;
    if (key === 'Home') return selected === 'Home' && !settingsOpen;
    if (key === 'Saved') return selected === 'Saved' && !settingsOpen;
    if (key === 'Search') {
      return (
        !settingsOpen &&
        (selected === 'Search' ||
          selected === 'Movies' ||
          selected === 'Series' ||
          selected === 'Trending' ||
          selected === 'Top Movies' ||
          selected === 'Top Series')
      );
    }
    return false;
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        navStyles.outerWrapper,
        !liquidGlass && navStyles.outerWrapperDocked,
      ]}>
      <View
        style={[
          navStyles.bar,
          liquidGlass
            ? {
                backgroundColor: palette.glass ?? 'rgba(22, 26, 35, 0.88)',
                borderColor: 'rgba(255, 255, 255, 0.16)',
              }
            : {
                backgroundColor: palette.panel,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 0,
              },
        ]}>
        {liquidGlass ? <View style={navStyles.specularTopHighlight} /> : null}
        {items.map(item => {
          const active = isTabSelected(item.key);
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{selected: active}}
              onPress={() => {
                if (item.key === 'Profile') {
                  openSettings();
                } else {
                  onSelect(item.key);
                }
              }}
              style={[
                navStyles.item,
                active && navStyles.itemActive,
              ]}>
              {item.key === 'Profile' ? (
                <View
                  style={[
                    navStyles.profileAvatar,
                    {borderColor: active ? '#ffffff' : 'rgba(255,255,255,0.22)'},
                  ]}>
                  <View
                    style={[
                      navStyles.profileAvatarInner,
                      {backgroundColor: palette.accent},
                    ]}>
                    <Image
                      source={item.icon}
                      resizeMode="contain"
                      style={{width: 12, height: 12, tintColor: '#ffffff'}}
                    />
                  </View>
                </View>
              ) : (
                <Image
                  source={item.icon}
                  resizeMode="contain"
                  style={{
                    width: 19,
                    height: 19,
                    tintColor: active ? '#ffffff' : '#9ca3af',
                  }}
                />
              )}
              <Text
                numberOfLines={1}
                style={[
                  navStyles.label,
                  active && navStyles.labelActive,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const navStyles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    zIndex: 30,
  },
  outerWrapperDocked: {
    position: 'relative',
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  bar: {
    height: 60,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
  },
  specularTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginVertical: 6,
    marginHorizontal: 3,
    borderRadius: 999,
  },
  itemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  profileAvatar: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
  },
  labelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
