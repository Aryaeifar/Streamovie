import React, {useContext, useState, type ReactNode} from 'react';
import {FlatList, Platform, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import type {AppTab, Genre, Locale, Media} from '../types/media';
import {SettingsContext} from '../context/settings';
import {THEMES} from '../lib/theme';
import {Action} from './ui/Button';
import {Text} from './ui/Text';
import {
  MediaCard,
  MediaRail,
  Spotlight,
  TVHeroStage,
} from './legacy-ui';
import {styles} from './styles';
import {EmptyState, ErrorMessage} from './ui/States';

export function HomeScreen({
  header,
  isTV,
  locale,
  width,
  loading,
  error,
  items,
  savedItems = [],
  movies,
  series,
  topMovies,
  topSeries,
  showTop250Movies,
  showTop250Series,
  scrollRef,
  sectionY,
  onOpen,
  onToggleSave,
  isSaved,
  onNavigate,
}: {
  header: ReactNode;
  isTV: boolean;
  locale: Locale;
  width: number;
  loading: boolean;
  error: string;
  items: Media[];
  savedItems?: Media[];
  movies: Media[];
  series: Media[];
  topMovies: Media[];
  topSeries: Media[];
  showTop250Movies: boolean;
  showTop250Series: boolean;
  scrollRef: React.RefObject<ScrollView | null>;
  sectionY: React.MutableRefObject<Record<string, number>>;
  onOpen: (item: Media) => void;
  onToggleSave?: (item: Media) => void;
  isSaved?: (item: Media) => boolean;
  onNavigate: (tab: AppTab) => void;
}) {
  const {tvHomeLayout, setTvHomeLayout, theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const featured = items.slice(0, 8);
  const continueItems =
    savedItems.length > 0 ? savedItems.slice(0, 12) : items.slice(1, 9);

  const [focusedHeroItem, setFocusedHeroItem] = useState<Media | null>(null);
  const [tvGridFilter, setTvGridFilter] = useState<
    'all' | 'movies' | 'series' | 'topMovies' | 'topSeries'
  >('all');
  const [focusedGridTab, setFocusedGridTab] = useState<string | null>(null);

  const activeHeroItem = focusedHeroItem ?? items[0] ?? null;

  // Android TV: NuvioTV 10-Foot Experience (Modern / Classic / Grid Home Layouts)
  if (isTV) {
    if (tvHomeLayout === 'grid') {
      const gridData =
        tvGridFilter === 'movies'
          ? movies
          : tvGridFilter === 'series'
          ? series
          : tvGridFilter === 'topMovies'
          ? topMovies
          : tvGridFilter === 'topSeries'
          ? topSeries
          : items;

      const gridTabs: {
        id: 'all' | 'movies' | 'series' | 'topMovies' | 'topSeries';
        label: string;
      }[] = [
        {id: 'all', label: 'All Catalog'},
        {id: 'movies', label: 'Movies'},
        {id: 'series', label: 'Series'},
        ...(showTop250Movies
          ? [{id: 'topMovies' as const, label: 'Top 250 Movies'}]
          : []),
        ...(showTop250Series
          ? [{id: 'topSeries' as const, label: 'Top 250 Series'}]
          : []),
      ];

      return (
        <FlatList
          key="tv-grid-home-5"
          data={gridData}
          numColumns={5}
          initialNumToRender={10}
          maxToRenderPerBatch={15}
          windowSize={7}
          keyExtractor={(item, index) => `tv-grid-${item.kind}-${item.id}-${index}`}
          ListHeaderComponent={
            <View style={{marginHorizontal: -40, marginBottom: 18}}>
              {activeHeroItem ? (
                <TVHeroStage
                  item={activeHeroItem}
                  featuredItems={featured}
                  isSaved={isSaved ? isSaved(activeHeroItem) : false}
                  tvHomeLayout={tvHomeLayout}
                  onOpen={onOpen}
                  onToggleSave={onToggleSave}
                  onSelectLayout={setTvHomeLayout}
                />
              ) : null}
              {error ? <ErrorMessage message={error} /> : null}
              <View style={tvHomeExtraStyles.gridFilterRow}>
                {gridTabs.map(tabItem => {
                  const active = tvGridFilter === tabItem.id;
                  const focused = focusedGridTab === tabItem.id;
                  return (
                    <Pressable
                      key={tabItem.id}
                      accessibilityRole="button"
                      onFocus={() => setFocusedGridTab(tabItem.id)}
                      onBlur={() => setFocusedGridTab(null)}
                      onPress={() => setTvGridFilter(tabItem.id)}
                      style={[
                        styles.action,
                        active && styles.actionActive,
                        focused && [styles.focused, {borderColor: accent}],
                      ]}>
                      <Text
                        style={[
                          styles.actionText,
                          active && styles.actionTextActive,
                        ]}>
                        {tabItem.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          contentContainerStyle={[styles.listContent, styles.listContentTV]}
          columnWrapperStyle={styles.gridRowTV}
          renderItem={({item, index}) => (
            <MediaCard
              item={item}
              isTV
              rank={
                tvGridFilter === 'topMovies' || tvGridFilter === 'topSeries'
                  ? index + 1
                  : undefined
              }
              onFocusItem={setFocusedHeroItem}
              onPress={() => onOpen(item)}
            />
          )}
          ListEmptyComponent={
            loading ? null : (
              <EmptyState
                locale={locale}
                message={error || 'No titles to show.'}
              />
            )
          }
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return (
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={[styles.homeContent, styles.homeContentTV]}>
        {header}

        {/* NuvioTV Hero Stage: Modern (Focus-Synced Full-Bleed Backdrop) or Classic (Carousel) */}
        {tvHomeLayout === 'classic' ? (
          <View>
            <View style={tvHomeExtraStyles.classicTopBar}>
              <View style={styles.tvHeroLiveBadge}>
                <View
                  style={[styles.tvHeroLiveDot, {backgroundColor: accent}]}
                />
                <Text style={styles.tvHeroLiveText}>
                  NUVIO TV  •  CLASSIC VIEW
                </Text>
              </View>
              <View style={styles.tvLayoutSwitcher}>
                {(['modern', 'classic', 'grid'] as const).map(mode => {
                  const active = tvHomeLayout === mode;
                  return (
                    <Pressable
                      key={mode}
                      accessibilityRole="button"
                      onPress={() => setTvHomeLayout(mode)}
                      style={[
                        styles.tvLayoutPill,
                        active && styles.tvLayoutPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.tvLayoutPillText,
                          active && styles.tvLayoutPillTextActive,
                        ]}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {items[0] ? (
              <Spotlight
                item={items[0]}
                featuredItems={featured}
                onPress={() => onOpen(items[0])}
                onOpenItem={onOpen}
                onToggleSave={onToggleSave}
                isSaved={isSaved}
                isTV
              />
            ) : null}
          </View>
        ) : activeHeroItem ? (
          <TVHeroStage
            item={activeHeroItem}
            featuredItems={featured}
            isSaved={isSaved ? isSaved(activeHeroItem) : false}
            tvHomeLayout={tvHomeLayout}
            onOpen={onOpen}
            onToggleSave={onToggleSave}
            onSelectLayout={setTvHomeLayout}
          />
        ) : null}

        {error ? <ErrorMessage message={error} /> : null}

        {/* NuvioTV Continue Watching Row (Landscape 16:9 Backdrops with Time Badge & Progress Bar) */}
        {continueItems.length > 0 ? (
          <MediaRail
            title="Continue Watching"
            subtitle={
              savedItems.length > 0
                ? 'from Your Personal Library'
                : 'Resume where you left off'
            }
            items={continueItems}
            width={width}
            isTV
            continueWatching
            onFocusItem={setFocusedHeroItem}
            onSelect={onOpen}
          />
        ) : null}

        <View
          onLayout={event => {
            sectionY.current.featured = event.nativeEvent.layout.y;
          }}>
          <MediaRail
            title="Featured"
            subtitle="from Streamovie Catalog"
            items={items.slice(0, 18)}
            width={width}
            isTV
            highlightFirstOnTV={!focusedHeroItem}
            onFocusItem={setFocusedHeroItem}
            onSelect={onOpen}
            onSeeAll={() => onNavigate('Trending')}
          />
        </View>

        <View
          onLayout={event => {
            sectionY.current.series = event.nativeEvent.layout.y;
          }}>
          <MediaRail
            title="Popular - Series"
            subtitle="from Streamovie Catalog"
            items={series.slice(0, 20)}
            width={width}
            isTV
            onFocusItem={setFocusedHeroItem}
            onSelect={onOpen}
            onSeeAll={() => onNavigate('Series')}
          />
        </View>

        <View
          onLayout={event => {
            sectionY.current.movies = event.nativeEvent.layout.y;
          }}>
          <MediaRail
            title="Popular - Movies"
            subtitle="from Streamovie Catalog"
            items={movies.slice(0, 20)}
            width={width}
            isTV
            onFocusItem={setFocusedHeroItem}
            onSelect={onOpen}
            onSeeAll={() => onNavigate('Movies')}
          />
        </View>

        {showTop250Movies ? (
          <View
            onLayout={event => {
              sectionY.current.topMovies = event.nativeEvent.layout.y;
            }}>
            <MediaRail
              title="Top 250 - Movies"
              subtitle="from IMDb Chart"
              items={topMovies}
              width={width}
              isTV
              ranked
              onFocusItem={setFocusedHeroItem}
              onSelect={onOpen}
              onSeeAll={() => onNavigate('Top Movies')}
            />
          </View>
        ) : null}

        {showTop250Series ? (
          <View
            onLayout={event => {
              sectionY.current.topSeries = event.nativeEvent.layout.y;
            }}>
            <MediaRail
              title="Top 250 - Series"
              subtitle="from IMDb Chart"
              items={topSeries}
              width={width}
              isTV
              ranked
              onFocusItem={setFocusedHeroItem}
              onSelect={onOpen}
              onSeeAll={() => onNavigate('Top Series')}
            />
          </View>
        ) : null}

        {!loading && !items.length ? (
          <EmptyState
            locale={locale}
            message={error || 'No titles to show.'}
          />
        ) : null}
      </ScrollView>
    );
  }

  // Mobile & Tablet NuvioMobile Home Layout (Unchanged)
  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.homeContent}>
      {header}

      <View
        onLayout={event => {
          sectionY.current.featured = event.nativeEvent.layout.y;
        }}>
        {items[0] ? (
          <Spotlight
            item={items[0]}
            featuredItems={featured}
            onPress={() => onOpen(items[0])}
            onOpenItem={onOpen}
            onToggleSave={onToggleSave}
            isSaved={isSaved}
            isTV={false}
          />
        ) : null}
      </View>

      {error ? <ErrorMessage message={error} /> : null}

      {continueItems.length > 0 ? (
        <MediaRail
          title="Continue Watching"
          items={continueItems}
          width={width}
          continueWatching
          onSelect={onOpen}
        />
      ) : null}

      <View
        onLayout={event => {
          sectionY.current.series = event.nativeEvent.layout.y;
        }}>
        <MediaRail
          title="Popular - Series"
          items={series.slice(0, 20)}
          width={width}
          onSelect={onOpen}
          onSeeAll={() => onNavigate('Series')}
        />
      </View>

      <View
        onLayout={event => {
          sectionY.current.movies = event.nativeEvent.layout.y;
        }}>
        <MediaRail
          title="Popular - Movies"
          items={movies.slice(0, 20)}
          width={width}
          onSelect={onOpen}
          onSeeAll={() => onNavigate('Movies')}
        />
      </View>

      {showTop250Movies ? (
        <View
          onLayout={event => {
            sectionY.current.topMovies = event.nativeEvent.layout.y;
          }}>
          <MediaRail
            title="Top 250 - Movies"
            items={topMovies}
            width={width}
            ranked
            onSelect={onOpen}
            onSeeAll={() => onNavigate('Top Movies')}
          />
        </View>
      ) : null}

      {showTop250Series ? (
        <View
          onLayout={event => {
            sectionY.current.topSeries = event.nativeEvent.layout.y;
          }}>
          <MediaRail
            title="Top 250 - Series"
            items={topSeries}
            width={width}
            ranked
            onSelect={onOpen}
            onSeeAll={() => onNavigate('Top Series')}
          />
        </View>
      ) : null}

      {!loading && !items.length ? (
        <EmptyState locale={locale} message={error || 'No titles to show.'} />
      ) : null}
    </ScrollView>
  );
}

const tvHomeExtraStyles = StyleSheet.create({
  classicTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 4,
  },
  gridFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 40,
    paddingTop: 6,
  },
});

export function CatalogScreen({
  header,
  data,
  columns,
  isTV,
  locale,
  loading,
  error,
  intro,
  onSelect,
  onRefresh,
  footer,
  renderFilters,
  emptyMessage,
}: {
  header: ReactNode;
  data: Media[];
  columns: number;
  isTV: boolean;
  locale: Locale;
  loading: boolean;
  error: string;
  intro: ReactNode;
  onSelect: (item: Media) => void;
  onRefresh: () => void;
  footer?: React.ReactElement | null;
  renderFilters?: ReactNode;
  emptyMessage: string;
}) {
  return (
    <FlatList
      key={`${columns}-${data.length}`}
      data={data}
      numColumns={columns}
      initialNumToRender={isTV ? 12 : 9}
      maxToRenderPerBatch={isTV ? 18 : 12}
      updateCellsBatchingPeriod={40}
      windowSize={isTV ? 7 : 9}
      removeClippedSubviews={Platform.OS === 'android' && !isTV}
      keyExtractor={(item, index) => `${item.kind}-${item.id}-${index}`}
      ListHeaderComponent={
        <>
          {header}
          {renderFilters}
          {intro}
        </>
      }
      contentContainerStyle={[
        styles.listContent,
        isTV && styles.listContentTV,
      ]}
      columnWrapperStyle={isTV ? styles.gridRowTV : styles.gridRow}
      renderItem={({item}) => (
        <MediaCard item={item} isTV={isTV} onPress={() => onSelect(item)} />
      )}
      ListEmptyComponent={
        loading ? null : (
          <EmptyState locale={locale} message={error || emptyMessage} />
        )
      }
      ListFooterComponent={footer ?? null}
      refreshing={loading}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
    />
  );
}

export function FilterPanel({
  children,
}: {
  locale: Locale;
  accent: string;
  children: ReactNode;
}) {
  return <View style={styles.filterPanel}>{children}</View>;
}

const CATALOG_TABS: {tab: AppTab; label: string}[] = [
  {tab: 'Search', label: 'All'},
  {tab: 'Movies', label: 'Movies'},
  {tab: 'Series', label: 'Series'},
  {tab: 'Trending', label: 'Popular'},
  {tab: 'Top Movies', label: 'Top 250 Movies'},
  {tab: 'Top Series', label: 'Top 250 Series'},
];

export function FilterChoices({
  latest,
  topRated,
  sortByRating,
  onLatest,
  onTopRated,
  genres,
  genreId,
  onGenre,
  activeTab,
  onSelectTab,
  showExtendedFilters = true,
}: {
  locale: Locale;
  latest: string;
  topRated: string;
  sortByRating: boolean;
  onLatest: () => void;
  onTopRated: () => void;
  genres: Genre[];
  genreId: number;
  onGenre: (id: number) => void;
  activeTab?: AppTab;
  onSelectTab?: (tab: AppTab) => void;
  showExtendedFilters?: boolean;
}) {
  return (
    <View style={{gap: 8}}>
      {onSelectTab ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreFilters}>
          {CATALOG_TABS.map(item => (
            <Action
              key={item.tab}
              label={item.label}
              active={activeTab === item.tab}
              onPress={() => onSelectTab(item.tab)}
            />
          ))}
        </ScrollView>
      ) : null}

      {showExtendedFilters ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreFilters}>
          <Action
            label={latest}
            active={!sortByRating}
            onPress={onLatest}
          />
          <Action
            label={topRated}
            active={sortByRating}
            onPress={onTopRated}
          />
          <Action
            label="All Genres"
            active={!genreId}
            onPress={() => onGenre(0)}
          />
          {genres.map(genre => (
            <Action
              key={genre.id}
              label={genre.title}
              active={genreId === genre.id}
              onPress={() => onGenre(genre.id)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
