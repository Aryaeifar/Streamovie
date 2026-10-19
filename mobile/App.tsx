import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
  BackHandler,
  I18nManager,
  Platform,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {STREAMOVIE_API_KEY} from './src/env.generated';
import {isExcludedTitle, rankTop250} from './src/lib/media-mapping';
import {loadMedia, loadGenres, loadSeasons, searchHome} from './src/lib/catalog-api';

import type {AppTab, Genre, Locale, Media, MediaKind, Season, Source, ThemeId} from './src/types/media';
import {SettingsContext, type AppSettings} from './src/context/settings';
import {styles} from './src/components/styles';
import {Text} from './src/components/ui/Text';
import {TVNavigation, SiteFooter} from './src/components/layout/Navigation';
import {CatalogScreen, FilterPanel, FilterChoices} from './src/components/screens/CatalogScreen';
import {AppHeader} from './src/components/AppHeader';
import {HomeScreen} from './src/components/screens/HomeScreen';
import {CatalogIntro} from './src/components/ui/CatalogIntro';
import {ApiKeyScreen} from './src/components/ApiKeyScreen';
import {VideoPlayerModal} from './src/components/player/VideoPlayerModal';
import {LoadingOverlay} from './src/components/ui/States';
import {SettingsModal} from './src/components/settings/SettingsModal';
import {asText} from './src/lib/media-format';
import {Detail} from './src/components/media/Detail';
import {BottomNavigation as MobileBottomNavigation} from './src/components/layout/MobileBottomNavigation';

import {COLORS, THEMES} from './src/lib/theme';
import {tr} from './src/lib/i18n';
function App() {
  const {theme, locale, isPersian, showTop250Movies, showTop250Series, setTheme, setLocale, setShowTop250Movies, setShowTop250Series, openSettings, closeSettings, settingsOpen} = useContext(SettingsContext);
  const palette = THEMES[theme];
  const {width} = useWindowDimensions();
  const isTV = Platform.isTV || width >= 1000;
  const isTablet = width >= 620;
  const columns = isTV ? 6 : isTablet ? 4 : 2;
  const homeScrollRef = useRef<ScrollView>(null);
  const homeSectionY = useRef<Record<string, number>>({});
  const [apiKey, setApiKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [tab, setTab] = useState<AppTab>('Home');
  const [items, setItems] = useState<Media[]>([]);
  const [topMovieItems, setTopMovieItems] = useState<Media[]>([]);
  const [topSeriesItems, setTopSeriesItems] = useState<Media[]>([]);
  const [saved, setSaved] = useState<Media[]>([]);
  const [selected, setSelected] = useState<Media | null>(null);
  const [playing, setPlaying] = useState<{source: Source; title: string} | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [sortByRating, setSortByRating] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreId, setGenreId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem('catalog-api-key'), AsyncStorage.getItem('saved-media')]).then(([key, savedJson]) => {
      const configuredKey = STREAMOVIE_API_KEY || key || '';
      if (configuredKey) { setApiKey(configuredKey); setKeyInput(configuredKey); }
      if (savedJson) {
        try { setSaved(JSON.parse(savedJson) as Media[]); } catch { setSaved([]); }
      }
    });
  }, []);

  useEffect(() => { if (apiKey) loadGenres(apiKey).then(setGenres).catch(() => setGenres([])); }, [apiKey]);

  // Keep the Android system back button inside the current app flow.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (playing) { setPlaying(null); return true; }
      if (settingsOpen) { closeSettings(); return true; }
      if (selected) { setSelected(null); return true; }
      if (tab !== 'Home') { setTab('Home'); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [playing, settingsOpen, selected, tab, closeSettings]);

  useEffect(() => {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(isPersian);
  }, [isPersian]);

  const activeKind: MediaKind = tab === 'Series' || tab === 'Top Series' ? 'series' : 'movie';
  const refresh = useCallback(async (searchText = '') => {
    if (!apiKey || tab === 'Saved') return;
    const currentRequest = ++requestId.current;
    setLoading(true); setError('');
    try {
      if (tab === 'Home' || tab === 'Trending') {
        if (searchText.trim()) {
          const result = await searchHome(apiKey, searchText);
          if (currentRequest === requestId.current) setItems(result);
        }
        else {
          const [movies, series, topMovies, topSeries] = await Promise.all([
            loadMedia('movie', apiKey), loadMedia('series', apiKey),
            tab === 'Home' && showTop250Movies ? loadMedia('movie', apiKey, '', 'imdb') : Promise.resolve([]),
            tab === 'Home' && showTop250Series ? loadMedia('series', apiKey, '', 'imdb') : Promise.resolve([]),
          ]);
          const all = [...movies, ...series];
          if (currentRequest === requestId.current) {
            setItems(tab === 'Trending' ? all.sort((a, b) => Number(b.rating) - Number(a.rating)) : all);
            setTopMovieItems(rankTop250(topMovies, 'movie'));
            setTopSeriesItems(rankTop250(topSeries, 'series'));
          }
        }
      } else {
        const isTopTab = tab.startsWith('Top ');
        const loaded = await loadMedia(activeKind, apiKey, searchText, isTopTab ? 'imdb' : 'created');
        if (currentRequest === requestId.current) setItems(isTopTab ? rankTop250(loaded, activeKind) : loaded);
      }
    } catch (e) {
      if (currentRequest === requestId.current) setError(e instanceof Error ? e.message : 'Could not load titles');
    } finally { if (currentRequest === requestId.current) setLoading(false); }
  }, [activeKind, apiKey, showTop250Movies, showTop250Series, tab]);

  useEffect(() => { if (apiKey && !selected) refresh(''); return () => { requestId.current += 1; }; }, [apiKey, tab, selected, refresh]);
  useEffect(() => {
    if (!searchDraft.trim() || selected || tab === 'Saved') return;
    const timeout = setTimeout(() => { void refresh(searchDraft); }, 350);
    return () => clearTimeout(timeout);
  }, [searchDraft, selected, tab, refresh]);

  const open = async (item: Media) => {
    setSelected(item); setSeasons([]); setSeasonIndex(0);
    if (item.kind === 'series' && apiKey) {
      try { setSeasons(await loadSeasons(item.id, apiKey)); } catch { setSeasons([]); }
    }
  };

  const navigateTo = useCallback((value: AppTab) => { setSelected(null); setTab(value); setSearchDraft(''); }, []);

  const saveKey = async () => {
    const key = keyInput.trim();
    if (!key) return;
    await AsyncStorage.setItem('catalog-api-key', key);
    setApiKey(key);
  };

  const toggleSaved = async (item: Media) => {
    const next = saved.some(value => value.id === item.id && value.kind === item.kind)
      ? saved.filter(value => !(value.id === item.id && value.kind === item.kind))
      : [item, ...saved];
    setSaved(next);
    await AsyncStorage.setItem('saved-media', JSON.stringify(next));
  };

  const movies = useMemo(() => items.filter(item => item.kind === 'movie'), [items]);
  const series = useMemo(() => items.filter(item => item.kind === 'series'), [items]);
  const topMovies = useMemo(() => topMovieItems.slice(0, 24), [topMovieItems]);
  const topSeries = useMemo(() => topSeriesItems.slice(0, 24), [topSeriesItems]);
  const visibleItems = useMemo(() => (tab === 'Saved' ? saved : items).filter(item => !isExcludedTitle(item.raw) && (!genreId || (Array.isArray(item.raw.genres) && item.raw.genres.some((genre: any) => Number(typeof genre === 'object' ? genre.id : genre) === genreId)) || Number(item.raw.genre_id) === genreId)), [items, saved, tab, genreId]);
  const sectionTitle = tr(locale, tab === 'Saved' ? 'My List' : tab === 'Trending' ? 'Trending now' : tab.startsWith('Top ') ? `Top rated ${activeKind === 'movie' ? 'movies' : 'series'}` : `Explore ${tab.toLowerCase()}`, tab === 'Saved' ? 'فهرست من' : tab === 'Trending' ? 'محبوب‌های این روزها' : tab.startsWith('Top ') ? `برترین ${activeKind === 'movie' ? 'فیلم‌ها' : 'سریال‌ها'}` : tab === 'Movies' ? 'کاوش فیلم‌ها' : tab === 'Series' ? 'کاوش سریال‌ها' : 'کاوش');
  const sectionSubtitle = tab === 'Saved' ? tr(locale, 'The movies and series you have saved for later.', 'فیلم‌ها و سریال‌هایی که برای بعد ذخیره کرده‌اید.')
    : tab === 'Trending' ? tr(locale, 'Popular titles across movies and series.', 'عنوان‌های محبوب فیلم و سریال.')
      : tab === 'Movies' || tab === 'Top Movies' ? tr(locale, 'Browse the latest movies and find your next watch.', 'فیلم‌های تازه را ببینید و انتخاب بعدی‌تان را پیدا کنید.')
        : tr(locale, 'Browse series and discover your next favorite.', 'سریال‌ها را ببینید و موردعلاقه بعدی‌تان را پیدا کنید.');
  const orderedItems = useMemo(() => sortByRating
    ? [...visibleItems].sort((a, b) => Number(b.rating) - Number(a.rating))
    : visibleItems, [visibleItems, sortByRating]);

  const header = <AppHeader selected={selected} tab={tab} searchDraft={searchDraft} isTV={isTV} palette={palette} locale={locale} isPersian={isPersian} onBack={() => setSelected(null)} onSettings={openSettings} onSearchChange={value => setSearchDraft(value)} onSearchSubmit={() => refresh(searchDraft)} filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen(value => !value)} onClearSearch={() => {setSearchDraft('');void refresh('');}} />

  if (!apiKey) return <ApiKeyScreen locale={locale} isPersian={isPersian} palette={palette} keyInput={keyInput} onChangeKey={setKeyInput} onSubmit={saveKey} />

  return <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.safe, {backgroundColor: palette.bg, direction: isPersian ? 'rtl' : 'ltr'}]}><StatusBar barStyle="light-content" backgroundColor={palette.bg} />
    <View style={[styles.appFrame, isTV && styles.tvAppFrame, {direction: isPersian ? 'rtl' : 'ltr', flexDirection: isTV ? 'row' : 'column'}]}>
      {isTV ? <TVNavigation selected={tab} onSelect={value => { setSelected(null); setTab(value); setSearchDraft(''); }} onSettings={openSettings} accent={palette.accent} locale={locale} showTop250Movies={showTop250Movies} showTop250Series={showTop250Series} /> : null}
      <View style={[styles.mainContent, {backgroundColor: palette.bg, direction: isPersian ? 'rtl' : 'ltr'}]}>
        {selected ? <ScrollView contentContainerStyle={[styles.detailScroll, {direction: isPersian ? 'rtl' : 'ltr'}]}>
          {header}
          <Detail item={selected} isSaved={saved.some(value => value.id === selected.id && value.kind === selected.kind)} onSave={() => toggleSaved(selected)} seasons={seasons} seasonIndex={seasonIndex} onSeason={setSeasonIndex} isTV={isTV} isWide={isTablet} onWatch={(source, title) => setPlaying({source, title})} />
          <SiteFooter onNavigate={navigateTo} />
        </ScrollView> : tab === 'Home' ? <HomeScreen header={header} isTV={isTV} locale={locale} width={width} loading={loading} error={error} items={items} movies={movies} series={series} topMovies={topMovies} topSeries={topSeries} showTop250Movies={showTop250Movies} showTop250Series={showTop250Series} scrollRef={homeScrollRef} sectionY={homeSectionY} onOpen={open} onNavigate={navigateTo} /> : <CatalogScreen
          header={header}
          data={orderedItems}
          columns={columns}
          isTV={isTV}
          locale={locale}
          loading={loading}
          error={error}
          intro={<CatalogIntro palette={palette} locale={locale} sectionTitle={sectionTitle} sectionSubtitle={sectionSubtitle} count={orderedItems.length} />}
          renderFilters={tab !== 'Saved' && filtersOpen ? <FilterPanel locale={locale} accent={palette.accent}><Text style={[styles.filterLabel, isPersian && styles.rtlText]}>{tr(locale, 'SORT BY', 'مرتب‌سازی')}</Text><FilterChoices locale={locale} latest={tr(locale, 'Latest', 'جدیدترین')} topRated={tr(locale, 'Top rated', 'بالاترین امتیاز')} sortByRating={sortByRating} onLatest={() => setSortByRating(false)} onTopRated={() => setSortByRating(true)} genres={genres} genreId={genreId} onGenre={setGenreId} /></FilterPanel> : null}
          onSelect={open}
          emptyMessage={tr(locale, tab === 'Saved' ? 'Save titles to find them here.' : 'No titles to show.', tab === 'Saved' ? 'عنوان‌ها را ذخیره کنید تا اینجا ببینید.' : 'عنوانی برای نمایش نیست.')}
          onRefresh={() => refresh('')}
          footer={<SiteFooter onNavigate={navigateTo} />}
        />}
      </View>
      {!isTV ? <MobileBottomNavigation selected={tab} locale={locale} accent={palette.accent} onSelect={navigateTo} /> : null}
    </View>
    <SettingsModal visible={settingsOpen} locale={locale} theme={theme} isTV={isTV} showTop250Movies={showTop250Movies} showTop250Series={showTop250Series} onClose={closeSettings} onLocale={setLocale} onTheme={setTheme} onShowTop250Movies={setShowTop250Movies} onShowTop250Series={setShowTop250Series} />
    <VideoPlayerModal item={playing} locale={locale} isTV={isTV} onClose={() => setPlaying(null)} />
    <LoadingOverlay accent={palette.accent} visible={loading} />
  </SafeAreaView>;
}

export default function AppRoot() {
  const [theme, setTheme] = useState<ThemeId>('netflix');
  const [locale, setLocale] = useState<Locale>('en');
  const [showTop250Movies, setShowTop250Movies] = useState(true);
  const [showTop250Series, setShowTop250Series] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  useEffect(() => {
    Promise.all([AsyncStorage.getItem('app-theme'), AsyncStorage.getItem('app-locale'), AsyncStorage.getItem('show-top250-movies'), AsyncStorage.getItem('show-top250-series')]).then(([savedTheme, savedLocale, savedTopMovies, savedTopSeries]) => {
      if (savedTheme && savedTheme in THEMES) setTheme(savedTheme as ThemeId);
      if (savedLocale === 'en' || savedLocale === 'fa') setLocale(savedLocale);
      if (savedTopMovies === 'false') setShowTop250Movies(false);
      if (savedTopSeries === 'false') setShowTop250Series(false);
      setPreferencesLoaded(true);
    }).catch(() => setPreferencesLoaded(true));
  }, []);
  useEffect(() => { if (preferencesLoaded) void AsyncStorage.setItem('app-theme', theme); }, [preferencesLoaded, theme]);
  useEffect(() => { if (preferencesLoaded) void AsyncStorage.setItem('app-locale', locale); }, [preferencesLoaded, locale]);
  useEffect(() => { if (preferencesLoaded) void AsyncStorage.setItem('show-top250-movies', String(showTop250Movies)); }, [preferencesLoaded, showTop250Movies]);
  useEffect(() => { if (preferencesLoaded) void AsyncStorage.setItem('show-top250-series', String(showTop250Series)); }, [preferencesLoaded, showTop250Series]);
  const value = useMemo<AppSettings>(() => ({theme, locale, isPersian: locale === 'fa', showTop250Movies, showTop250Series, setTheme, setLocale, setShowTop250Movies, setShowTop250Series, openSettings: () => setSettingsOpen(true), closeSettings: () => setSettingsOpen(false), settingsOpen}), [theme, locale, showTop250Movies, showTop250Series, settingsOpen]);
  return <SafeAreaProvider><SettingsContext.Provider value={value}><App /></SettingsContext.Provider></SafeAreaProvider>;
}
