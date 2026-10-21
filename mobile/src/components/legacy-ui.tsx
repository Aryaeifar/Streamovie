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
  TVHomeLayout,
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

function SmoothLeftVignette({
  width = 580,
  rgb = '11, 15, 22',
}: {
  width?: number;
  rgb?: string;
}) {
  const steps = [0.96, 0.92, 0.84, 0.72, 0.58, 0.44, 0.3, 0.18, 0.08, 0];
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width,
        flexDirection: 'row',
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
      Animated.spring(width, {
        toValue: active ? 22 : 6,
        useNativeDriver: false,
        friction: 6,
      }),
      Animated.timing(opacity, {
        toValue: active ? 1 : 0.45,
        duration: 220,
        useNativeDriver: false,
      }),
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

/**
 * NuvioTV Modern Home Hero Stage (Android TV 10-foot UI)
 * Updates dynamically when the user focuses cards in any catalog row or cycles featured titles.
 */
export function TVHeroStage({
  item,
  featuredItems = [],
  isSaved = false,
  tvHomeLayout,
  onOpen,
  onToggleSave,
  onSelectLayout,
}: {
  item: Media;
  featuredItems?: Media[];
  isSaved?: boolean;
  tvHomeLayout: TVHomeLayout;
  onOpen: (media: Media) => void;
  onToggleSave?: (media: Media) => void;
  onSelectLayout: (layout: TVHomeLayout) => void;
}) {
  const {theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [playFocused, setPlayFocused] = useState(false);
  const [saveFocused, setSaveFocused] = useState(false);
  const [focusedLayout, setFocusedLayout] = useState<TVHomeLayout | null>(null);

  const rawGenre = asText(item.raw?.genre, item.raw?.genres);
  const genresList = rawGenre
    .split(/[,،/·|]/)
    .map(g => g.trim())
    .filter(Boolean)
    .slice(0, 3);
  const yearDisplay = item.year
    ? item.kind === 'series' && !item.year.includes('–')
      ? `${item.year}–`
      : item.year
    : '2026';
  const duration = asText(item.raw?.duration, item.raw?.runtime);
  const country = asText(item.raw?.country, item.raw?.countries)
    .split(/[,،/·|]/)[0]
    ?.trim();
  const parsed = parseDescription(
    asText(item.raw?.description, item.raw?.summary, item.overview),
  );
  const synopsis =
    parsed.overview ||
    'Stream instantly in high definition with Nuvio TV adaptive playback, multi-source selection, and synced library progress.';

  const layouts: {id: TVHomeLayout; label: string}[] = [
    {id: 'modern', label: 'Modern'},
    {id: 'classic', label: 'Classic'},
    {id: 'grid', label: 'Grid'},
  ];

  return (
    <View style={styles.tvHeroStage}>
      {item.backdrop || item.image ? (
        <Image
          source={{uri: item.backdrop || item.image}}
          resizeMode="cover"
          style={styles.spotlightImage}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(9, 13, 20, 0.34)',
        }}
      />
      <SmoothLeftVignette width={760} rgb="11, 15, 22" />
      <SmoothTopFade height={90} rgb="11, 15, 22" />
      <SmoothBottomFade height={220} rgb="14, 19, 27" />

      {/* Top Bar: Nuvio TV Live Focus Indicator + Home Layout Switcher (Modern / Classic / Grid) */}
      <View style={styles.tvHeroTopBar}>
        <View style={styles.tvHeroBrandCluster}>
          <View style={styles.tvHeroLiveBadge}>
            <View style={[styles.tvHeroLiveDot, {backgroundColor: accent}]} />
            <Text style={styles.tvHeroLiveText}>
              NUVIO TV  •  {tvHomeLayout.toUpperCase()} VIEW
            </Text>
          </View>
        </View>

        <View style={styles.tvLayoutSwitcher}>
          {layouts.map(layout => {
            const active = tvHomeLayout === layout.id;
            const focused = focusedLayout === layout.id;
            return (
              <Pressable
                key={layout.id}
                accessibilityRole="button"
                accessibilityLabel={`${layout.label} layout`}
                onFocus={() => setFocusedLayout(layout.id)}
                onBlur={() => setFocusedLayout(null)}
                onPress={() => onSelectLayout(layout.id)}
                style={[
                  styles.tvLayoutPill,
                  active && styles.tvLayoutPillActive,
                  focused && {borderColor: accent, backgroundColor: `${accent}26`},
                ]}>
                <Text
                  style={[
                    styles.tvLayoutPillText,
                    (active || focused) && styles.tvLayoutPillTextActive,
                  ]}>
                  {layout.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Main Hero Metadata Stage */}
      <View style={styles.tvHeroBody}>
        <View style={styles.tvHeroBadgeRow}>
          <View
            style={[
              styles.tvHeroTypeBadge,
              {borderColor: `${accent}66`, backgroundColor: `${accent}24`},
            ]}>
            <Text style={[styles.tvHeroTypeBadgeText, {color: '#ffffff'}]}>
              {item.kind === 'series' ? 'SERIES' : 'MOVIE'}
            </Text>
          </View>

          {item.rating ? (
            <View style={styles.tvHeroImdbBadge}>
              <Text style={styles.tvHeroImdbText}>★ {item.rating} IMDb</Text>
            </View>
          ) : null}

          <View style={styles.tvHeroMetaPill}>
            <Text style={styles.tvHeroMetaPillText}>{yearDisplay}</Text>
          </View>

          {duration ? (
            <View style={styles.tvHeroMetaPill}>
              <Text style={styles.tvHeroMetaPillText}>{duration}</Text>
            </View>
          ) : null}

          {country ? (
            <View style={styles.tvHeroMetaPill}>
              <Text style={styles.tvHeroMetaPillText}>{country}</Text>
            </View>
          ) : null}

          {genresList.map(g => (
            <View key={g} style={styles.tvHeroMetaPill}>
              <Text style={styles.tvHeroMetaPillText}>{g}</Text>
            </View>
          ))}
        </View>

        <Text numberOfLines={2} style={styles.tvHeroTitle}>
          {item.title}
        </Text>

        <Text numberOfLines={3} style={styles.tvHeroOverview}>
          {synopsis}
        </Text>

        <View style={styles.tvHeroActionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Watch ${item.title}`}
            onFocus={() => setPlayFocused(true)}
            onBlur={() => setPlayFocused(false)}
            onPress={() => onOpen(item)}
            style={[
              styles.tvHeroPrimaryBtn,
              playFocused && {
                borderColor: accent,
                transform: [{scale: 1.04}],
              },
            ]}>
            <Text style={styles.tvHeroPrimaryBtnText}>▶  Watch / Streams</Text>
          </Pressable>

          {onToggleSave ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isSaved ? 'Remove from Library' : 'Add to Library'
              }
              onFocus={() => setSaveFocused(true)}
              onBlur={() => setSaveFocused(false)}
              onPress={() => onToggleSave(item)}
              style={[
                styles.tvHeroSecondaryBtn,
                isSaved && {
                  borderColor: `${accent}88`,
                  backgroundColor: `${accent}24`,
                },
                saveFocused && {
                  borderColor: accent,
                  transform: [{scale: 1.04}],
                },
              ]}>
              <Text style={styles.tvHeroSecondaryBtnText}>
                {isSaved ? '✓  In Library' : '+  Add to Library'}
              </Text>
            </Pressable>
          ) : null}

          {featuredItems.length > 1 ? (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8}}>
              {featuredItems.slice(0, 6).map(slide => {
                const active =
                  slide.id === item.id && slide.kind === item.kind;
                return (
                  <View
                    key={`${slide.kind}-${slide.id}`}
                    style={[
                      styles.spotlightDot,
                      active && [
                        styles.spotlightDotActive,
                        {backgroundColor: accent},
                      ],
                    ]}
                  />
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    </View>
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
    <View
      style={[styles.spotlightWrapper, isTV && styles.spotlightWrapperTV]}
      {...panResponder.panHandlers}>
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
        {isTV ? <SmoothLeftVignette width={640} rgb="11, 15, 22" /> : null}
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
  onFocusItem,
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
  onFocusItem?: (item: Media) => void;
  onSeeAll?: () => void;
}) {
  const {landscapeCards, theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [seeAllFocused, setSeeAllFocused] = useState(false);
  const useLandscape = continueWatching || landscape || landscapeCards;

  // On mobile portrait rails: ~3 cards visible across screen (matching NuvioMobile)
  // On TV portrait rails: ~5.5 cards visible across screen (matching NuvioTV 10-foot rows)
  const portraitWidth = isTV
    ? Math.min(Math.max(Math.floor((width - 78 - 80 - 72) / 5.2), 178), 228)
    : width >= 620
    ? Math.floor((width - 32 - 36) / 4.3)
    : Math.floor((width - 32 - 20) / 3.05);

  const tileWidth = continueWatching
    ? isTV
      ? 296
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
        {onSeeAll ? (
          <Pressable
            accessibilityRole="button"
            onFocus={() => setSeeAllFocused(true)}
            onBlur={() => setSeeAllFocused(false)}
            onPress={onSeeAll}
            style={[
              styles.railMoreBtn,
              isTV && {
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: seeAllFocused
                  ? accent
                  : 'rgba(255,255,255,0.14)',
                backgroundColor: seeAllFocused
                  ? `${accent}24`
                  : 'rgba(255,255,255,0.06)',
              },
            ]}>
            <Text
              style={[
                styles.railMore,
                isTV && {color: seeAllFocused ? '#ffffff' : '#c9d1d9', fontSize: 12.5},
              ]}>
              See All ›
            </Text>
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
              onFocusItem={onFocusItem}
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

const CONTINUE_PROGRESS_PCTS = ['38%', '64%', '52%', '28%', '76%', '45%'] as const;

export function MediaCard({
  item,
  isTV = false,
  landscape = false,
  continueWatching = false,
  continueIndex = 0,
  defaultHighlighted = false,
  rank,
  onFocusItem,
  onPress,
}: {
  item: Media;
  isTV?: boolean;
  landscape?: boolean;
  continueWatching?: boolean;
  continueIndex?: number;
  defaultHighlighted?: boolean;
  rank?: number;
  onFocusItem?: (item: Media) => void;
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

  const handleFocus = () => {
    setFocused(true);
    onFocusItem?.(item);
  };

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
    const progressPct =
      CONTINUE_PROGRESS_PCTS[continueIndex % CONTINUE_PROGRESS_PCTS.length];

    return (
      <Pressable
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={() => setFocused(false)}
        style={[
          styles.card,
          styles.cardLandscape,
          highlighted && styles.cardFocused,
        ]}>
        <View
          style={[
            styles.posterFrame,
            isTV && styles.posterFrameTV,
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

          <SmoothBottomFade height={isTV ? 96 : 84} />

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
            {isTV ? (
              <View style={styles.continueProgressTrack}>
                <View
                  style={[
                    styles.continueProgressFill,
                    {width: progressPct, backgroundColor: accent},
                  ]}
                />
              </View>
            ) : (
              <View style={cardExtraStyles.continueShortDash} />
            )}
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
      onFocus={handleFocus}
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

        {isTV && item.rating ? (
          <Text style={styles.posterRating}>★ {item.rating}</Text>
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
        style={[
          styles.meta,
          isTV && styles.metaTV,
          highlighted && isTV && {color: '#c9d1d9'},
        ]}>
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

const PROFILE_LABELS: Record<string, {name: string; initial: string}> = {
  main: {name: 'Alex', initial: 'A'},
  cinema: {name: 'Cinema', initial: 'C'},
  night: {name: 'Night Owl', initial: 'N'},
  kids: {name: 'Family', initial: 'F'},
};

/**
 * NuvioTV Collapsible Navigation Drawer for Android TV
 * Collapses to 78px when browsing content; expands to 228px when any nav item receives D-pad focus.
 */
export function TVNavigation({
  selected,
  settingsActive = false,
  onSelect,
  onSettings,
  accent,
  showTop250Movies,
  showTop250Series,
}: {
  selected: AppTab;
  settingsActive?: boolean;
  onSelect: (tab: AppTab) => void;
  onSettings: () => void;
  accent: string;
  locale: Locale;
  showTop250Movies: boolean;
  showTop250Series: boolean;
}) {
  const {activeProfile} = useContext(SettingsContext);
  const [focusedItemKey, setFocusedItemKey] = useState<string | null>(null);
  const isExpanded = focusedItemKey !== null;
  const profileMeta = PROFILE_LABELS[activeProfile] ?? PROFILE_LABELS.main;

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
      ? [{name: 'Top Movies' as const, icon: 'top' as const, label: 'Top 250 Movies'}]
      : []),
    ...(showTop250Series
      ? [{name: 'Top Series' as const, icon: 'top' as const, label: 'Top 250 Series'}]
      : []),
  ];

  const settingsFocused = focusedItemKey === '__settings__';

  return (
    <View
      accessibilityLabel="Sidebar navigation"
      style={[
        styles.tvNavigation,
        isExpanded && styles.tvNavigationExpanded,
      ]}>
      {/* NuvioTV Brand Header */}
      <View style={styles.tvBrandHeader}>
        <View style={[styles.tvBrandMark, {backgroundColor: accent}]}>
          <Text style={{color: '#fff', fontSize: 19, fontWeight: '900'}}>N</Text>
        </View>
        {isExpanded ? (
          <View style={{flex: 1}}>
            <Text
              numberOfLines={1}
              style={{
                color: '#ffffff',
                fontSize: 17,
                fontWeight: '800',
                letterSpacing: -0.3,
              }}>
              Nuvio TV
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: '#7d8597',
                fontSize: 10.5,
                fontWeight: '700',
                letterSpacing: 0.4,
              }}>
              STREAMOVIE
            </Text>
          </View>
        ) : null}
      </View>

      {/* Navigation Items */}
      <View style={styles.tvNavigationItems}>
        {items.map(item => {
          const isSelected = !settingsActive && selected === item.name;
          const isFocused = focusedItemKey === item.name;
          return (
            <Pressable
              key={item.name}
              accessibilityRole="tab"
              accessibilityState={{selected: isSelected}}
              onPress={() => onSelect(item.name)}
              onFocus={() => setFocusedItemKey(item.name)}
              onBlur={() =>
                setFocusedItemKey(prev => (prev === item.name ? null : prev))
              }
              style={[
                styles.tvNavigationItem,
                isExpanded && styles.tvNavigationItemExpanded,
                isSelected && styles.tvNavigationSelected,
                isFocused && [styles.tvNavigationFocused, {borderColor: accent}],
              ]}>
              {isSelected ? (
                <View
                  style={[styles.tvNavActiveBar, {backgroundColor: accent}]}
                />
              ) : null}
              <NavIcon
                name={item.icon}
                color={isSelected || isFocused ? '#ffffff' : '#8b949e'}
                size={20}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.tvNavigationLabel,
                  isExpanded && styles.tvNavigationLabelExpanded,
                  (isSelected || isFocused) && styles.tvNavigationTextActive,
                ]}>
                {isExpanded
                  ? item.label
                  : item.label.replace(' Movies', '').replace(' Series', ' TV')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Bottom Profile & Settings Switcher */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profile & Settings"
        onPress={onSettings}
        onFocus={() => setFocusedItemKey('__settings__')}
        onBlur={() =>
          setFocusedItemKey(prev => (prev === '__settings__' ? null : prev))
        }
        style={[
          styles.tvNavigationItem,
          isExpanded && styles.tvNavigationItemExpanded,
          settingsActive && styles.tvNavigationSelected,
          settingsFocused && [
            styles.tvNavigationFocused,
            {borderColor: accent},
          ],
        ]}>
        {settingsActive ? (
          <View style={[styles.tvNavActiveBar, {backgroundColor: accent}]} />
        ) : null}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{color: '#090b10', fontSize: 11, fontWeight: '900'}}>
            {profileMeta.initial}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={[
            styles.tvNavigationLabel,
            isExpanded && styles.tvNavigationLabelExpanded,
            (settingsActive || settingsFocused) && styles.tvNavigationTextActive,
          ]}>
          {isExpanded ? `${profileMeta.name} • Settings` : 'Profile'}
        </Text>
      </Pressable>
    </View>
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

function TVEpisodeCard({
  episode,
  epCode,
  accent,
  onSelectEpisode,
}: {
  episode: Episode;
  epCode: string;
  accent: string;
  onSelectEpisode: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${epCode} ${episode.title}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onSelectEpisode}
      style={[
        tvDetailStyles.episodeCard,
        focused && {
          borderColor: accent,
          backgroundColor: 'rgba(88, 166, 255, 0.14)',
          transform: [{scale: 1.015}],
        },
      ]}>
      <View style={tvDetailStyles.episodeBadgeBox}>
        <Text style={[tvDetailStyles.episodeBadgeCode, {color: accent}]}>
          {epCode}
        </Text>
        <View style={tvDetailStyles.episodePlayCircle}>
          <Text style={{color: '#090b10', fontSize: 11, fontWeight: '900'}}>
            ▶
          </Text>
        </View>
      </View>
      <View style={{flex: 1, gap: 4}}>
        <Text numberOfLines={1} style={tvDetailStyles.episodeTitleText}>
          {episode.title}
        </Text>
        <Text style={tvDetailStyles.episodeSubText}>
          {episode.sources.length > 0
            ? `${episode.sources.length} stream sources available  •  Click to select stream`
            : 'No streams available yet'}
        </Text>
      </View>
      <View
        style={[
          tvDetailStyles.episodeStreamCountPill,
          focused && {backgroundColor: '#ffffff'},
        ]}>
        <Text
          style={[
            tvDetailStyles.episodeStreamCountText,
            focused && {color: '#090b10'},
          ]}>
          {episode.sources.length} Streams ›
        </Text>
      </View>
    </Pressable>
  );
}

export function Detail({
  item,
  isSaved,
  onSave,
  onBack,
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
  onBack?: () => void;
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
  const [backFocused, setBackFocused] = useState(false);
  const [playFocused, setPlayFocused] = useState(false);
  const [saveFocused, setSaveFocused] = useState(false);

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

  // Android TV 10-Foot NuvioTV MetaDetailsScreen & StreamScreen UI
  if (isTV) {
    const cleanFields = description.fields.filter(
      field => field.label !== 'Persian title',
    );
    const genresList = rawGenre
      .split(/[,،/·|]/)
      .map(g => g.trim())
      .filter(Boolean)
      .slice(0, 4);

    return (
      <View style={[styles.detail, {backgroundColor: palette.tvBg ?? palette.bg}]}>
        {/* Full-bleed NuvioTV MetaDetails Hero */}
        <View
          style={[
            tvDetailStyles.heroContainer,
            {backgroundColor: palette.tvBg ?? palette.bg},
          ]}>
          {item.backdrop || item.image ? (
            <Image
              source={{uri: item.backdrop || item.image}}
              resizeMode="cover"
              style={styles.detailBackdrop}
            />
          ) : null}
          <View
            pointerEvents="none"
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(10, 14, 21, 0.56)',
            }}
          />
          <SmoothLeftVignette width={820} rgb="11, 15, 22" />
          <SmoothTopFade height={96} rgb="11, 15, 22" />
          <SmoothBottomFade height={220} rgb="14, 19, 27" />

          {/* Top Navigation Bar on Detail Screen */}
          <View style={tvDetailStyles.topNavRow}>
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onFocus={() => setBackFocused(true)}
                onBlur={() => setBackFocused(false)}
                onPress={onBack}
                style={[
                  tvDetailStyles.backPill,
                  backFocused && {
                    borderColor: accent,
                    backgroundColor: `${accent}28`,
                    transform: [{scale: 1.04}],
                  },
                ]}>
                <Text style={tvDetailStyles.backPillText}>←  Back</Text>
              </Pressable>
            ) : null}

            <View style={tvDetailStyles.topRightBadges}>
              <View style={styles.tvHeroTypeBadge}>
                <Text style={styles.tvHeroTypeBadgeText}>
                  {item.kind === 'series' ? 'TV SERIES' : 'FEATURE FILM'}
                </Text>
              </View>
              {item.rating ? (
                <View style={styles.tvHeroImdbBadge}>
                  <Text style={styles.tvHeroImdbText}>★ {item.rating} IMDb</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Main 10-Foot Poster + Metadata Content Row */}
          <View style={tvDetailStyles.heroMainRow}>
            {item.image ? (
              <Image
                source={{uri: item.image}}
                resizeMode="cover"
                style={tvDetailStyles.posterLarge}
              />
            ) : null}

            <View style={tvDetailStyles.metaStage}>
              <Text style={tvDetailStyles.titleLarge}>{item.title}</Text>

              <View style={tvDetailStyles.chipsRow}>
                <View style={styles.tvHeroMetaPill}>
                  <Text style={styles.tvHeroMetaPillText}>
                    {item.year || '2026'}
                  </Text>
                </View>
                {asText(item.raw.duration, item.raw.runtime) ? (
                  <View style={styles.tvHeroMetaPill}>
                    <Text style={styles.tvHeroMetaPillText}>
                      {asText(item.raw.duration, item.raw.runtime)}
                    </Text>
                  </View>
                ) : null}
                {asText(item.raw.country, item.raw.countries) ? (
                  <View style={styles.tvHeroMetaPill}>
                    <Text style={styles.tvHeroMetaPillText}>
                      {asText(item.raw.country, item.raw.countries)}
                    </Text>
                  </View>
                ) : null}
                {genresList.map(genre => (
                  <View key={genre} style={styles.tvHeroMetaPill}>
                    <Text style={styles.tvHeroMetaPillText}>{genre}</Text>
                  </View>
                ))}
              </View>

              {description.overview ? (
                <Text numberOfLines={4} style={tvDetailStyles.overviewText}>
                  {description.overview}
                </Text>
              ) : null}

              {cleanFields.length > 0 ? (
                <View style={tvDetailStyles.creditsStrip}>
                  {cleanFields.slice(0, 3).map((field, idx) => (
                    <View
                      key={`${field.label}-${idx}`}
                      style={tvDetailStyles.creditBox}>
                      <Text style={tvDetailStyles.creditLabel}>
                        {field.label}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={tvDetailStyles.creditValue}>
                        {field.value}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={tvDetailStyles.actionsRow}>
                {item.kind === 'movie' ? (
                  <Pressable
                    accessibilityRole="button"
                    onFocus={() => setPlayFocused(true)}
                    onBlur={() => setPlayFocused(false)}
                    onPress={openMovieStreams}
                    style={[
                      styles.tvHeroPrimaryBtn,
                      playFocused && {
                        borderColor: accent,
                        transform: [{scale: 1.04}],
                      },
                    ]}>
                    <Text style={styles.tvHeroPrimaryBtnText}>
                      ▶  Play / Select Stream ({mediaSources.length})
                    </Text>
                  </Pressable>
                ) : currentSeason?.episodes?.[0] ? (
                  <Pressable
                    accessibilityRole="button"
                    onFocus={() => setPlayFocused(true)}
                    onBlur={() => setPlayFocused(false)}
                    onPress={() =>
                      openEpisodeStreams(currentSeason.episodes[0], 0)
                    }
                    style={[
                      styles.tvHeroPrimaryBtn,
                      playFocused && {
                        borderColor: accent,
                        transform: [{scale: 1.04}],
                      },
                    ]}>
                    <Text style={styles.tvHeroPrimaryBtnText}>
                      ▶  Play S{seasonIndex + 1}:E1
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  onFocus={() => setSaveFocused(true)}
                  onBlur={() => setSaveFocused(false)}
                  onPress={onSave}
                  style={[
                    styles.tvHeroSecondaryBtn,
                    isSaved && {
                      borderColor: `${accent}88`,
                      backgroundColor: `${accent}24`,
                    },
                    saveFocused && {
                      borderColor: accent,
                      transform: [{scale: 1.04}],
                    },
                  ]}>
                  <Text style={styles.tvHeroSecondaryBtnText}>
                    {isSaved ? '✓  Saved in Library' : '+  Add to Library'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Streams or Episodes Section on TV */}
        {item.kind === 'movie' ? (
          <View
            style={[
              styles.section,
              styles.sectionTV,
              {backgroundColor: palette.panel},
            ]}>
            <View style={styles.detailSectionHeading}>
              <View>
                <Text style={[styles.panelHeading, {fontSize: 20, marginBottom: 4}]}>
                  Available Streams ({mediaSources.length})
                </Text>
                <Text style={styles.railSubtitleTV}>
                  Select a stream quality to launch the Nuvio TV player or external download
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
              styles.sectionTV,
              {backgroundColor: palette.panel},
            ]}>
            <View style={styles.detailSectionHeading}>
              <View>
                <Text style={[styles.panelHeading, {fontSize: 20, marginBottom: 4}]}>
                  Seasons & Episodes
                </Text>
                <Text style={styles.railSubtitleTV}>
                  Choose a season tab and select an episode to view available streams
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

                <View style={tvDetailStyles.episodesList}>
                  {seasons[seasonIndex]?.episodes.map((episode, index) => {
                    const epCode = `S${seasonIndex + 1} · E${index + 1}`;
                    return (
                      <TVEpisodeCard
                        key={`${episode.title}-${index}`}
                        episode={episode}
                        epCode={epCode}
                        accent={accent}
                        onSelectEpisode={() =>
                          openEpisodeStreams(episode, index)
                        }
                      />
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {/* NuvioTV Stream Selector Modal */}
        <Modal
          visible={!!streamSheetTarget}
          transparent
          animationType="fade"
          onRequestClose={() => setStreamSheetTarget(null)}>
          <View style={[styles.streamModalOverlay, styles.streamModalOverlayTV]}>
            <View
              style={[
                styles.streamSheet,
                styles.streamSheetTV,
                {backgroundColor: palette.panel},
              ]}>
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
                  columns={2}
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

  // Mobile & Tablet Detail Layout (Unchanged)
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

const tvDetailStyles = StyleSheet.create({
  heroContainer: {
    position: 'relative',
    minHeight: 480,
    paddingHorizontal: 44,
    paddingTop: 26,
    paddingBottom: 32,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
    marginBottom: 18,
  },
  backPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 20, 29, 0.85)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  backPillText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  topRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 32,
    zIndex: 5,
  },
  posterLarge: {
    width: 215,
    aspectRatio: 0.67,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.20)',
    backgroundColor: '#121721',
  },
  metaStage: {
    flex: 1,
    gap: 10,
  },
  titleLarge: {
    color: '#ffffff',
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overviewText: {
    color: 'rgba(235, 240, 246, 0.88)',
    fontSize: 14.5,
    lineHeight: 22,
    maxWidth: 740,
    marginTop: 4,
  },
  creditsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 18, 26, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    maxWidth: 740,
  },
  creditBox: {
    minWidth: 140,
    flex: 1,
  },
  creditLabel: {
    color: '#7d8597',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  creditValue: {
    color: '#f0f4f8',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  episodesList: {
    gap: 10,
    marginTop: 10,
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  episodeBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 96,
  },
  episodeBadgeCode: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  episodePlayCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeTitleText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '700',
  },
  episodeSubText: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '500',
  },
  episodeStreamCountPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  episodeStreamCountText: {
    color: '#e6edf3',
    fontSize: 12,
    fontWeight: '700',
  },
});

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
