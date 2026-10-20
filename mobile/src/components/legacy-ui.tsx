import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  Image,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type {
  AppTab,
  Episode,
  Locale,
  Media,
  NavIconName,
  Season,
  Source,
} from '../types/media';
import {SettingsContext} from '../context/settings';
import {THEMES} from '../lib/theme';
import {asText, parseDescription, sourcesFrom} from '../lib/media-format';
import {Text} from './ui/Text';
import {Action} from './ui/Button';
import {SearchFilterBar} from './SearchFilterBar';
import {styles} from './styles';

const NAV_ICONS: Record<NavIconName, number> = {
  home: require('../../assets/nav-icons/home.png'),
  movies: require('../../assets/nav-icons/movies.png'),
  series: require('../../assets/nav-icons/series.png'),
  trending: require('../../assets/nav-icons/trending.png'),
  saved: require('../../assets/nav-icons/saved.png'),
  search: require('../../assets/nav-icons/search.png'),
  top: require('../../assets/nav-icons/top.png'),
  settings: require('../../assets/nav-icons/settings.png'),
  play: require('../../assets/nav-icons/play.png'),
};

export function NavIcon({
  name,
  color,
  size,
}: {
  name: NavIconName;
  color: string;
  size: number;
}) {
  return (
    <Image
      source={NAV_ICONS[name]}
      resizeMode="contain"
      style={{width: size, height: size, tintColor: color}}
    />
  );
}

const FADE_STEPS = [
  0.02, 0.06, 0.12, 0.2, 0.3, 0.42, 0.56, 0.7, 0.82, 0.92, 0.97, 1,
];

function SmoothBottomFade({
  height = 210,
  rgb = '7, 9, 13',
}: {
  height?: number;
  rgb?: string;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height,
        flexDirection: 'column',
      }}>
      {FADE_STEPS.map((alpha, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            backgroundColor: `rgba(${rgb}, ${alpha})`,
          }}
        />
      ))}
    </View>
  );
}

function SmoothTopFade({
  height = 72,
  rgb = '7, 9, 13',
}: {
  height?: number;
  rgb?: string;
}) {
  const steps = [0.55, 0.4, 0.26, 0.14, 0.06, 0];
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height,
        flexDirection: 'column',
      }}>
      {steps.map((alpha, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            backgroundColor: `rgba(${rgb}, ${alpha})`,
          }}
        />
      ))}
    </View>
  );
}


function CarouselDot({active}: {active: boolean}) {
  const width = useRef(new Animated.Value(active ? 22 : 6)).current;
  const opacity = useRef(new Animated.Value(active ? 1 : 0.45)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(width, {toValue: active ? 22 : 6, useNativeDriver: false, friction: 6}),
      Animated.timing(opacity, {toValue: active ? 1 : 0.45, duration: 220, useNativeDriver: false}),
    ]).start();
  }, [active, opacity, width]);
  return (
    <Animated.View
      style={[
        styles.spotlightDot,
        active && styles.spotlightDotActive,
        {width, opacity},
      ]}
    />
  );
}

export function Spotlight({
  item,
  featuredItems,
  onPress,
  onOpenItem,
  isTV,
}: {
  item: Media;
  featuredItems?: Media[];
  onPress: () => void;
  onOpenItem?: (media: Media) => void;
  onToggleSave?: (media: Media) => void;
  isSaved?: (media: Media) => boolean;
  isTV: boolean;
}) {
  const {theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const slides =
    featuredItems && featuredItems.length > 0
      ? featuredItems.slice(0, 8)
      : [item];
  const [activeIndex, setActiveIndex] = useState(0);
  const [btnFocused, setBtnFocused] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -40) {
          setActiveIndex(prev => (prev + 1) % slides.length);
        } else if (gesture.dx > 40) {
          setActiveIndex(prev => (prev - 1 + slides.length) % slides.length);
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[activeIndex] ?? item;
  const rawGenre = asText(current.raw?.genre, current.raw?.genres);
  const primaryGenre =
    rawGenre.split(/[,،/·|]/)[0]?.trim() ||
    (current.kind === 'series' ? 'Drama' : 'Cinema');
  const yearDisplay = current.year
    ? current.kind === 'series' && !current.year.includes('–')
      ? `${current.year}–`
      : current.year
    : '2026–';
  const kindLabel = current.kind === 'series' ? 'Series' : 'Movie';
  const metaLine = [kindLabel, primaryGenre, yearDisplay]
    .filter(Boolean)
    .join('  •  ');

  const handleOpen = () => {
    if (onOpenItem) {
      onOpenItem(current);
    } else {
      onPress();
    }
  };

  return (
    <View style={[styles.spotlightWrapper, isTV && styles.spotlightWrapperTV]} {...panResponder.panHandlers}>
      <Pressable
        onPress={handleOpen}
        style={[
          styles.spotlight,
          !isTV && styles.spotlightMobile,
          isTV && styles.spotlightTV,
        ]}>
        {current.backdrop || current.image ? (
          <Image
            source={{uri: current.backdrop || current.image}}
            resizeMode="cover"
            style={styles.spotlightImage}
          />
        ) : null}
        <SmoothTopFade height={84} />
        <SmoothBottomFade height={240} />

        <View
          style={[
            styles.spotlightContent,
            isTV && styles.spotlightContentTV,
          ]}>
          <Text
            numberOfLines={2}
            style={[styles.spotlightTitle, isTV && styles.spotlightTitleTV]}>
            {current.title}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.spotlightMetaLine,
              isTV && styles.spotlightMetaLineTV,
            ]}>
            {metaLine}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={handleOpen}
            onFocus={() => setBtnFocused(true)}
            onBlur={() => setBtnFocused(false)}
            style={[
              styles.spotlightWhitePillBtn,
              btnFocused && {
                borderWidth: 2.5,
                borderColor: accent,
                transform: [{scale: 1.04}],
              },
            ]}>
            <Text style={styles.spotlightWhitePillBtnText}>View Details</Text>
          </Pressable>

          {slides.length > 1 ? (
            <View style={styles.spotlightDots}>
              {slides.map((slide, idx) => {
                const active = idx === activeIndex;
                return (
                  <Pressable
                    key={`${slide.kind}-${slide.id}-${idx}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Featured item ${idx + 1}`}
                    onPress={() => setActiveIndex(idx)}
                    hitSlop={6}>
                    <CarouselDot active={active} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

export function MediaRail({
  title,
  subtitle,
  items,
  width,
  isTV = false,
  landscape = false,
  continueWatching = false,
  highlightFirstOnTV = false,
  ranked = false,
  onSelect,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  items: Media[];
  width: number;
  isTV?: boolean;
  landscape?: boolean;
  continueWatching?: boolean;
  highlightFirstOnTV?: boolean;
  ranked?: boolean;
  onSelect: (item: Media) => void;
  onSeeAll?: () => void;
}) {
  const {landscapeCards} = useContext(SettingsContext);
  const useLandscape = continueWatching || landscape || landscapeCards;

  // On mobile portrait rails: ~3 cards visible across screen (matching NuvioMobile screenshot)
  // On TV portrait rails: ~5 large cards visible across screen (matching NuvioTV screenshot)
  const portraitWidth = isTV
    ? Math.min(Math.max(Math.floor((width - 82 - 72 - 72) / 4.7), 190), 245)
    : width >= 620
    ? Math.floor((width - 32 - 36) / 4.3)
    : Math.floor((width - 32 - 20) / 3.05);

  const tileWidth = continueWatching
    ? isTV
      ? 290
      : 214
    : useLandscape
    ? Math.round(portraitWidth * 1.55)
    : portraitWidth;

  if (!items.length) return null;

  return (
    <View style={[styles.rail, isTV && styles.railTV]}>
      <View style={[styles.railHeading, isTV && styles.railHeadingTV]}>
        <View style={styles.railHeadingCopy}>
          <Text style={[styles.railTitle, isTV && styles.railTitleTV]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.railSubtitle, isTV && styles.railSubtitleTV]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onSeeAll && !isTV ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSeeAll}
            style={styles.railMoreBtn}>
            <Text style={styles.railMore}>See All ›</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        horizontal
        data={items}
        keyExtractor={(item, index) => `${item.kind}-${item.id}-${index}`}
        renderItem={({item, index}) => (
          <View style={[styles.railCard, {width: tileWidth}]}>
            <MediaCard
              item={item}
              isTV={isTV}
              landscape={useLandscape}
              continueWatching={continueWatching}
              continueIndex={index}
              defaultHighlighted={isTV && highlightFirstOnTV && index === 0}
              rank={ranked ? index + 1 : undefined}
              onPress={() => onSelect(item)}
            />
          </View>
        )}
        getItemLayout={(_, index) => ({
          length: tileWidth + (isTV ? 18 : 10),
          offset: (tileWidth + (isTV ? 18 : 10)) * index,
          index,
        })}
        initialNumToRender={isTV ? 6 : 4}
        maxToRenderPerBatch={isTV ? 7 : 5}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android' && !isTV}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.railContent,
          isTV && styles.railContentTV,
        ]}
      />
    </View>
  );
}

const CONTINUE_LEFT_LABELS = [
  '1h 2m left',
  '44m left',
  '38m left',
  '52m left',
  '29m left',
  '1h 15m left',
];

const CONTINUE_EP_CODES = [
  'S1 E1',
  'S1 E4',
  'S2 E2',
  'S1 E6',
  'S1 E3',
  'S2 E5',
];

const CONTINUE_SUBTITLES = [
  'First Crossing',
  'After Dusk',
  'Signal Lost',
  'Nightfall',
  'The Horizon',
  'Deep Current',
];

export function MediaCard({
  item,
  isTV = false,
  landscape = false,
  continueWatching = false,
  continueIndex = 0,
  defaultHighlighted = false,
  rank,
  onPress,
}: {
  item: Media;
  isTV?: boolean;
  landscape?: boolean;
  continueWatching?: boolean;
  continueIndex?: number;
  defaultHighlighted?: boolean;
  rank?: number;
  onPress: () => void;
}) {
  const {theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [focused, setFocused] = useState(false);
  const highlighted = focused || defaultHighlighted;
  const imageUri =
    landscape || continueWatching
      ? item.backdrop || item.image
      : item.image || item.backdrop;

  if (continueWatching) {
    const timeLeft =
      asText(item.raw?.duration, item.raw?.runtime) ||
      CONTINUE_LEFT_LABELS[continueIndex % CONTINUE_LEFT_LABELS.length];
    const epTag =
      item.kind === 'series'
        ? CONTINUE_EP_CODES[continueIndex % CONTINUE_EP_CODES.length]
        : item.year || 'MOVIE';
    const subLabel =
      asText(item.raw?.genre, item.raw?.genres)
        .split(/[,،/·|]/)[0]
        ?.trim() ||
      CONTINUE_SUBTITLES[continueIndex % CONTINUE_SUBTITLES.length];

    return (
      <Pressable
        onPress={onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.card,
          styles.cardLandscape,
          highlighted && styles.cardFocused,
        ]}>
        <View
          style={[
            styles.posterFrame,
            styles.landscapeFrame,
            highlighted && [styles.posterFrameFocused, {borderColor: accent}],
          ]}>
          {imageUri ? (
            <Image
              source={{uri: imageUri}}
              resizeMode="cover"
              style={[styles.poster, styles.landscapePoster]}
            />
          ) : (
            <View
              style={[
                styles.poster,
                styles.landscapePoster,
                styles.posterPlaceholder,
              ]}>
              <Text style={styles.body}>No Artwork</Text>
            </View>
          )}

          <SmoothBottomFade height={84} />

          <View style={styles.continueBadgeTopRight}>
            <Text style={styles.continueBadgeText}>{timeLeft}</Text>
          </View>

          <View style={cardExtraStyles.continueBottomContent}>
            <Text numberOfLines={1} style={styles.continueEyebrow}>
              {epTag}
            </Text>
            <Text numberOfLines={1} style={styles.continueTitle}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={styles.continueSubtitle}>
              {subLabel}
            </Text>
            <View style={cardExtraStyles.continueShortDash} />
          </View>
        </View>
      </Pressable>
    );
  }

  const yearLabel = item.year
    ? item.kind === 'series' && !item.year.includes('–')
      ? `${item.year}–`
      : item.year
    : '2026–';

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.card,
        isTV && styles.cardTV,
        landscape && styles.cardLandscape,
        highlighted && styles.cardFocused,
      ]}>
      <View
        style={[
          styles.posterFrame,
          isTV && styles.posterFrameTV,
          landscape && styles.landscapeFrame,
          highlighted && [styles.posterFrameFocused, {borderColor: accent}],
        ]}>
        {imageUri ? (
          <Image
            source={{uri: imageUri}}
            resizeMode="cover"
            style={[styles.poster, landscape && styles.landscapePoster]}
          />
        ) : (
          <View
            style={[
              styles.poster,
              landscape && styles.landscapePoster,
              styles.posterPlaceholder,
            ]}>
            <Text style={styles.body}>No Poster</Text>
          </View>
        )}

        {rank ? (
          <View style={styles.posterRankBadge}>
            <Text style={styles.posterRankText}>#{rank}</Text>
          </View>
        ) : null}
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.cardTitle,
          isTV && styles.cardTitleTV,
          highlighted && {color: '#ffffff'},
        ]}>
        {item.title}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.meta, isTV && styles.metaTV]}>
        {yearLabel}
      </Text>
    </Pressable>
  );
}

const cardExtraStyles = StyleSheet.create({
  continueBottomContent: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 8,
    justifyContent: 'flex-end',
  },
  continueShortDash: {
    width: 18,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    marginTop: 5,
  },
});

export function TVNavigation({
  selected,
  onSelect,
  onSettings,
  accent,
  showTop250Movies,
  showTop250Series,
}: {
  selected: AppTab;
  onSelect: (tab: AppTab) => void;
  onSettings: () => void;
  accent: string;
  locale: Locale;
  showTop250Movies: boolean;
  showTop250Series: boolean;
}) {
  const [settingsFocused, setSettingsFocused] = useState(false);
  const items: {
    name: AppTab;
    icon: NavIconName;
    label: string;
  }[] = [
    {name: 'Home', icon: 'home', label: 'Home'},
    {name: 'Search', icon: 'search', label: 'Search'},
    {name: 'Movies', icon: 'movies', label: 'Movies'},
    {name: 'Series', icon: 'series', label: 'Series'},
    {name: 'Saved', icon: 'saved', label: 'Library'},
    ...(showTop250Movies
      ? [{name: 'Top Movies' as const, icon: 'top' as const, label: 'Top 250'}]
      : []),
    ...(showTop250Series
      ? [{name: 'Top Series' as const, icon: 'top' as const, label: 'Top TV'}]
      : []),
  ];

  return (
    <View
      accessibilityLabel="Sidebar navigation"
      style={styles.tvNavigation}>
      <View style={[styles.tvBrandMark, {backgroundColor: accent}]}>
        <Text style={{color: '#fff', fontSize: 19, fontWeight: '800'}}>N</Text>
      </View>

      <View style={styles.tvNavigationItems}>
        {items.map(item => (
          <TVNavigationItem
            key={item.name}
            item={item}
            accent={accent}
            selected={selected === item.name}
            onSelect={() => onSelect(item.name)}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profile & Settings"
        onPress={onSettings}
        onFocus={() => setSettingsFocused(true)}
        onBlur={() => setSettingsFocused(false)}
        style={[
          styles.tvNavigationItem,
          settingsFocused && [
            styles.tvNavigationFocused,
            {borderColor: accent},
          ],
        ]}>
        <NavIcon
          name="settings"
          color={settingsFocused ? '#fff' : '#8b949e'}
          size={20}
        />
        <Text
          style={[
            styles.tvNavigationLabel,
            settingsFocused && styles.tvNavigationTextActive,
          ]}>
          Profile
        </Text>
      </Pressable>
    </View>
  );
}

function TVNavigationItem({
  item,
  accent,
  selected,
  onSelect,
}: {
  item: {name: AppTab; icon: NavIconName; label: string};
  accent: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{selected}}
      onPress={onSelect}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.tvNavigationItem,
        selected && styles.tvNavigationSelected,
        focused && [styles.tvNavigationFocused, {borderColor: accent}],
      ]}>
      <NavIcon
        name={item.icon}
        color={selected || focused ? '#ffffff' : '#8b949e'}
        size={20}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.tvNavigationLabel,
          (selected || focused) && styles.tvNavigationTextActive,
        ]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

export function AppHeader({
  selected,
  tab,
  searchDraft,
  isTV,
  palette,
  onBack,
  onSearchChange,
  onSearchSubmit,
  filtersOpen,
  onToggleFilters,
  onClearSearch,
}: {
  selected: Media | null;
  tab: AppTab;
  searchDraft: string;
  isTV: boolean;
  palette: (typeof THEMES)[keyof typeof THEMES];
  locale: Locale;
  isPersian: boolean;
  onBack: () => void;
  onSettings: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onClearSearch: () => void;
}) {
  if (selected) {
    return (
      <View style={[styles.pageHeader, isTV && styles.pageHeaderTV]}>
        <View style={styles.brandRow}>
          <Action label="‹  Back" onPress={onBack} />
        </View>
      </View>
    );
  }

  if (tab === 'Home' && !searchDraft.trim()) {
    return null;
  }

  return (
    <View style={{paddingTop: 10, paddingBottom: 6}}>
      {tab !== 'Saved' ? (
        <View style={isTV ? styles.tvSearchRow : undefined}>
          <SearchFilterBar
            value={searchDraft}
            placeholder="Search movies, series, genres..."
            isPersian={false}
            accent={palette.accent}
            filtersOpen={filtersOpen}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
            onToggleFilters={onToggleFilters}
            onClear={onClearSearch}
          />
        </View>
      ) : null}
    </View>
  );
}

export function Detail({
  item,
  isSaved,
  onSave,
  seasons,
  seasonIndex,
  onSeason,
  isTV,
  isWide,
  onWatch,
}: {
  item: Media;
  isSaved: boolean;
  onSave: () => void;
  seasons: Season[];
  seasonIndex: number;
  onSeason: (index: number) => void;
  isTV: boolean;
  isWide: boolean;
  onWatch: (source: Source, title: string) => void;
}) {
  const {theme} = useContext(SettingsContext);
  const palette = THEMES[theme];
  const accent = palette.accent;
  const mediaSources = sourcesFrom(item.raw);
  const description = parseDescription(
    asText(item.raw.description, item.raw.summary, item.overview),
  );
  const sourceColumns = isTV ? 3 : isWide ? 2 : 1;
  const episodeColumns = isTV || isWide ? 2 : 1;

  const [streamSheetTarget, setStreamSheetTarget] = useState<{
    title: string;
    subtitle?: string;
    sources: Source[];
  } | null>(null);

  const openMovieStreams = () => {
    setStreamSheetTarget({
      title: item.title,
      subtitle: [item.year, item.rating ? `★ ${item.rating} IMDb` : '']
        .filter(Boolean)
        .join('  •  '),
      sources: mediaSources,
    });
  };

  const openEpisodeStreams = (episode: Episode, epIdx: number) => {
    const code = `S${seasonIndex + 1} E${epIdx + 1}`;
    setStreamSheetTarget({
      title: `${item.title} — ${episode.title}`,
      subtitle: `${code}  •  ${seasons[seasonIndex]?.title ?? ''}`,
      sources: episode.sources,
    });
  };

  const currentSeason = seasons[seasonIndex];
  const rawGenre = asText(item.raw.genre, item.raw.genres);
  const metaParts = [
    item.kind === 'series' ? 'Series' : 'Movie',
    rawGenre.split(/[,،/·|]/)[0]?.trim(),
    item.year || '2026',
    item.rating ? `★ ${item.rating}` : '',
  ].filter(Boolean);

  return (
    <View style={styles.detail}>
      <View
        style={[
          styles.detailHero,
          isWide ? styles.detailHeroWide : styles.detailHeroMobile,
          {backgroundColor: palette.bg},
        ]}>
        {item.backdrop || item.image ? (
          <Image
            source={{uri: item.backdrop || item.image}}
            resizeMode="cover"
            style={styles.detailBackdrop}
          />
        ) : null}
        <View pointerEvents="none" style={styles.detailBackdropShade} />
        <SmoothBottomFade height={200} />

        {item.image ? (
          <Image
            source={{uri: item.image}}
            resizeMode="cover"
            style={[
              styles.detailPoster,
              isWide ? styles.detailPosterWide : styles.detailPosterMobile,
            ]}
          />
        ) : null}

        <View style={[styles.detailCopy, isWide && styles.detailCopyWide]}>
          <Text style={[styles.detailTitle, isWide && styles.detailTitleWide]}>
            {item.title}
          </Text>

          <Text style={styles.spotlightMetaLine}>
            {metaParts.join('  •  ')}
          </Text>

          <View style={styles.detailMetaRow}>
            {asText(item.raw.duration, item.raw.runtime) ? (
              <Text style={styles.detailMetaChip}>
                {asText(item.raw.duration, item.raw.runtime)}
              </Text>
            ) : null}
            {asText(item.raw.country, item.raw.countries) ? (
              <Text style={styles.detailMetaChip}>
                {asText(item.raw.country, item.raw.countries)}
              </Text>
            ) : null}
          </View>

          {description.overview ? (
            <Text
              style={[
                styles.detailOverview,
                isWide && styles.detailOverviewWide,
              ]}>
              {description.overview}
            </Text>
          ) : null}

          <View style={styles.detailActions}>
            {item.kind === 'movie' ? (
              <Action
                label={`▶  Play / Streams (${mediaSources.length})`}
                onPress={openMovieStreams}
                active
              />
            ) : currentSeason?.episodes?.[0] ? (
              <Action
                label="▶  Play S1 E1"
                onPress={() =>
                  openEpisodeStreams(currentSeason.episodes[0], 0)
                }
                active
              />
            ) : null}

            <Action
              label={isSaved ? '✓  In Library' : '+  Add to Library'}
              onPress={onSave}
              active={isSaved}
            />
          </View>
        </View>
      </View>

      {description.fields.length ? (
        <View
          style={[
            styles.section,
            isTV && styles.sectionTV,
            {backgroundColor: palette.panel},
          ]}>
          <Text style={styles.panelHeading}>About</Text>
          <View style={styles.metadataGrid}>
            {description.fields
              .filter(field => field.label !== 'Persian title')
              .map((field, index) => (
                <View
                  key={`${field.label}-${index}`}
                  style={[
                    styles.metadataItem,
                    isWide && styles.metadataItemWide,
                  ]}>
                  <Text style={styles.metadataLabel}>{field.label}</Text>
                  <Text style={styles.metadataValue}>{field.value}</Text>
                </View>
              ))}
          </View>
        </View>
      ) : null}

      {item.kind === 'movie' ? (
        <View
          style={[
            styles.section,
            isTV && styles.sectionTV,
            {backgroundColor: palette.panel},
          ]}>
          <View style={styles.detailSectionHeading}>
            <View>
              <Text style={styles.panelHeading}>Streams</Text>
              <Text style={styles.railSubtitle}>
                Select a source quality to play or download
              </Text>
            </View>
          </View>
          <SourceGrid
            sources={mediaSources}
            columns={sourceColumns}
            title={item.title}
            onWatch={onWatch}
          />
        </View>
      ) : (
        <View
          style={[
            styles.section,
            isTV && styles.sectionTV,
            {backgroundColor: palette.panel},
          ]}>
          <View style={styles.detailSectionHeading}>
            <View>
              <Text style={styles.panelHeading}>Episodes</Text>
              <Text style={styles.railSubtitle}>
                Choose a season and select an episode
              </Text>
            </View>
          </View>

          {!seasons.length ? (
            <Text style={styles.body}>
              Loading episodes, or no episodes are available yet.
            </Text>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.seasonRow}>
                {seasons.map((season, index) => (
                  <Action
                    key={`${season.title}-${index}`}
                    label={`${season.title} (${season.episodes.length})`}
                    active={seasonIndex === index}
                    onPress={() => onSeason(index)}
                  />
                ))}
              </ScrollView>

              <View style={styles.episodeGrid}>
                {seasons[seasonIndex]?.episodes.map((episode, index) => {
                  const epCode = `S${seasonIndex + 1} E${index + 1}`;
                  return (
                    <View
                      key={`${episode.title}-${index}`}
                      style={[
                        styles.episode,
                        {
                          width:
                            episodeColumns === 1
                              ? '100%'
                              : (`${100 / episodeColumns - 2}%` as `${number}%`),
                        },
                      ]}>
                      <View style={styles.episodeTopRow}>
                        <Text style={styles.episodeNumber}>{epCode}</Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => openEpisodeStreams(episode, index)}
                          style={styles.railMoreBtn}>
                          <Text style={[styles.railMore, {color: accent}]}>
                            {episode.sources.length} Streams ›
                          </Text>
                        </Pressable>
                      </View>
                      <Text numberOfLines={2} style={styles.episodeTitle}>
                        {episode.title}
                      </Text>
                      <SourceGrid
                        sources={episode.sources}
                        columns={1}
                        title={`${item.title} · ${episode.title}`}
                        onWatch={onWatch}
                      />
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>
      )}

      <Modal
        visible={!!streamSheetTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setStreamSheetTarget(null)}>
        <View
          style={[
            styles.streamModalOverlay,
            isTV && styles.streamModalOverlayTV,
          ]}>
          <View
            style={[
              styles.streamSheet,
              isTV && styles.streamSheetTV,
              {backgroundColor: palette.panel},
            ]}>
            {!isTV ? <View style={styles.streamSheetHandle} /> : null}
            <View style={styles.settingsHeader}>
              <View style={{flex: 1}}>
                <Text numberOfLines={2} style={styles.settingsTitle}>
                  {streamSheetTarget?.title ?? ''}
                </Text>
                {streamSheetTarget?.subtitle ? (
                  <Text style={styles.settingsDescription}>
                    {streamSheetTarget.subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setStreamSheetTarget(null)}
                style={styles.settingsClose}>
                <Text style={styles.settingsCloseText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 16}}>
              <SourceGrid
                sources={streamSheetTarget?.sources ?? []}
                columns={isTV ? 2 : 1}
                title={streamSheetTarget?.title ?? item.title}
                onWatch={(src, streamTitle) => {
                  setStreamSheetTarget(null);
                  onWatch(src, streamTitle);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function SourceGrid({
  sources,
  columns,
  title,
  onWatch,
}: {
  sources: Source[];
  columns: number;
  title: string;
  onWatch: (source: Source, title: string) => void;
}) {
  if (!sources.length) {
    return <Text style={styles.meta}>No stream links available.</Text>;
  }
  return (
    <View style={styles.sourceGrid}>
      {sources.map((source, index) => (
        <SourceButton
          key={`${source.url}-${index}`}
          source={source}
          columns={columns}
          title={title}
          onWatch={onWatch}
        />
      ))}
    </View>
  );
}

export function SourceButton({
  source,
  columns,
  title,
  onWatch,
}: {
  source: Source;
  columns: number;
  title: string;
  onWatch: (source: Source, title: string) => void;
}) {
  const {theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [focused, setFocused] = useState(false);
  const sourceWidth = (
    columns === 1 ? '100%' : `${100 / columns - 2}%`
  ) as `${number}%` | '100%';

  let hostLabel = 'Direct Stream';
  try {
    const match = source.url.match(/^https?:\/\/([^/?#]+)/i);
    if (match?.[1]) {
      hostLabel = match[1].replace(/^www\./i, '');
    }
  } catch {
    hostLabel = 'Direct Stream';
  }

  return (
    <View
      style={[
        styles.source,
        {width: sourceWidth},
        focused && {borderColor: accent, borderWidth: 2, borderRadius: 16},
      ]}>
      <View style={styles.sourceCard}>
        <View style={styles.sourceHeaderRow}>
          <View style={styles.sourceQualityPill}>
            <Text numberOfLines={1} style={styles.sourceText}>
              {source.quality}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.meta}>
            {hostLabel}
          </Text>
        </View>

        <View style={styles.sourceActionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Play ${title}`}
            onPress={() => onWatch(source, title)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.sourcePlayButton}>
            <Text numberOfLines={1} style={styles.sourcePlayText}>
              ▶  Play Stream
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Download ${source.quality}`}
            onPress={() => {
              void Linking.openURL(source.url);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.sourceDownloadButton}>
            <Text numberOfLines={1} style={styles.sourceHint}>
              ↓  Download
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function SiteFooter({onNavigate}: {onNavigate: (tab: AppTab) => void}) {
  const {theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const year = new Date().getFullYear();

  const link = (label: string, tab: AppTab) => (
    <Pressable
      key={`${label}-${tab}`}
      onPress={() => onNavigate(tab)}
      style={styles.footerLink}>
      <Text style={styles.footerLinkText}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.siteFooter}>
      <View style={styles.footerBrand}>
        <View style={[styles.footerMark, {backgroundColor: accent}]}>
          <Text style={styles.footerMarkText}>N</Text>
        </View>
        <Text style={styles.footerBrandText}>Streamovie</Text>
      </View>
      <Text style={styles.footerDescription}>
        Stream and organize your movie and series catalog with artwork, ratings, and instant playback across mobile and TV.
      </Text>
      <View style={styles.footerColumns}>
        <View style={styles.footerColumn}>
          <Text style={styles.footerHeading}>BROWSE</Text>
          {link('Home', 'Home')}
          {link('Search', 'Search')}
          {link('Movies', 'Movies')}
          {link('Series', 'Series')}
          {link('Library', 'Saved')}
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.footerHeading}>CATALOG</Text>
          {link('Popular', 'Trending')}
          {link('Top 250 Movies', 'Top Movies')}
          {link('Top 250 Series', 'Top Series')}
        </View>
      </View>
      <View style={styles.footerBottom}>
        <Text style={styles.footerCopyright}>
          © {year} Streamovie. All rights reserved.
        </Text>
        <Pressable
          onPress={() => onNavigate('Home')}
          style={styles.backToTop}>
          <Text style={styles.footerLinkText}>↑  Back to top</Text>
        </Pressable>
      </View>
    </View>
  );
}
