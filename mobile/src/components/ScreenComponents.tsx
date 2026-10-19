import React, {type ReactNode} from 'react';
import {FlatList, Platform, ScrollView, View} from 'react-native';
import type {AppTab, Genre, Media} from '../types/media';
import {Text} from './ui/Text';
import {Action} from './ui/Button';
import {MediaCard, MediaRail, Spotlight, SiteFooter} from './legacy-ui';
import {styles} from './styles';
import {tr} from '../lib/i18n';
import {COLORS} from '../lib/theme';
import {ErrorMessage, EmptyState, LoadingState} from './ui/States';
import {LoadingMore} from './ui/States';
import {HomeSectionTabs} from './ui/HomeSectionTabs';
import type {Locale} from '../types/media';

export function HomeScreen({header, isTV, locale, width, loading, error, items, movies, series, topMovies, topSeries, showTop250Movies, showTop250Series, scrollRef, sectionY, onOpen, onNavigate}: {
  header: ReactNode; isTV: boolean; locale: Locale; width: number; loading: boolean; error: string; items: Media[]; movies: Media[]; series: Media[]; topMovies: Media[]; topSeries: Media[]; showTop250Movies: boolean; showTop250Series: boolean; scrollRef: React.RefObject<ScrollView | null>; sectionY: React.MutableRefObject<Record<string, number>>; onOpen: (item: Media) => void; onNavigate: (tab: AppTab) => void;
}) {
  const persian = locale === 'fa';
  return <ScrollView ref={scrollRef} contentContainerStyle={[styles.homeContent, {direction: persian ? 'rtl' : 'ltr'}]}>
    {isTV ? <HomeSectionTabs locale={locale} showTop250Movies={showTop250Movies} showTop250Series={showTop250Series} sectionY={sectionY} scrollRef={scrollRef}/> : header}
    <View onLayout={event => { sectionY.current.featured = event.nativeEvent.layout.y; }}>{items[0] ? <Spotlight item={items[0]} onPress={() => onOpen(items[0])} isTV={isTV} /> : null}</View>
    {error ? <ErrorMessage message={error}/> : null}
    <View onLayout={event => { sectionY.current.movies = event.nativeEvent.layout.y; }}><MediaRail title="Movies" subtitle="Popular picks for your next movie night" items={movies.slice(0, 20)} width={width} isTV={isTV} landscape={isTV} onSelect={onOpen} /></View>
    <View onLayout={event => { sectionY.current.series = event.nativeEvent.layout.y; }}><MediaRail title="Series" subtitle="Find your next series" items={series.slice(0, 20)} width={width} isTV={isTV} onSelect={onOpen} /></View>
    {showTop250Movies ? <View onLayout={event => { sectionY.current.topMovies = event.nativeEvent.layout.y; }}><MediaRail title="IMDb Top 250 movies" items={topMovies} width={width} isTV={isTV} onSelect={onOpen} /></View> : null}
    {showTop250Series ? <View onLayout={event => { sectionY.current.topSeries = event.nativeEvent.layout.y; }}><MediaRail title="IMDb Top 250 series" items={topSeries} width={width} isTV={isTV} onSelect={onOpen} /></View> : null}
    <SiteFooter onNavigate={onNavigate} />
    {!loading && !items.length ? <EmptyState locale={locale} message={error || tr(locale, 'No titles to show.', 'عنوانی برای نمایش نیست.')}/> : null}
  </ScrollView>;
}

export function CatalogScreen({header, data, columns, isTV, locale, loading, error, intro, onSelect, onRefresh, footer, renderFilters, emptyMessage}: {
  header: ReactNode; data: Media[]; columns: number; isTV: boolean; locale: Locale; loading: boolean; error: string; intro: ReactNode; onSelect: (item: Media) => void; onRefresh: () => void; footer: React.ReactElement; renderFilters?: ReactNode; emptyMessage: string;
}) {
  return <FlatList key={`${columns}-${data.length}`} data={data} numColumns={columns} initialNumToRender={isTV ? 12 : 8} maxToRenderPerBatch={isTV ? 18 : 10} updateCellsBatchingPeriod={40} windowSize={isTV ? 7 : 9} removeClippedSubviews={Platform.OS === 'android' && !isTV} keyExtractor={(item, index) => `${item.kind}-${item.id}-${index}`} ListHeaderComponent={<>{header}{intro}{renderFilters}</>} contentContainerStyle={[styles.listContent, {direction: locale === 'fa' ? 'rtl' : 'ltr'}]} columnWrapperStyle={[styles.gridRow, locale === 'fa' && styles.rtlRow]} renderItem={({item}) => <MediaCard item={item} isTV={isTV} onPress={() => onSelect(item)} />} ListEmptyComponent={loading ? null : <EmptyState locale={locale} message={error || emptyMessage}/>} ListFooterComponent={<>{footer}</>} refreshing={loading} onRefresh={onRefresh} />;
}

export function FilterPanel({locale, accent, children}: {locale: Locale; accent: string; children: ReactNode}) { return <View style={[styles.filterPanel, {borderColor: `${accent}33`}, locale === 'fa' && styles.filterPanelRTL]}>{children}</View>; }
export function FilterChoices({locale, latest, topRated, sortByRating, onLatest, onTopRated, genres, genreId, onGenre}: {locale: Locale; latest: string; topRated: string; sortByRating: boolean; onLatest: () => void; onTopRated: () => void; genres: Genre[]; genreId: number; onGenre: (id: number) => void}) {
  return <><View style={[styles.filterChips, locale === 'fa' && styles.rtlRow]}><Action label={latest} active={!sortByRating} onPress={onLatest} /><Action label={topRated} active={sortByRating} onPress={onTopRated} /></View>{genres.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.genreFilters, locale === 'fa' && styles.rtlRow]}><Action label={tr(locale, 'All genres', 'همه ژانرها')} active={!genreId} onPress={() => onGenre(0)} />{genres.map(genre => <Action key={genre.id} label={genre.title} active={genreId === genre.id} onPress={() => onGenre(genre.id)} />)}</ScrollView> : null}</>;
}
