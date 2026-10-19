import React, {type ReactNode} from 'react';
import {FlatList, Platform, ScrollView, View} from 'react-native';
import type {AppTab, Genre, Locale, Media} from '../types/media';
import {Action} from './ui/Button';
import {MediaCard, MediaRail, SiteFooter, Spotlight} from './legacy-ui';
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
  const featured = items.slice(0, 8);
  const continueItems =
    savedItems.length > 0 ? savedItems.slice(0, 12) : items.slice(1, 9);

  // On Android TV (NuvioTV layout from the screenshot), Featured & Catalog rows are displayed with large portrait cards and "from Streamovie Catalog" subtitle
  if (isTV) {
    return (
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.homeContent, styles.homeContentTV]}>
        {header}
        {error ? <ErrorMessage message={error} /> : null}

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
            highlightFirstOnTV
            onSelect={onOpen}
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
            onSelect={onOpen}
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
            onSelect={onOpen}
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
              onSelect={onOpen}
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
              onSelect={onOpen}
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

  // Mobile & Tablet NuvioMobile Home Layout (matching reference screenshot)
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
      columnWrapperStyle={styles.gridRow}
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
