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
 * Paramount+ Style Home Hero Stage (Android TV 10-foot UI — Image 1: LANDMAN)
 * Updates dynamically when the user focuses cards in any catalog row or cycles featured titles.
 */
export function TVHeroStage({
  item,
  isSaved = false,
  onOpen,
  onToggleSave,
}: {
  item: Media;
  featuredItems?: Media[];
  isSaved?: boolean;
  tvHomeLayout: TVHomeLayout;
  onOpen: (media: Media) => void;
  onToggleSave?: (media: Media) => void;
  onSelectLayout: (layout: TVHomeLayout) => void;
}) {
  const [playFocused, setPlayFocused] = useState(false);
  const [saveFocused, setSaveFocused] = useState(false);

  const rawGenre = asText(item.raw?.genre, item.raw?.genres);
  const primaryGenre = (
    rawGenre.split(/[,،/·|]/)[0]?.trim() ||
    (item.kind === 'series' ? 'DRAMA' : 'FEATURE')
  ).toUpperCase();
  const yearDisplay = item.year || '2026';
  const duration = asText(item.raw?.duration, item.raw?.runtime).toUpperCase();
  const parsed = parseDescription(
    asText(item.raw?.description, item.raw?.summary, item.overview),
  );
  const synopsis =
    parsed.overview ||
    item.overview ||
    'Stream instantly in high definition with adaptive playback and multi-source selection.';
  const castField =
    parsed.fields.find(f => f.label === 'Cast')?.value ||
    asText(item.raw?.cast, item.raw?.stars, item.raw?.actors);

  const metaTokens = [
    primaryGenre,
    item.kind === 'series' ? 'SERIES' : duration || 'MOVIE',
    yearDisplay,
    item.rating ? `★ ${item.rating}` : 'TV-MA',
    '4K',
  ].filter(Boolean);

  return (
    <View style={[styles.tvHeroStage, {backgroundColor: '#06070a', minHeight: 410}]}>
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
          backgroundColor: 'rgba(6, 7, 10, 0.28)',
        }}
      />
      <SmoothLeftVignette width={820} rgb="6, 7, 10" />
      <SmoothTopFade height={70} rgb="6, 7, 10" />
      <SmoothBottomFade height={220} rgb="6, 7, 10" />

      {/* Paramount+ Left-Aligned Hero Metadata Block (LANDMAN Layout) */}
      <View style={[styles.tvHeroBody, {marginTop: 24, maxWidth: 600}]}>
        <Text
          numberOfLines={2}
          style={{
            color: '#ffffff',
            fontSize: 44,
            lineHeight: 50,
            fontWeight: '900',
            letterSpacing: 3.2,
            textTransform: 'uppercase',
            textShadowColor: 'rgba(0,0,0,0.9)',
            textShadowOffset: {width: 0, height: 2},
            textShadowRadius: 12,
          }}>
          {item.title}
        </Text>

        {/* Uppercase Inline Metadata Row: DRAMA  2 SEASONS  2024  TV-MA  4K */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            marginTop: 12,
          }}>
          {metaTokens.map((token, idx) => (
            <Text
              key={`${token}-${idx}`}
              style={{
                color: 'rgba(255, 255, 255, 0.86)',
                fontSize: 11.5,
                fontWeight: '800',
                letterSpacing: 1.1,
              }}>
              {token}
            </Text>
          ))}
        </View>

        {/* Bold Status Callout: ALL EPISODES NOW STREAMING */}
        <Text
          style={{
            color: '#ffffff',
            fontSize: 13.5,
            fontWeight: '900',
            letterSpacing: 0.8,
            marginTop: 10,
            textTransform: 'uppercase',
          }}>
          {item.kind === 'series'
            ? 'ALL EPISODES NOW STREAMING'
            : 'NOW STREAMING'}
        </Text>

        {/* Synopsis Paragraph */}
        <Text
          numberOfLines={3}
          style={{
            color: '#e5e9f0',
            fontSize: 14,
            lineHeight: 20,
            fontWeight: '400',
            marginTop: 10,
            maxWidth: 520,
          }}>
          {synopsis}
        </Text>

        {/* Cast / Featuring Line */}
        {castField ? (
          <Text
            numberOfLines={1}
            style={{
              color: '#9aa2b1',
              fontSize: 12.5,
              fontWeight: '500',
              marginTop: 8,
              maxWidth: 520,
            }}>
            Featuring: {castField}
          </Text>
        ) : null}

        {/* Subtle D-Pad Action Row */}
        <View style={[styles.tvHeroActionsRow, {marginTop: 16}]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Watch ${item.title}`}
            onFocus={() => setPlayFocused(true)}
            onBlur={() => setPlayFocused(false)}
            onPress={() => onOpen(item)}
            style={[
              {
                height: 44,
                paddingHorizontal: 24,
                borderRadius: 6,
                backgroundColor: '#0064FF',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2.5,
                borderColor: 'transparent',
              },
              playFocused && {
                backgroundColor: '#1a75ff',
                borderColor: '#ffffff',
                transform: [{scale: 1.05}],
              },
            ]}>
            <Text
              style={{
                color: '#ffffff',
                fontSize: 13,
                fontWeight: '800',
                letterSpacing: 1,
              }}>
              ▶  WATCH NOW
            </Text>
          </Pressable>

          {onToggleSave ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'
              }
              onFocus={() => setSaveFocused(true)}
              onBlur={() => setSaveFocused(false)}
              onPress={() => onToggleSave(item)}
              style={[
                {
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSaved
                    ? 'rgba(0, 100, 255, 0.28)'
                    : 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 2,
                  borderColor: isSaved ? '#0064FF' : 'rgba(255,255,255,0.22)',
                },
                saveFocused && {
                  borderColor: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  transform: [{scale: 1.08}],
                },
              ]}>
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 22,
                  lineHeight: 24,
                  fontWeight: '400',
                }}>
                {isSaved ? '✓' : '+'}
              </Text>
            </Pressable>
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

  // On mobile portrait rails: ~3 cards visible across screen (matching Streamovie Mobile)
  // On TV portrait rails: ~5.5 cards visible across screen (matching Streamovie TV 10-foot rows)
  const portraitWidth = isTV
    ? Math.min(Math.max(Math.floor((width - 72 - 80 - 72) / 5.2), 178), 228)
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

/**
 * Paramount+ Android TV Left Vertical Navigation Rail (Image 1)
 * Seamless dark vertical icon rail with 4px white left dot on active item
 * and smooth D-pad focus highlight/scale.
 */
export function TVNavigation({
  selected,
  onSelect,
  showTop250Movies,
  showTop250Series,
}: {
  selected: AppTab;
  onSelect: (tab: AppTab) => void;
  accent: string;
  locale: Locale;
  showTop250Movies: boolean;
  showTop250Series: boolean;
}) {
  const [focusedItemKey, setFocusedItemKey] = useState<string | null>(null);

  const items: {
    name: AppTab;
    icon?: NavIconName;
    glyph?: string;
    label: string;
    matchTabs?: AppTab[];
  }[] = [
    {name: 'Search', icon: 'search', label: 'Search'},
    {name: 'Home', icon: 'home', label: 'Home'},
    {name: 'Series', icon: 'series', label: 'Series'},
    {name: 'Movies', icon: 'movies', label: 'Movies'},
    {name: 'Trending', icon: 'trending', label: 'Browse'},
    ...(showTop250Movies || showTop250Series
      ? [
          {
            name: (showTop250Movies ? 'Top Movies' : 'Top Series') as AppTab,
            icon: 'top' as const,
            label: 'Top Rated',
            matchTabs: ['Top Movies', 'Top Series'] as AppTab[],
          },
        ]
      : []),
    {name: 'Saved', glyph: '+', label: 'Watchlist'},
  ];

  return (
    <View accessibilityLabel="Sidebar navigation" style={styles.tvNavigation}>
      <View style={styles.tvNavigationItems}>
        {items.map(item => {
          const isSelected = item.matchTabs
            ? item.matchTabs.includes(selected)
            : selected === item.name;
          const isFocused = focusedItemKey === item.name;
          const iconColor = isSelected || isFocused ? '#ffffff' : '#8a92a0';

          return (
            <Pressable
              key={item.name}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{selected: isSelected}}
              onPress={() => onSelect(item.name)}
              onFocus={() => setFocusedItemKey(item.name)}
              onBlur={() =>
                setFocusedItemKey(prev => (prev === item.name ? null : prev))
              }
              style={[
                styles.tvNavigationItem,
                isSelected && styles.tvNavigationSelected,
                isFocused && styles.tvNavigationFocused,
              ]}>
              {isSelected ? <View style={styles.tvNavActiveBar} /> : null}
              {item.glyph ? (
                <Text
                  style={{
                    color: iconColor,
                    fontSize: 22,
                    lineHeight: 24,
                    fontWeight: '400',
                  }}>
                  {item.glyph}
                </Text>
              ) : item.icon ? (
                <NavIcon name={item.icon} color={iconColor} size={19} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AppHeader({
  selected,
  tab,
  searchDraft,
  isTV,
  isSearching = false,
  resultCount,
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
  isSearching?: boolean;
  resultCount?: number;
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
    <View style={{paddingTop: isTV ? 16 : 10, paddingBottom: 6}}>
      {tab !== 'Saved' ? (
        <View style={isTV ? styles.tvSearchRow : undefined}>
          <SearchFilterBar
            value={searchDraft}
            placeholder="Search movies, series, genres..."
            isPersian={false}
            accent={palette.accent}
            isTV={isTV}
            isSearching={isSearching}
            resultCount={resultCount}
            filtersOpen={filtersOpen}
            showSuggestions={tab === 'Search'}
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

function formatDisneyEpisodeTitle(
  rawTitle: string,
  episodeIndex: number,
  durationText: string,
): string {
  const cleaned = rawTitle
    .replace(/^(?:episode|ep|e|قسمت)\s*\d+\s*[:.\-–—]?\s*/i, '')
    .replace(/^\d+\s*[.:\-–—]\s*/, '')
    .trim();
  const titlePart = cleaned || `Episode ${episodeIndex + 1}`;
  const durMatch = durationText.match(/(\d+)\s*(?:m|min|دقیقه)/i);
  const dur = durMatch
    ? `${durMatch[1]}m`
    : /^\d+$/.test(durationText.trim())
    ? `${durationText.trim()}m`
    : durationText.trim() || '22m';
  return `${episodeIndex + 1}. ${titlePart} (${dur})`;
}

function formatDisneySeasonLabel(rawTitle: string, index: number): string {
  const stripped = rawTitle.replace(/\s*\(\d+\)\s*$/, '').trim();
  if (!stripped || /^\d+$/.test(stripped) || /فصل/.test(stripped)) {
    return `Season ${index + 1}`;
  }
  if (/^season\s*\d+/i.test(stripped)) {
    return stripped.replace(/^season\s*/i, 'Season ');
  }
  return stripped;
}

function TVEpisodeCard({
  episode,
  episodeIndex,
  fallbackImage,
  fallbackDuration,
  fallbackOverview,
  onSelectEpisode,
}: {
  episode: Episode;
  episodeIndex: number;
  fallbackImage: string;
  fallbackDuration: string;
  fallbackOverview: string;
  onSelectEpisode: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const thumbnailUri = episode.image || fallbackImage;
  const formattedTitle = formatDisneyEpisodeTitle(
    episode.title,
    episodeIndex,
    episode.duration || fallbackDuration,
  );
  const epDescription =
    episode.description ||
    fallbackOverview ||
    'Stream this episode in high definition on Streamovie.';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formattedTitle}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onSelectEpisode}
      style={[
        tvDetailStyles.disneyEpisodeCard,
        focused && tvDetailStyles.disneyEpisodeCardFocused,
      ]}>
      <View
        style={[
          tvDetailStyles.disneyEpisodeThumbFrame,
          focused && tvDetailStyles.disneyEpisodeThumbFrameFocused,
        ]}>
        {thumbnailUri ? (
          <Image
            source={{uri: thumbnailUri}}
            resizeMode="cover"
            style={tvDetailStyles.disneyEpisodeThumb}
          />
        ) : (
          <View
            style={[
              tvDetailStyles.disneyEpisodeThumb,
              styles.posterPlaceholder,
            ]}>
            <Text style={styles.body}>Episode {episodeIndex + 1}</Text>
          </View>
        )}
      </View>

      <Text numberOfLines={1} style={tvDetailStyles.disneyEpisodeTitle}>
        {formattedTitle}
      </Text>

      <Text numberOfLines={3} style={tvDetailStyles.disneyEpisodeDesc}>
        {epDescription}
      </Text>
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
  const [tvDetailTab, setTvDetailTab] = useState<
    'episodes' | 'suggested' | 'details'
  >('episodes');
  const [focusedDetailTab, setFocusedDetailTab] = useState<string | null>(null);
  const [focusedSeasonIdx, setFocusedSeasonIdx] = useState<number | null>(null);

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

  // Paramount+ Android TV Details / Title Page (Image 2: MOBLAND) + Widescreen Episode Rail
  if (isTV) {
    const cleanFields = description.fields.filter(
      field => field.label !== 'Persian title',
    );
    const genresList = rawGenre
      .split(/[,،/·|]/)
      .map(g => g.trim())
      .filter(Boolean)
      .slice(0, 4);
    const primaryGenre = (
      genresList[0] || (item.kind === 'series' ? 'DRAMA' : 'FEATURE')
    ).toUpperCase();
    const itemDuration = asText(item.raw.duration, item.raw.runtime);
    const seriesSynopsis =
      description.overview ||
      item.overview ||
      'Stream in high definition on Streamovie.';
    const castValue =
      cleanFields.find(f => f.label === 'Cast')?.value ||
      asText(item.raw?.cast, item.raw?.stars, item.raw?.actors) ||
      cleanFields.map(f => f.value).join(', ');

    const paramountMetaRow = [
      primaryGenre,
      item.kind === 'series'
        ? seasons.length > 0
          ? `${seasons.length} ${seasons.length === 1 ? 'SEASON' : 'SEASONS'}`
          : 'SERIES'
        : itemDuration.toUpperCase() || 'FEATURE',
      item.year || '2026',
      item.rating ? `★ ${item.rating}` : 'TV-MA',
    ].filter(Boolean);

    const disneyTabs: {
      id: 'episodes' | 'suggested' | 'details';
      label: string;
    }[] = [
      {id: 'episodes', label: 'EPISODES'},
      {id: 'suggested', label: 'SUGGESTED'},
      {id: 'details', label: 'DETAILS'},
    ];

    const handlePrimaryWatch = () => {
      if (item.kind === 'movie') {
        openMovieStreams();
      } else if (currentSeason?.episodes?.[0]) {
        openEpisodeStreams(currentSeason.episodes[0], 0);
      }
    };

    return (
      <View style={[styles.detail, tvDetailStyles.paramountRoot]}>
        {/* Full-Bleed Paramount+ Hero Artwork Stage (MOBLAND Layout) */}
        <View style={tvDetailStyles.paramountHeroBackdropWrap}>
          {item.backdrop || item.image ? (
            <Image
              source={{uri: item.backdrop || item.image}}
              resizeMode="cover"
              style={styles.detailBackdrop}
            />
          ) : null}
          <View
            pointerEvents="none"
            style={tvDetailStyles.paramountBackdropTint}
          />
          <SmoothTopFade height={90} rgb="6, 7, 10" />
          <SmoothLeftVignette width={560} rgb="6, 7, 10" />
          <SmoothBottomFade height={310} rgb="6, 7, 10" />

          {/* Top Bar: Subtle D-Pad Back Control + Top-Right Brand Original Watermark */}
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
                  backFocused && tvDetailStyles.backPillFocused,
                ]}>
                <Text style={tvDetailStyles.backPillText}>←  Back</Text>
              </Pressable>
            ) : (
              <View />
            )}

            <View style={tvDetailStyles.paramountWatermark}>
              <Text style={tvDetailStyles.paramountWatermarkBrand}>
                Streamovie
              </Text>
              <Text style={tvDetailStyles.paramountWatermarkSub}>ORIGINAL</Text>
            </View>
          </View>

          {/* Paramount+ Signature Two-Column Lower-Third Split Layout */}
          <View style={tvDetailStyles.paramountLowerThirdRow}>
            {/* Left Column: Title + Green NOW STREAMING + Blue WATCH NOW + Watchlist '+' */}
            <View style={tvDetailStyles.paramountLeftCol}>
              <Text numberOfLines={2} style={tvDetailStyles.paramountTitle}>
                {item.title}
              </Text>

              <Text style={tvDetailStyles.paramountNowStreaming}>
                NOW STREAMING
              </Text>

              <View style={tvDetailStyles.paramountActionsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Watch ${item.title} now`}
                  onFocus={() => setPlayFocused(true)}
                  onBlur={() => setPlayFocused(false)}
                  onPress={handlePrimaryWatch}
                  style={[
                    tvDetailStyles.paramountWatchNowBtn,
                    playFocused && tvDetailStyles.paramountWatchNowBtnFocused,
                  ]}>
                  <Text style={tvDetailStyles.paramountPlayIcon}>▶</Text>
                  <Text style={tvDetailStyles.paramountWatchNowText}>
                    WATCH NOW
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'
                  }
                  onFocus={() => setSaveFocused(true)}
                  onBlur={() => setSaveFocused(false)}
                  onPress={onSave}
                  style={[
                    tvDetailStyles.paramountPlusBtn,
                    isSaved && tvDetailStyles.paramountPlusBtnSaved,
                    saveFocused && tvDetailStyles.paramountPlusBtnFocused,
                  ]}>
                  <Text style={tvDetailStyles.paramountPlusBtnText}>
                    {isSaved ? '✓' : '+'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Right Column: Uppercase Metadata Row + Description + Featuring Cast */}
            <View style={tvDetailStyles.paramountRightCol}>
              <View style={tvDetailStyles.paramountMetaRow}>
                {paramountMetaRow.map((metaItem, idx) => (
                  <Text
                    key={`${metaItem}-${idx}`}
                    style={tvDetailStyles.paramountMetaText}>
                    {metaItem}
                  </Text>
                ))}
              </View>

              <Text
                numberOfLines={3}
                style={tvDetailStyles.paramountDescription}>
                {seriesSynopsis}
              </Text>

              {castValue ? (
                <Text
                  numberOfLines={1}
                  style={tvDetailStyles.paramountFeaturing}>
                  Featuring: {castValue}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Below Hero Band: Horizontal 16:9 Episodes Rail or Movie Streams */}
        <View style={tvDetailStyles.paramountBelowFold}>
          {item.kind === 'movie' ? (
            <View style={tvDetailStyles.paramountMovieStreamsWrap}>
              <Text style={tvDetailStyles.paramountSectionHeading}>
                AVAILABLE STREAMS ({mediaSources.length})
              </Text>
              <SourceGrid
                sources={mediaSources}
                columns={sourceColumns}
                title={item.title}
                onWatch={onWatch}
              />
            </View>
          ) : (
            <View style={tvDetailStyles.disneyEpisodesSection}>
              {/* Tab Bar: EPISODES | SUGGESTED | DETAILS */}
              <View style={tvDetailStyles.disneyTabsBar}>
                {disneyTabs.map(tabObj => {
                  const active = tvDetailTab === tabObj.id;
                  const focused = focusedDetailTab === tabObj.id;
                  return (
                    <Pressable
                      key={tabObj.id}
                      accessibilityRole="tab"
                      accessibilityState={{selected: active}}
                      onFocus={() => setFocusedDetailTab(tabObj.id)}
                      onBlur={() =>
                        setFocusedDetailTab(prev =>
                          prev === tabObj.id ? null : prev,
                        )
                      }
                      onPress={() => setTvDetailTab(tabObj.id)}
                      style={tvDetailStyles.disneyTabButton}>
                      <Text
                        style={[
                          tvDetailStyles.disneyTabText,
                          (active || focused) &&
                            tvDetailStyles.disneyTabTextActive,
                        ]}>
                        {tabObj.label}
                      </Text>
                      {active || focused ? (
                        <View
                          style={[
                            tvDetailStyles.disneyTabUnderline,
                            focused &&
                              !active && {backgroundColor: '#0064FF'},
                          ]}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              {tvDetailTab === 'episodes' ? (
                !seasons.length ? (
                  <Text style={styles.body}>
                    Loading episodes, or no episodes are available yet.
                  </Text>
                ) : (
                  <>
                    {/* Season Selector Row: Season 1   Season 2   Season 3 ... */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={tvDetailStyles.disneySeasonsRow}>
                      {seasons.map((season, index) => {
                        const active = seasonIndex === index;
                        const focused = focusedSeasonIdx === index;
                        return (
                          <Pressable
                            key={`${season.title}-${index}`}
                            accessibilityRole="tab"
                            accessibilityState={{selected: active}}
                            onFocus={() => setFocusedSeasonIdx(index)}
                            onBlur={() =>
                              setFocusedSeasonIdx(prev =>
                                prev === index ? null : prev,
                              )
                            }
                            onPress={() => onSeason(index)}
                            style={tvDetailStyles.disneySeasonItem}>
                            <Text
                              style={[
                                tvDetailStyles.disneySeasonText,
                                (active || focused) &&
                                  tvDetailStyles.disneySeasonTextActive,
                              ]}>
                              {formatDisneySeasonLabel(season.title, index)}
                            </Text>
                            {focused ? (
                              <View
                                style={[
                                  tvDetailStyles.disneySeasonFocusLine,
                                  {backgroundColor: '#0064FF'},
                                ]}
                              />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    {/* Horizontal 16:9 Episode Cards Rail */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={
                        tvDetailStyles.disneyEpisodesHorizontalRow
                      }>
                      {seasons[seasonIndex]?.episodes.map((episode, index) => (
                        <TVEpisodeCard
                          key={`${episode.title}-${index}`}
                          episode={episode}
                          episodeIndex={index}
                          fallbackImage={item.backdrop || item.image}
                          fallbackDuration={itemDuration}
                          fallbackOverview={seriesSynopsis}
                          onSelectEpisode={() =>
                            openEpisodeStreams(episode, index)
                          }
                        />
                      ))}
                    </ScrollView>
                  </>
                )
              ) : tvDetailTab === 'suggested' ? (
                <View style={tvDetailStyles.disneyDetailsPane}>
                  <Text style={tvDetailStyles.disneyDetailsHeading}>
                    More Like {item.title}
                  </Text>
                  <Text style={tvDetailStyles.disneyDetailsBody}>
                    {seriesSynopsis}
                  </Text>
                  <View style={tvDetailStyles.chipsRow}>
                    {genresList.map(genre => (
                      <View key={genre} style={styles.tvHeroMetaPill}>
                        <Text style={styles.tvHeroMetaPillText}>{genre}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={tvDetailStyles.disneyDetailsPane}>
                  <Text style={tvDetailStyles.disneyDetailsHeading}>
                    {item.title}
                  </Text>
                  <Text style={tvDetailStyles.disneyDetailsBody}>
                    {seriesSynopsis}
                  </Text>
                  {cleanFields.length > 0 ? (
                    <View style={tvDetailStyles.creditsStrip}>
                      {cleanFields.map((field, idx) => (
                        <View
                          key={`${field.label}-${idx}`}
                          style={tvDetailStyles.creditBox}>
                          <Text style={tvDetailStyles.creditLabel}>
                            {field.label}
                          </Text>
                          <Text style={tvDetailStyles.creditValue}>
                            {field.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Streamovie TV Stream Selector Modal */}
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
  paramountRoot: {
    backgroundColor: '#06070a',
    minHeight: 740,
    paddingBottom: 48,
  },
  paramountHeroBackdropWrap: {
    position: 'relative',
    height: 510,
    paddingHorizontal: 56,
    paddingTop: 28,
    paddingBottom: 26,
    justifyContent: 'space-between',
    overflow: 'hidden',
    backgroundColor: '#06070a',
  },
  paramountBackdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 7, 10, 0.24)',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 12, 18, 0.65)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  backPillFocused: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(0, 100, 255, 0.35)',
    transform: [{scale: 1.05}],
  },
  backPillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  paramountWatermark: {
    alignItems: 'center',
    opacity: 0.92,
  },
  paramountWatermarkBrand: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },
  paramountWatermarkSub: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 2.6,
    marginTop: -2,
  },
  paramountLowerThirdRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 48,
    zIndex: 10,
  },
  paramountLeftCol: {
    width: 350,
    flexShrink: 0,
  },
  paramountTitle: {
    color: '#ffffff',
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: {width: 0, height: 3},
    textShadowRadius: 12,
  },
  paramountNowStreaming: {
    color: '#00d66c',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  paramountActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paramountWatchNowBtn: {
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 6,
    backgroundColor: '#0064FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2.5,
    borderColor: 'transparent',
    shadowColor: '#0064FF',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  paramountWatchNowBtnFocused: {
    backgroundColor: '#1a75ff',
    borderColor: '#ffffff',
    transform: [{scale: 1.05}],
  },
  paramountPlayIcon: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  paramountWatchNowText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  paramountPlusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paramountPlusBtnSaved: {
    backgroundColor: 'rgba(0, 100, 255, 0.22)',
    borderColor: 'rgba(0, 100, 255, 0.65)',
  },
  paramountPlusBtnFocused: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    transform: [{scale: 1.1}],
  },
  paramountPlusBtnText: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
  },
  paramountRightCol: {
    flex: 1,
    paddingBottom: 2,
    maxWidth: 680,
  },
  paramountMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 18,
    marginBottom: 10,
  },
  paramountMetaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  paramountDescription: {
    color: '#f1f3f7',
    fontSize: 16.5,
    lineHeight: 23,
    fontWeight: '400',
  },
  paramountFeaturing: {
    color: '#9ea6b4',
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '400',
    marginTop: 8,
  },
  paramountBelowFold: {
    paddingHorizontal: 56,
    paddingTop: 10,
  },
  paramountMovieStreamsWrap: {
    marginTop: 8,
    gap: 14,
  },
  paramountSectionHeading: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  disneyEpisodesSection: {
    marginTop: 6,
  },
  disneyTabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.18)',
    paddingBottom: 12,
  },
  disneyTabButton: {
    position: 'relative',
    paddingVertical: 2,
  },
  disneyTabText: {
    color: 'rgba(249, 249, 249, 0.58)',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  disneyTabTextActive: {
    color: '#ffffff',
  },
  disneyTabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -14,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  disneySeasonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    paddingTop: 18,
    paddingBottom: 18,
  },
  disneySeasonItem: {
    position: 'relative',
    paddingVertical: 4,
  },
  disneySeasonText: {
    color: 'rgba(249, 249, 249, 0.58)',
    fontSize: 15,
    fontWeight: '500',
  },
  disneySeasonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  disneySeasonFocusLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -2,
    height: 2,
    borderRadius: 1,
  },
  disneyEpisodesHorizontalRow: {
    gap: 20,
    paddingRight: 56,
    paddingBottom: 12,
  },
  disneyEpisodeCard: {
    width: 276,
  },
  disneyEpisodeCardFocused: {
    transform: [{scale: 1.03}],
  },
  disneyEpisodeThumbFrame: {
    width: 276,
    height: 155,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#141720',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  disneyEpisodeThumbFrameFocused: {
    borderColor: '#ffffff',
  },
  disneyEpisodeThumb: {
    width: '100%',
    height: '100%',
  },
  disneyEpisodeTitle: {
    color: '#f9f9f9',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 10,
  },
  disneyEpisodeDesc: {
    color: 'rgba(249, 249, 249, 0.70)',
    fontSize: 13,
    lineHeight: 18.5,
    fontWeight: '400',
    marginTop: 5,
  },
  disneyDetailsPane: {
    paddingTop: 22,
    gap: 12,
    maxWidth: 780,
  },
  disneyDetailsHeading: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  disneyDetailsBody: {
    color: 'rgba(249, 249, 249, 0.80)',
    fontSize: 15,
    lineHeight: 23,
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
          <Text style={styles.footerMarkText}>S</Text>
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
