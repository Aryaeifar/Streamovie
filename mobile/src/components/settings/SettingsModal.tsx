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
import type {
  Locale,
  ProfileId,
  ThemeId,
  TVHomeLayout,
} from '../../types/media';
import {SettingsContext} from '../../context/settings';
import {THEMES} from '../../lib/theme';

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

const HOUSEHOLD_PROFILES: {
  id: ProfileId;
  name: string;
  badge: string;
  initial: string;
  color: string;
  subtitle: string;
}[] = [
  {
    id: 'main',
    name: 'Alex',
    badge: 'PRIMARY',
    initial: 'A',
    color: '#58a6ff',
    subtitle: 'Personal library & 4K streams',
  },
  {
    id: 'cinema',
    name: 'Cinema',
    badge: 'HOME THEATER',
    initial: 'C',
    color: '#a78bfa',
    subtitle: 'Curated films & Top 250',
  },
  {
    id: 'night',
    name: 'Night Owl',
    badge: 'LATE NIGHT',
    initial: 'N',
    color: '#34d399',
    subtitle: 'Thrillers, sci-fi & series',
  },
  {
    id: 'kids',
    name: 'Family',
    badge: 'SHARED',
    initial: 'F',
    color: '#fb923c',
    subtitle: 'Animation & family favorites',
  },
];

type MobileSectionFilter = 'all' | 'themes' | 'interface' | 'catalog' | 'system';

type TVSettingsCategory =
  | 'profiles'
  | 'appearance'
  | 'layout'
  | 'catalog'
  | 'about';

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
  const {
    liquidGlass,
    landscapeCards,
    tvHomeLayout,
    activeProfile,
    setLiquidGlass,
    setLandscapeCards,
    setTvHomeLayout,
    setActiveProfile,
  } = useContext(SettingsContext);

  const palette = THEMES[theme];
  const accent = palette.accent;
  const themeIds = Object.keys(THEMES) as ThemeId[];
  const [mobileFilter, setMobileFilter] = useState<MobileSectionFilter>('all');
  const [tvCategory, setTvCategory] = useState<TVSettingsCategory>('appearance');
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  if (!visible || isTV) return null;

  const activeProfileObj =
    HOUSEHOLD_PROFILES.find(p => p.id === activeProfile) ??
    HOUSEHOLD_PROFILES[0];

  const handleResetDefaults = () => {
    onTheme('streamovie');
    setLiquidGlass(true);
    setLandscapeCards(false);
    setTvHomeLayout('modern');
    onShowTop250Movies(true);
    onShowTop250Series(true);
  };

  // ============================================================================
  // ANDROID TV: Settings & Profile removed on Android TV
  // ============================================================================
  if (isTV) {
    const tvCategories: {
      id: TVSettingsCategory;
      title: string;
      subtitle: string;
      glyph: string;
    }[] = [
      {
        id: 'profiles',
        title: 'Who’s Watching',
        subtitle: `Active: ${activeProfileObj.name}`,
        glyph: '◎',
      },
      {
        id: 'appearance',
        title: 'Appearance & Theme',
        subtitle: palette.label,
        glyph: '◐',
      },
      {
        id: 'layout',
        title: 'Home & Card Layout',
        subtitle: `${tvHomeLayout.toUpperCase()} • ${
          landscapeCards ? '16:9 Wide' : '2:3 Poster'
        }`,
        glyph: '⊞',
      },
      {
        id: 'catalog',
        title: 'Catalog & IMDb Rows',
        subtitle: 'Home screen shelves',
        glyph: '★',
      },
      {
        id: 'about',
        title: 'About Streamovie TV',
        subtitle: 'v1.1.0 • Streamovie Engine',
        glyph: 'ⓘ',
      },
    ];

    const tvLayouts: {
      id: TVHomeLayout;
      title: string;
      desc: string;
    }[] = [
      {
        id: 'modern',
        title: 'Modern View (Recommended)',
        desc: 'Dynamic full-bleed hero stage that updates live as you move D-pad focus across rows.',
      },
      {
        id: 'classic',
        title: 'Classic View',
        desc: 'Auto-rotating featured spotlight banner at the top with classic horizontal shelves.',
      },
      {
        id: 'grid',
        title: 'Grid View',
        desc: 'High-density 5-column poster wall with quick category filter tabs and live hero preview.',
      },
    ];

    return (
      <View
        style={[
          tvStyles.root,
          {backgroundColor: palette.tvBg ?? palette.bg},
        ]}>
        {/* Top Header */}
        <View style={tvStyles.headerBar}>
          <View>
            <Text style={tvStyles.headerEyebrow}>STREAMOVIE TV CONFIGURATION</Text>
            <Text style={tvStyles.headerTitle}>Settings & Profiles</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onFocus={() => setFocusedKey('tv-close')}
            onBlur={() => setFocusedKey(null)}
            onPress={onClose}
            style={[
              tvStyles.closeBtn,
              focusedKey === 'tv-close' && {
                borderColor: accent,
                backgroundColor: `${accent}26`,
                transform: [{scale: 1.04}],
              },
            ]}>
            <Text style={tvStyles.closeBtnText}>←  Back to Home</Text>
          </Pressable>
        </View>

        {/* Hub-and-Spoke Two-Pane Body */}
        <View style={tvStyles.bodyRow}>
          {/* Left Category Rail */}
          <View
            style={[
              tvStyles.sidebarRail,
              {backgroundColor: palette.panel},
            ]}>
            {tvCategories.map(cat => {
              const selected = tvCategory === cat.id;
              const focused = focusedKey === `cat-${cat.id}`;
              return (
                <Pressable
                  key={cat.id}
                  accessibilityRole="tab"
                  accessibilityState={{selected}}
                  onFocus={() => {
                    setFocusedKey(`cat-${cat.id}`);
                    setTvCategory(cat.id);
                  }}
                  onBlur={() => setFocusedKey(null)}
                  onPress={() => setTvCategory(cat.id)}
                  style={[
                    tvStyles.categoryItem,
                    selected && {
                      backgroundColor: 'rgba(255,255,255,0.09)',
                      borderColor: 'rgba(255,255,255,0.18)',
                    },
                    focused && {
                      borderColor: accent,
                      backgroundColor: `${accent}24`,
                    },
                  ]}>
                  <View
                    style={[
                      tvStyles.categoryGlyphBox,
                      {
                        backgroundColor:
                          selected || focused
                            ? accent
                            : 'rgba(255,255,255,0.08)',
                      },
                    ]}>
                    <Text
                      style={{
                        color: selected || focused ? '#07090d' : '#c9d1d9',
                        fontSize: 15,
                        fontWeight: '900',
                      }}>
                      {cat.glyph}
                    </Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={tvStyles.categoryTitle}>{cat.title}</Text>
                    <Text numberOfLines={1} style={tvStyles.categorySub}>
                      {cat.subtitle}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Right Detail Stage */}
          <ScrollView
            style={tvStyles.stageScroll}
            contentContainerStyle={tvStyles.stageContent}
            showsVerticalScrollIndicator={false}>
            {tvCategory === 'profiles' ? (
              <View style={[tvStyles.stageCard, {backgroundColor: palette.panel}]}>
                <Text style={tvStyles.stageHeading}>Choose Who Is Watching</Text>
                <Text style={tvStyles.stageDesc}>
                  Switch household profiles on your shared TV. Library bookmarks
                  and layout preferences stay tailored to your screen.
                </Text>

                <View style={tvStyles.profileGrid}>
                  {HOUSEHOLD_PROFILES.map(prof => {
                    const active = activeProfile === prof.id;
                    const focused = focusedKey === `prof-${prof.id}`;
                    return (
                      <Pressable
                        key={prof.id}
                        accessibilityRole="button"
                        onFocus={() => setFocusedKey(`prof-${prof.id}`)}
                        onBlur={() => setFocusedKey(null)}
                        onPress={() => setActiveProfile(prof.id)}
                        style={[
                          tvStyles.profileCard,
                          active && {
                            borderColor: prof.color,
                            backgroundColor: `${prof.color}18`,
                          },
                          focused && {
                            borderColor: '#ffffff',
                            transform: [{scale: 1.03}],
                          },
                        ]}>
                        <View
                          style={[
                            tvStyles.profileAvatarLarge,
                            {backgroundColor: prof.color},
                          ]}>
                          <Text style={tvStyles.profileAvatarLargeText}>
                            {prof.initial}
                          </Text>
                        </View>
                        <View style={{flex: 1, gap: 3}}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <Text style={tvStyles.profileNameText}>
                              {prof.name}
                            </Text>
                            <View
                              style={[
                                tvStyles.profileRolePill,
                                {borderColor: `${prof.color}66`},
                              ]}>
                              <Text
                                style={[
                                  tvStyles.profileRolePillText,
                                  {color: prof.color},
                                ]}>
                                {prof.badge}
                              </Text>
                            </View>
                          </View>
                          <Text style={tvStyles.profileSubText}>
                            {prof.subtitle}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: active ? prof.color : '#6e7681',
                            fontSize: 13,
                            fontWeight: '800',
                          }}>
                          {active ? 'ACTIVE ✓' : 'SELECT'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {tvCategory === 'appearance' ? (
              <View style={[tvStyles.stageCard, {backgroundColor: palette.panel}]}>
                <Text style={tvStyles.stageHeading}>Color Theme & Palette</Text>
                <Text style={tvStyles.stageDesc}>
                  Select a signature Streamovie TV theme palette. Accent colors, focus
                  rings, and ambient backdrops update immediately.
                </Text>

                <View style={tvStyles.themeGrid}>
                  {themeIds.map(id => {
                    const selected = theme === id;
                    const focused = focusedKey === `theme-${id}`;
                    const itemPalette = THEMES[id];
                    return (
                      <Pressable
                        key={id}
                        accessibilityRole="button"
                        onFocus={() => setFocusedKey(`theme-${id}`)}
                        onBlur={() => setFocusedKey(null)}
                        onPress={() => onTheme(id)}
                        style={[
                          tvStyles.themeCard,
                          selected && {
                            borderColor: itemPalette.accent,
                            backgroundColor: `${itemPalette.accent}1f`,
                          },
                          focused && {
                            borderColor: '#ffffff',
                            transform: [{scale: 1.03}],
                          },
                        ]}>
                        <View
                          style={[
                            tvStyles.themePreviewBox,
                            {
                              backgroundColor: itemPalette.bg,
                              borderColor: itemPalette.accent,
                            },
                          ]}>
                          <View
                            style={{
                              height: 6,
                              width: '100%',
                              backgroundColor: itemPalette.accent,
                            }}
                          />
                          <View
                            style={{
                              flex: 1,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <Text
                              style={{
                                color: itemPalette.accent,
                                fontSize: 14,
                                fontWeight: '900',
                              }}>
                              S
                            </Text>
                          </View>
                        </View>
                        <View style={{flex: 1}}>
                          <Text numberOfLines={1} style={tvStyles.themeCardTitle}>
                            {itemPalette.label}
                          </Text>
                          <Text style={tvStyles.themeCardHex}>
                            {itemPalette.accent.toUpperCase()}
                          </Text>
                        </View>
                        {selected ? (
                          <Text
                            style={{
                              color: itemPalette.accent,
                              fontSize: 15,
                              fontWeight: '900',
                            }}>
                            ✓
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {tvCategory === 'layout' ? (
              <View style={[tvStyles.stageCard, {backgroundColor: palette.panel}]}>
                <Text style={tvStyles.stageHeading}>
                  Streamovie TV Home View & Poster Mode
                </Text>
                <Text style={tvStyles.stageDesc}>
                  Choose between Modern, Classic, or Grid Home layouts and toggle
                  global widescreen backdrop cards.
                </Text>

                <View style={{gap: 10, marginTop: 6}}>
                  {tvLayouts.map(option => {
                    const active = tvHomeLayout === option.id;
                    const focused = focusedKey === `layout-${option.id}`;
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        onFocus={() => setFocusedKey(`layout-${option.id}`)}
                        onBlur={() => setFocusedKey(null)}
                        onPress={() => setTvHomeLayout(option.id)}
                        style={[
                          tvStyles.optionCard,
                          active && {
                            borderColor: accent,
                            backgroundColor: `${accent}1c`,
                          },
                          focused && {
                            borderColor: '#ffffff',
                            transform: [{scale: 1.015}],
                          },
                        ]}>
                        <View style={{flex: 1, gap: 4}}>
                          <Text style={tvStyles.optionTitle}>{option.title}</Text>
                          <Text style={tvStyles.optionDesc}>{option.desc}</Text>
                        </View>
                        <View
                          style={[
                            tvStyles.optionStatusPill,
                            active && {backgroundColor: accent},
                          ]}>
                          <Text
                            style={[
                              tvStyles.optionStatusText,
                              active && {color: '#07090d'},
                            ]}>
                            {active ? 'ACTIVE' : 'SELECT'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{marginTop: 14}}>
                  <TVToggleCard
                    label="Global Landscape Poster Mode (16:9 Backdrops)"
                    description="Display widescreen 16:9 backdrop artwork across catalog rails instead of 2:3 vertical posters."
                    value={landscapeCards}
                    accent={accent}
                    onChange={setLandscapeCards}
                  />
                </View>
              </View>
            ) : null}

            {tvCategory === 'catalog' ? (
              <View style={[tvStyles.stageCard, {backgroundColor: palette.panel}]}>
                <Text style={tvStyles.stageHeading}>Catalog Shelves & Charts</Text>
                <Text style={tvStyles.stageDesc}>
                  Configure which ranked IMDb Top 250 rows appear on your Home
                  screen and sidebar navigation.
                </Text>

                <View style={{gap: 10, marginTop: 6}}>
                  <TVToggleCard
                    label="Show IMDb Top 250 Movies Row"
                    description="Display the ranked #1–#250 cinema classics shelf on Home and in the TV sidebar."
                    value={showTop250Movies}
                    accent={accent}
                    onChange={onShowTop250Movies}
                  />
                  <TVToggleCard
                    label="Show IMDb Top 250 Series Row"
                    description="Display the ranked #1–#250 highest-rated television series shelf on Home and in the TV sidebar."
                    value={showTop250Series}
                    accent={accent}
                    onChange={onShowTop250Series}
                  />
                </View>
              </View>
            ) : null}

            {tvCategory === 'about' ? (
              <View style={[tvStyles.stageCard, {backgroundColor: palette.panel}]}>
                <Text style={tvStyles.stageHeading}>About Streamovie TV</Text>
                <Text style={tvStyles.stageDesc}>
                  10-foot Android TV interface for Streamovie with D-pad
                  focus navigation, dynamic hero stage, and multi-source playback.
                </Text>

                <View style={tvStyles.aboutList}>
                  <View style={tvStyles.aboutItem}>
                    <Text style={tvStyles.aboutKey}>Application Version</Text>
                    <Text style={tvStyles.aboutVal}>1.1.0 (Streamovie TV UI)</Text>
                  </View>
                  <View style={tvStyles.aboutItem}>
                    <Text style={tvStyles.aboutKey}>Platform Target</Text>
                    <Text style={tvStyles.aboutVal}>Android TV • 10-Foot Leanback</Text>
                  </View>
                  <View style={tvStyles.aboutItem}>
                    <Text style={tvStyles.aboutKey}>Active Household Profile</Text>
                    <Text style={tvStyles.aboutVal}>{activeProfileObj.name}</Text>
                  </View>
                  <View style={tvStyles.aboutItem}>
                    <Text style={tvStyles.aboutKey}>Saved Library Titles</Text>
                    <Text style={tvStyles.aboutVal}>{savedCount} titles</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ============================================================================
  // MOBILE: Fully Redesigned Modern Profile & Preferences Page (!isTV)
  // ============================================================================
  const filterTabs: {id: MobileSectionFilter; label: string}[] = [
    {id: 'all', label: 'Overview'},
    {id: 'themes', label: 'Themes'},
    {id: 'interface', label: 'Interface'},
    {id: 'catalog', label: 'Catalog'},
    {id: 'system', label: 'System'},
  ];

  const showThemes = mobileFilter === 'all' || mobileFilter === 'themes';
  const showInterface = mobileFilter === 'all' || mobileFilter === 'interface';
  const showCatalog = mobileFilter === 'all' || mobileFilter === 'catalog';
  const showSystem = mobileFilter === 'all' || mobileFilter === 'system';

  return (
    <View style={[mobileStyles.root, {backgroundColor: palette.bg}]}>
      {/* Subtle Ambient Accent Glows */}
      <View
        pointerEvents="none"
        style={[
          mobileStyles.ambientGlowTop,
          {backgroundColor: `${accent}1e`},
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          mobileStyles.ambientGlowRight,
          {backgroundColor: `${palette.accentDark}18`},
        ]}
      />

      <SafeAreaView
        style={mobileStyles.safeArea}
        edges={['top', 'left', 'right']}>
        <ScrollView
          style={mobileStyles.scroll}
          contentContainerStyle={mobileStyles.content}
          showsVerticalScrollIndicator={false}>
          {/* Modern Top Navigation Bar */}
          <View style={mobileStyles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onClose}
              style={mobileStyles.glassBackPill}>
              <Text style={mobileStyles.glassBackText}>‹  Back</Text>
            </Pressable>

            <View style={mobileStyles.topCenterWrap}>
              <Text style={mobileStyles.topEyebrow}>STREAMOVIE SPACE</Text>
              <Text style={mobileStyles.topTitle}>Profile & Studio</Text>
            </View>

            <View
              style={[
                mobileStyles.syncBadge,
                {
                  backgroundColor: `${accent}1a`,
                  borderColor: `${accent}4d`,
                },
              ]}>
              <View
                style={[mobileStyles.syncDot, {backgroundColor: accent}]}
              />
              <Text style={[mobileStyles.syncText, {color: accent}]}>
                LIVE
              </Text>
            </View>
          </View>

          {/* Flagship Modern Profile Identity & Household Switcher Card */}
          <View
            style={[
              mobileStyles.identityCard,
              {
                backgroundColor: palette.panel,
                borderColor: 'rgba(255,255,255,0.12)',
              },
            ]}>
            <View style={mobileStyles.specularLine} />

            <View style={mobileStyles.identityMainRow}>
              <View
                style={[
                  mobileStyles.avatarRing,
                  {borderColor: activeProfileObj.color},
                ]}>
                <View
                  style={[
                    mobileStyles.avatarCircle,
                    {backgroundColor: activeProfileObj.color},
                  ]}>
                  <Text style={mobileStyles.avatarInitial}>
                    {activeProfileObj.initial}
                  </Text>
                </View>
                <View
                  style={[
                    mobileStyles.avatarOnlineDot,
                    {backgroundColor: '#34d399', borderColor: palette.panel},
                  ]}
                />
              </View>

              <View style={mobileStyles.identityCopy}>
                <View style={mobileStyles.identityNameRow}>
                  <Text style={mobileStyles.identityName}>
                    {activeProfileObj.name}
                  </Text>
                  <View
                    style={[
                      mobileStyles.rolePill,
                      {
                        backgroundColor: `${activeProfileObj.color}22`,
                        borderColor: `${activeProfileObj.color}55`,
                      },
                    ]}>
                    <Text
                      style={[
                        mobileStyles.rolePillText,
                        {color: activeProfileObj.color},
                      ]}>
                      {activeProfileObj.badge}
                    </Text>
                  </View>
                </View>
                <Text style={mobileStyles.identitySubtitle}>
                  {activeProfileObj.subtitle}
                </Text>
                <Text style={mobileStyles.identityMeta}>
                  Local Vault Synced  •  {savedCount}{' '}
                  {savedCount === 1 ? 'Saved Title' : 'Saved Titles'}
                </Text>
              </View>
            </View>

            {/* Household Profile Switcher Strip */}
            <View style={mobileStyles.profileSwitcherWrap}>
              <Text style={mobileStyles.switcherLabel}>SWITCH PROFILE</Text>
              <View style={mobileStyles.profilePillsRow}>
                {HOUSEHOLD_PROFILES.map(prof => {
                  const selected = activeProfile === prof.id;
                  return (
                    <Pressable
                      key={prof.id}
                      accessibilityRole="button"
                      onPress={() => setActiveProfile(prof.id)}
                      style={[
                        mobileStyles.profileChip,
                        selected && {
                          backgroundColor: `${prof.color}24`,
                          borderColor: prof.color,
                        },
                      ]}>
                      <View
                        style={[
                          mobileStyles.profileChipDot,
                          {backgroundColor: prof.color},
                        ]}>
                        <Text style={mobileStyles.profileChipInitial}>
                          {prof.initial}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          mobileStyles.profileChipName,
                          selected && {color: '#ffffff', fontWeight: '800'},
                        ]}>
                        {prof.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Modern 3-Card Bento Stats Grid */}
          <View style={mobileStyles.bentoRow}>
            <View
              style={[
                mobileStyles.bentoCard,
                {backgroundColor: palette.panel},
              ]}>
              <View style={mobileStyles.bentoTopRow}>
                <View
                  style={[
                    mobileStyles.bentoIconBadge,
                    {backgroundColor: `${accent}22`},
                  ]}>
                  <Text style={{color: accent, fontSize: 12, fontWeight: '900'}}>
                    ♦
                  </Text>
                </View>
                <Text style={mobileStyles.bentoTag}>VAULT</Text>
              </View>
              <Text numberOfLines={1} style={mobileStyles.bentoValue}>
                {savedCount}
              </Text>
              <Text numberOfLines={1} style={mobileStyles.bentoLabel}>
                Saved Library
              </Text>
            </View>

            <View
              style={[
                mobileStyles.bentoCard,
                {backgroundColor: palette.panel},
              ]}>
              <View style={mobileStyles.bentoTopRow}>
                <View
                  style={[
                    mobileStyles.bentoIconBadge,
                    {backgroundColor: `${accent}22`},
                  ]}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: accent,
                    }}
                  />
                </View>
                <Text style={mobileStyles.bentoTag}>PALETTE</Text>
              </View>
              <Text numberOfLines={1} style={mobileStyles.bentoValue}>
                {palette.label}
              </Text>
              <Text numberOfLines={1} style={mobileStyles.bentoLabel}>
                Active Theme
              </Text>
            </View>

            <View
              style={[
                mobileStyles.bentoCard,
                {backgroundColor: palette.panel},
              ]}>
              <View style={mobileStyles.bentoTopRow}>
                <View
                  style={[
                    mobileStyles.bentoIconBadge,
                    {backgroundColor: `${accent}22`},
                  ]}>
                  <Text style={{color: accent, fontSize: 11, fontWeight: '900'}}>
                    ▭
                  </Text>
                </View>
                <Text style={mobileStyles.bentoTag}>POSTERS</Text>
              </View>
              <Text numberOfLines={1} style={mobileStyles.bentoValue}>
                {landscapeCards ? '16:9 Wide' : '2:3 Poster'}
              </Text>
              <Text numberOfLines={1} style={mobileStyles.bentoLabel}>
                {liquidGlass ? 'Glass Dock' : 'Classic Dock'}
              </Text>
            </View>
          </View>

          {/* Segmented Section Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={mobileStyles.filterPillsRow}>
            {filterTabs.map(tabItem => {
              const active = mobileFilter === tabItem.id;
              return (
                <Pressable
                  key={tabItem.id}
                  accessibilityRole="tab"
                  accessibilityState={{selected: active}}
                  onPress={() => setMobileFilter(tabItem.id)}
                  style={[
                    mobileStyles.filterPill,
                    active && {
                      backgroundColor: '#ffffff',
                      borderColor: '#ffffff',
                    },
                  ]}>
                  <Text
                    style={[
                      mobileStyles.filterPillText,
                      active && {color: '#07090d', fontWeight: '800'},
                    ]}>
                    {tabItem.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* SECTION 1: Theme Studio */}
          {showThemes ? (
            <View
              style={[
                mobileStyles.sectionCard,
                {backgroundColor: palette.panel},
              ]}>
              <View style={mobileStyles.sectionHeaderRow}>
                <View style={{flex: 1}}>
                  <Text style={mobileStyles.sectionEyebrow}>THEME STUDIO</Text>
                  <Text style={mobileStyles.sectionTitle}>
                    Appearance & Accent Palette
                  </Text>
                  <Text style={mobileStyles.sectionSub}>
                    Customize surfaces, ambient highlights, and active controls
                  </Text>
                </View>
                <View
                  style={[
                    mobileStyles.sectionCountBadge,
                    {backgroundColor: `${accent}20`, borderColor: `${accent}44`},
                  ]}>
                  <Text
                    style={{color: accent, fontSize: 11, fontWeight: '800'}}>
                    {themeIds.length} Themes
                  </Text>
                </View>
              </View>

              <View style={mobileStyles.themeGrid}>
                {themeIds.map(id => {
                  const selected = theme === id;
                  const itemPalette = THEMES[id];
                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      onPress={() => onTheme(id)}
                      style={[
                        mobileStyles.themeCard,
                        selected && {
                          borderColor: itemPalette.accent,
                          backgroundColor: `${itemPalette.accent}18`,
                        },
                      ]}>
                      {/* Mini UI Screen Preview Swatch */}
                      <View
                        style={[
                          mobileStyles.themePreviewScreen,
                          {
                            backgroundColor: itemPalette.bg,
                            borderColor: selected
                              ? itemPalette.accent
                              : 'rgba(255,255,255,0.14)',
                          },
                        ]}>
                        <View
                          style={[
                            mobileStyles.themePreviewHeaderBar,
                            {backgroundColor: itemPalette.accent},
                          ]}
                        />
                        <View style={mobileStyles.themePreviewMiniBody}>
                          <View
                            style={[
                              mobileStyles.themePreviewHeroBlock,
                              {backgroundColor: itemPalette.panel2 ?? itemPalette.panel},
                            ]}
                          />
                          <View style={mobileStyles.themePreviewCardsRow}>
                            <View
                              style={[
                                mobileStyles.themePreviewMiniCard,
                                {backgroundColor: itemPalette.accent},
                              ]}
                            />
                            <View
                              style={[
                                mobileStyles.themePreviewMiniCard,
                                {backgroundColor: 'rgba(255,255,255,0.16)'},
                              ]}
                            />
                            <View
                              style={[
                                mobileStyles.themePreviewMiniCard,
                                {backgroundColor: 'rgba(255,255,255,0.10)'},
                              ]}
                            />
                          </View>
                        </View>
                      </View>

                      <View style={mobileStyles.themeCardMeta}>
                        <View style={{flex: 1}}>
                          <Text
                            numberOfLines={1}
                            style={[
                              mobileStyles.themeCardName,
                              selected && {color: '#ffffff', fontWeight: '800'},
                            ]}>
                            {itemPalette.label}
                          </Text>
                          <Text style={mobileStyles.themeCardCode}>
                            {itemPalette.accent.toUpperCase()}
                          </Text>
                        </View>
                        <View
                          style={[
                            mobileStyles.themeCheckCircle,
                            selected
                              ? {
                                  backgroundColor: itemPalette.accent,
                                  borderColor: itemPalette.accent,
                                }
                              : {
                                  backgroundColor: 'transparent',
                                  borderColor: 'rgba(255,255,255,0.20)',
                                },
                          ]}>
                          {selected ? (
                            <Text
                              style={{
                                color: '#07090d',
                                fontSize: 10,
                                fontWeight: '900',
                              }}>
                              ✓
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* SECTION 2: Interface & Visual Layout Studio */}
          {showInterface ? (
            <View
              style={[
                mobileStyles.sectionCard,
                {backgroundColor: palette.panel},
              ]}>
              <View style={mobileStyles.sectionHeaderRow}>
                <View style={{flex: 1}}>
                  <Text style={mobileStyles.sectionEyebrow}>
                    INTERFACE & NAVIGATION
                  </Text>
                  <Text style={mobileStyles.sectionTitle}>
                    Card Geometry & Dock Style
                  </Text>
                  <Text style={mobileStyles.sectionSub}>
                    Choose how media artwork and navigation bars are presented
                  </Text>
                </View>
              </View>

              {/* Visual Aspect Ratio Selector Cards */}
              <View style={mobileStyles.ratioPickerRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLandscapeCards(false)}
                  style={[
                    mobileStyles.ratioCard,
                    !landscapeCards && {
                      borderColor: accent,
                      backgroundColor: `${accent}18`,
                    },
                  ]}>
                  <View
                    style={[
                      mobileStyles.ratioPortraitIcon,
                      {
                        borderColor: !landscapeCards
                          ? accent
                          : 'rgba(255,255,255,0.28)',
                        backgroundColor: !landscapeCards
                          ? `${accent}33`
                          : 'rgba(255,255,255,0.06)',
                      },
                    ]}
                  />
                  <Text style={mobileStyles.ratioCardTitle}>2:3 Poster</Text>
                  <Text style={mobileStyles.ratioCardSub}>
                    Cinema vertical art
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLandscapeCards(true)}
                  style={[
                    mobileStyles.ratioCard,
                    landscapeCards && {
                      borderColor: accent,
                      backgroundColor: `${accent}18`,
                    },
                  ]}>
                  <View
                    style={[
                      mobileStyles.ratioLandscapeIcon,
                      {
                        borderColor: landscapeCards
                          ? accent
                          : 'rgba(255,255,255,0.28)',
                        backgroundColor: landscapeCards
                          ? `${accent}33`
                          : 'rgba(255,255,255,0.06)',
                      },
                    ]}
                  />
                  <Text style={mobileStyles.ratioCardTitle}>16:9 Wide</Text>
                  <Text style={mobileStyles.ratioCardSub}>
                    Widescreen backdrops
                  </Text>
                </Pressable>
              </View>

              <ModernSettingToggle
                glyph="✦"
                title="Liquid Glass Floating Dock"
                subtitle="Translucent pill bottom bar with specular top highlight"
                value={liquidGlass}
                accent={accent}
                onChange={setLiquidGlass}
              />

              <ModernSettingToggle
                glyph="▭"
                title="Landscape Catalog Rails"
                subtitle="Use 16:9 widescreen artwork across all home & catalog rows"
                value={landscapeCards}
                accent={accent}
                onChange={setLandscapeCards}
              />
            </View>
          ) : null}

          {/* SECTION 3: Catalog & Home Feeds */}
          {showCatalog ? (
            <View
              style={[
                mobileStyles.sectionCard,
                {backgroundColor: palette.panel},
              ]}>
              <View style={mobileStyles.sectionHeaderRow}>
                <View style={{flex: 1}}>
                  <Text style={mobileStyles.sectionEyebrow}>
                    HOME FEEDS & CHARTS
                  </Text>
                  <Text style={mobileStyles.sectionTitle}>
                    Catalog Shelf Curation
                  </Text>
                  <Text style={mobileStyles.sectionSub}>
                    Toggle ranked IMDb Top 250 collections on your Home screen
                  </Text>
                </View>
              </View>

              <ModernSettingToggle
                glyph="★"
                title="IMDb Top 250 Movies"
                subtitle="Show highest-rated cinema classics ranked #1 to #250"
                value={showTop250Movies}
                accent={accent}
                onChange={onShowTop250Movies}
              />

              <ModernSettingToggle
                glyph="♛"
                title="IMDb Top 250 Series"
                subtitle="Show acclaimed television series ranked #1 to #250"
                value={showTop250Series}
                accent={accent}
                onChange={onShowTop250Series}
              />
            </View>
          ) : null}

          {/* SECTION 4: System & About */}
          {showSystem ? (
            <View
              style={[
                mobileStyles.sectionCard,
                {backgroundColor: palette.panel},
              ]}>
              <View style={mobileStyles.sectionHeaderRow}>
                <View style={{flex: 1}}>
                  <Text style={mobileStyles.sectionEyebrow}>
                    SYSTEM DIAGNOSTICS
                  </Text>
                  <Text style={mobileStyles.sectionTitle}>
                    About Streamovie
                  </Text>
                  <Text style={mobileStyles.sectionSub}>
                    Build architecture, playback engine, and preference controls
                  </Text>
                </View>
              </View>

              <View style={mobileStyles.infoRowsWrap}>
                <View style={mobileStyles.infoRow}>
                  <Text style={mobileStyles.infoLabel}>Release Version</Text>
                  <View style={mobileStyles.infoBadge}>
                    <Text style={mobileStyles.infoBadgeText}>v1.1.0 • Streamovie</Text>
                  </View>
                </View>

                <View style={mobileStyles.infoRow}>
                  <Text style={mobileStyles.infoLabel}>Playback Engine</Text>
                  <Text style={mobileStyles.infoValue}>
                    Native Media3 / Video
                  </Text>
                </View>

                <View style={mobileStyles.infoRow}>
                  <Text style={mobileStyles.infoLabel}>Active Palette</Text>
                  <Text style={[mobileStyles.infoValue, {color: accent}]}>
                    {palette.label}
                  </Text>
                </View>

                <View style={mobileStyles.infoRow}>
                  <Text style={mobileStyles.infoLabel}>Device Target</Text>
                  <Text style={mobileStyles.infoValue}>Android Mobile</Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={handleResetDefaults}
                style={mobileStyles.resetBtn}>
                <Text style={mobileStyles.resetBtnText}>
                  ↺  Restore Default Preferences
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Primary Save & Return Button */}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[mobileStyles.doneBtn, {backgroundColor: accent}]}>
            <Text style={mobileStyles.doneBtnText}>Save & Return</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export const SettingsModal = ProfileScreen;

function ModernSettingToggle({
  glyph,
  title,
  subtitle,
  value,
  accent,
  onChange,
}: {
  glyph: string;
  title: string;
  subtitle: string;
  value: boolean;
  accent: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{checked: value}}
      onPress={() => onChange(!value)}
      style={[
        mobileStyles.toggleCard,
        value && {
          borderColor: `${accent}44`,
          backgroundColor: 'rgba(255,255,255,0.05)',
        },
      ]}>
      <View
        style={[
          mobileStyles.toggleIconBox,
          {
            backgroundColor: value ? `${accent}24` : 'rgba(255,255,255,0.06)',
            borderColor: value ? `${accent}55` : 'rgba(255,255,255,0.10)',
          },
        ]}>
        <Text
          style={{
            color: value ? accent : '#8b949e',
            fontSize: 14,
            fontWeight: '800',
          }}>
          {glyph}
        </Text>
      </View>

      <View style={{flex: 1, gap: 2}}>
        <Text style={mobileStyles.toggleTitle}>{title}</Text>
        <Text style={mobileStyles.toggleSubtitle}>{subtitle}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: '#252b37', true: `${accent}88`}}
        thumbColor={value ? accent : '#9ca3af'}
        accessibilityLabel={title}
      />
    </Pressable>
  );
}

function TVToggleCard({
  label,
  description,
  value,
  accent,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  accent: string;
  onChange: (value: boolean) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{checked: value}}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => onChange(!value)}
      style={[
        tvStyles.optionCard,
        value && {borderColor: `${accent}66`},
        focused && {
          borderColor: accent,
          backgroundColor: `${accent}1e`,
          transform: [{scale: 1.015}],
        },
      ]}>
      <View style={{flex: 1, gap: 4}}>
        <Text style={tvStyles.optionTitle}>{label}</Text>
        <Text style={tvStyles.optionDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: '#2a303c', true: `${accent}88`}}
        thumbColor={value ? accent : '#9ca3af'}
        accessibilityLabel={label}
      />
    </Pressable>
  );
}

const tvStyles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 28,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerEyebrow: {
    color: '#7d8597',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  closeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  bodyRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
  },
  sidebarRail: {
    width: 290,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryGlyphBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  categorySub: {
    color: '#8b949e',
    fontSize: 11.5,
    marginTop: 1,
  },
  stageScroll: {
    flex: 1,
  },
  stageContent: {
    paddingBottom: 32,
  },
  stageCard: {
    borderRadius: 24,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    gap: 14,
  },
  stageHeading: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stageDesc: {
    color: '#8b949e',
    fontSize: 13.5,
    lineHeight: 20,
  },
  profileGrid: {
    gap: 12,
    marginTop: 6,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  profileAvatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarLargeText: {
    color: '#07090d',
    fontSize: 22,
    fontWeight: '900',
  },
  profileNameText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  profileRolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  profileRolePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  profileSubText: {
    color: '#8b949e',
    fontSize: 12.5,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  themeCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  themePreviewBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  themeCardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  themeCardHex: {
    color: '#7d8597',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  optionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  optionDesc: {
    color: '#8b949e',
    fontSize: 12.5,
    lineHeight: 18,
  },
  optionStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  optionStatusText: {
    color: '#c9d1d9',
    fontSize: 11,
    fontWeight: '800',
  },
  aboutList: {
    marginTop: 6,
    gap: 4,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  aboutKey: {
    color: '#c9d1d9',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutVal: {
    color: '#8b949e',
    fontSize: 14,
    fontWeight: '700',
  },
});

const mobileStyles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -90,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  ambientGlowRight: {
    position: 'absolute',
    top: 120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 124,
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  glassBackPill: {
    minWidth: 72,
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBackText: {
    color: '#f0f4f8',
    fontSize: 13,
    fontWeight: '700',
  },
  topCenterWrap: {
    alignItems: 'center',
  },
  topEyebrow: {
    color: '#7d8597',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  topTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  syncBadge: {
    minWidth: 68,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // Flagship Identity & Household Profile Card
  identityCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 16,
  },
  specularLine: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  identityMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#07090d',
    fontSize: 26,
    fontWeight: '900',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  identityCopy: {
    flex: 1,
    gap: 3,
  },
  identityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  identityName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  identitySubtitle: {
    color: '#c9d1d9',
    fontSize: 12.5,
    fontWeight: '500',
  },
  identityMeta: {
    color: '#7d8597',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  profileSwitcherWrap: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
    gap: 8,
  },
  switcherLabel: {
    color: '#7d8597',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  profilePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  profileChipDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileChipInitial: {
    color: '#07090d',
    fontSize: 10,
    fontWeight: '900',
  },
  profileChipName: {
    color: '#9ca3af',
    fontSize: 11.5,
    fontWeight: '600',
    flexShrink: 1,
  },

  // Bento Metrics Row
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoCard: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    gap: 4,
  },
  bentoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bentoIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoTag: {
    color: '#6e7681',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bentoValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  bentoLabel: {
    color: '#8b949e',
    fontSize: 11,
    fontWeight: '600',
  },

  // Segmented Filter Pills
  filterPillsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterPillText: {
    color: '#c9d1d9',
    fontSize: 12,
    fontWeight: '700',
  },

  // Section Cards
  sectionCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionEyebrow: {
    color: '#7d8597',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  sectionSub: {
    color: '#8b949e',
    fontSize: 12,
    marginTop: 2,
  },
  sectionCountBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  // Theme Studio Cards
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  themeCard: {
    width: '48.2%',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 8,
  },
  themePreviewScreen: {
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themePreviewHeaderBar: {
    height: 6,
    width: '100%',
  },
  themePreviewMiniBody: {
    flex: 1,
    padding: 6,
    gap: 4,
  },
  themePreviewHeroBlock: {
    height: 16,
    borderRadius: 4,
    width: '75%',
  },
  themePreviewCardsRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  themePreviewMiniCard: {
    flex: 1,
    borderRadius: 3,
  },
  themeCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  themeCardName: {
    color: '#e6edf3',
    fontSize: 12.5,
    fontWeight: '700',
  },
  themeCardCode: {
    color: '#6e7681',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  themeCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Aspect Ratio Visual Picker
  ratioPickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ratioCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    gap: 5,
  },
  ratioPortraitIcon: {
    width: 24,
    height: 34,
    borderRadius: 6,
    borderWidth: 1.5,
    marginBottom: 2,
  },
  ratioLandscapeIcon: {
    width: 38,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    marginTop: 6,
    marginBottom: 8,
  },
  ratioCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  ratioCardSub: {
    color: '#8b949e',
    fontSize: 11,
    fontWeight: '500',
  },

  // Modern Toggle Cards
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  toggleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    color: '#f0f4f8',
    fontSize: 13.5,
    fontWeight: '700',
  },
  toggleSubtitle: {
    color: '#8b949e',
    fontSize: 11.5,
    lineHeight: 16,
  },

  // System Info Rows
  infoRowsWrap: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  infoLabel: {
    color: '#c9d1d9',
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    color: '#8b949e',
    fontSize: 13,
    fontWeight: '700',
  },
  infoBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  infoBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  resetBtn: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: '#c9d1d9',
    fontSize: 12.5,
    fontWeight: '700',
  },
  doneBtn: {
    minHeight: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  doneBtnText: {
    color: '#07090d',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
