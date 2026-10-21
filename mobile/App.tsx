import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
let STREAMOVIE_API_KEY = '';
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  STREAMOVIE_API_KEY = require('./src/env.generated').STREAMOVIE_API_KEY ?? '';
} catch {
  STREAMOVIE_API_KEY = '';
}
import {isExcludedTitle, rankTop250} from './src/lib/media-mapping';
import {
  loadGenres,
  loadMedia,
  loadSeasons,
  searchHome,
} from './src/lib/catalog-api';

import type {
  AppTab,
  Genre,
  Locale,
  Media,
  MediaKind,
  ProfileId,
  Season,
  Source,
  ThemeId,
  TVHomeLayout,
} from './src/types/media';
import {SettingsContext, type AppSettings} from './src/context/settings';
import {styles} from './src/components/styles';
import {SiteFooter, TVNavigation} from './src/components/layout/Navigation';
import {
  CatalogScreen,
  FilterChoices,
  FilterPanel,
} from './src/components/screens/CatalogScreen';
import {AppHeader} from './src/components/AppHeader';
import {HomeScreen} from './src/components/screens/HomeScreen';
import {CatalogIntro} from './src/components/ui/CatalogIntro';
import {ApiKeyScreen} from './src/components/ApiKeyScreen';
import {VideoPlayerModal} from './src/components/player/VideoPlayerModal';
import {LoadingOverlay} from './src/components/ui/States';
import {ProfileScreen} from './src/components/settings/SettingsModal';
import {Detail} from './src/components/media/Detail';
import {BottomNavigation as MobileBottomNavigation} from './src/components/layout/MobileBottomNavigation';

import {THEMES} from './src/lib/theme';

function App() {
  const {
    theme,
    locale,
    showTop250Movies,
    showTop250Series,
    setTheme,
    setLocale,
    setShowTop250Movies,
    setShowTop250Series,
    openSettings,
    closeSettings,
    settingsOpen,
  } = useContext(SettingsContext);
  const palette = THEMES[theme];
  const {width} = useWindowDimensions();
  const isTV = Platform.isTV || width >= 1000;
  const isTablet = width >= 620;
  const columns = isTV ? 5 : isTablet ? 4 : 3;
  const homeScrollRef = useRef<ScrollView>(null);
  const homeSectionY = useRef<Record<string, number>>({});
  const [apiKey, setApiKey] = useState(STREAMOVIE_API_KEY);
  const [keyInput, setKeyInput] = useState('');
  const [tab, setTab] = useState<AppTab>('Home');
  const [items, setItems] = useState<Media[]>([]);
  const [topMovieItems, setTopMovieItems] = useState<Media[]>([]);
  const [topSeriesItems, setTopSeriesItems] = useState<Media[]>([]);
  const [saved, setSaved] = useState<Media[]>([]);
  const [selected, setSelected] = useState<Media | null>(null);
  const [playing, setPlaying] = useState<{source: Source; title: string} | null>(
    null,
  );
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [sortByRating, setSortByRating] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreId, setGenreId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('catalog-api-key'),
      AsyncStorage.getItem('saved-media'),
    ]).then(([key, savedJson]) => {
      const configuredKey = STREAMOVIE_API_KEY || key || '';
      if (configuredKey) {
        setApiKey(configuredKey);
        setKeyInput(configuredKey);
      }
      if (savedJson) {
        try {
          setSaved(JSON.parse(savedJson) as Media[]);
        } catch {
          setSaved([]);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (apiKey) {
      loadGenres(apiKey)
        .then(setGenres)
        .catch(() => setGenres([]));
    }
  }, [apiKey]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (playing) {
          setPlaying(null);
          return true;
        }
        if (settingsOpen) {
          closeSettings();
          return true;
        }
        if (selected) {
          setSelected(null);
          return true;
        }
        if (tab !== 'Home') {
          setTab('Home');
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [playing, settingsOpen, selected, tab, closeSettings]);

  // Enforce LTR English layout
  useEffect(() => {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
  }, []);

  const activeKind: MediaKind =
    tab === 'Series' || tab === 'Top Series' ? 'series' : 'movie';

  const refresh = useCallback(
    async (searchText = '') => {
      if (!apiKey || tab === 'Saved') return;
      const currentRequest = ++requestId.current;
      setLoading(true);
      setError('');
      try {
        if (tab === 'Home' || tab === 'Search' || tab === 'Trending') {
          if (searchText.trim()) {
            const result = await searchHome(apiKey, searchText);
            if (currentRequest === requestId.current) setItems(result);
          } else {
            const [movies, series, topMovies, topSeries] = await Promise.all([
              loadMedia('movie', apiKey),
              loadMedia('series', apiKey),
              tab === 'Home' && showTop250Movies
                ? Promise.all(
                    Array.from({length: 6}, (_, page) =>
                      loadMedia('movie', apiKey, '', 'imdb', page),
                    ),
                  ).then(pages => pages.flat())
                : Promise.resolve([]),
              tab === 'Home' && showTop250Series
                ? Promise.all(
                    Array.from({length: 6}, (_, page) =>
                      loadMedia('series', apiKey, '', 'imdb', page),
                    ),
                  ).then(pages => pages.flat())
                : Promise.resolve([]),
            ]);
            const all = [...movies, ...series];
            if (currentRequest === requestId.current) {
              setItems(
                tab === 'Trending'
                  ? all.sort((a, b) => Number(b.rating) - Number(a.rating))
                  : all,
              );
              if (tab === 'Home') {
                setTopMovieItems(rankTop250(topMovies, 'movie'));
                setTopSeriesItems(rankTop250(topSeries, 'series'));
              }
            }
          }
        } else {
          const isTopTab = tab.startsWith('Top ');
          const loaded = isTopTab
            ? (
                await Promise.all(
                  Array.from({length: 6}, (_, page) =>
                    loadMedia(activeKind, apiKey, searchText, 'imdb', page),
                  ),
                )
              ).flat()
            : await loadMedia(activeKind, apiKey, searchText, 'created');
          if (currentRequest === requestId.current) {
            setItems(isTopTab ? rankTop250(loaded, activeKind) : loaded);
          }
        }
      } catch (e) {
        if (currentRequest === requestId.current) {
          setError(e instanceof Error ? e.message : 'Could not load titles');
        }
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    },
    [activeKind, apiKey, showTop250Movies, showTop250Series, tab],
  );

  useEffect(() => {
    if (apiKey && !selected) refresh('');
    return () => {
      requestId.current += 1;
    };
  }, [apiKey, tab, selected, refresh]);

  useEffect(() => {
    if (!searchDraft.trim() || selected || tab === 'Saved') return;
    const timeout = setTimeout(() => {
      void refresh(searchDraft);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchDraft, selected, tab, refresh]);

  const open = async (item: Media) => {
    setSelected(item);
    setSeasons([]);
    setSeasonIndex(0);
    if (item.kind === 'series' && apiKey) {
      try {
        setSeasons(await loadSeasons(item.id, apiKey));
      } catch {
        setSeasons([]);
      }
    }
  };

  const navigateTo = useCallback(
    (value: AppTab) => {
      setSelected(null);
      setTab(value);
      closeSettings();
    },
    [closeSettings],
  );

  const saveKey = async () => {
    const key = keyInput.trim();
    if (!key) return;
    await AsyncStorage.setItem('catalog-api-key', key);
    setApiKey(key);
  };

  const isItemSaved = useCallback(
    (item: Media) =>
      saved.some(value => value.id === item.id && value.kind === item.kind),
    [saved],
  );

  const toggleSaved = useCallback(
    async (item: Media) => {
      const next = saved.some(
        value => value.id === item.id && value.kind === item.kind,
      )
        ? saved.filter(
            value => !(value.id === item.id && value.kind === item.kind),
          )
        : [item, ...saved];
      setSaved(next);
      await AsyncStorage.setItem('saved-media', JSON.stringify(next));
    },
    [saved],
  );

  const movies = useMemo(
    () => items.filter(item => item.kind === 'movie'),
    [items],
  );
  const series = useMemo(
    () => items.filter(item => item.kind === 'series'),
    [items],
  );
  const topMovies = useMemo(() => topMovieItems, [topMovieItems]);
  const topSeries = useMemo(() => topSeriesItems, [topSeriesItems]);
  const visibleItems = useMemo(
    () =>
      (tab === 'Saved' ? saved : items).filter(
        item =>
          !isExcludedTitle(item.raw) &&
          (!genreId ||
            (Array.isArray(item.raw.genres) &&
              item.raw.genres.some(
                (genre: any) =>
                  Number(typeof genre === 'object' ? genre.id : genre) ===
                  genreId,
              )) ||
            Number(item.raw.genre_id) === genreId),
      ),
    [items, saved, tab, genreId],
  );

  const sectionTitle =
    tab === 'Saved'
      ? 'Library'
      : tab === 'Search'
      ? 'Discover'
      : tab === 'Trending'
      ? 'Popular'
      : tab === 'Top Movies'
      ? 'Top 250 - Movies'
      : tab === 'Top Series'
      ? 'Top 250 - Series'
      : `Popular - ${tab}`;

  const sectionSubtitle =
    tab === 'Saved'
      ? 'from Your Personal Library'
      : 'from Streamovie Catalog';

  const orderedItems = useMemo(
    () =>
      sortByRating
        ? [...visibleItems].sort((a, b) => Number(b.rating) - Number(a.rating))
        : visibleItems,
    [visibleItems, sortByRating],
  );

  const activeBg = isTV ? palette.tvBg ?? palette.bg : palette.bg;
  const fullBleedHome =
    !isTV && !selected && !settingsOpen && tab === 'Home' && !searchDraft.trim();

  if (!apiKey) {
    return (
      <ApiKeyScreen
        locale={locale}
        isPersian={false}
        palette={palette}
        keyInput={keyInput}
        onChangeKey={setKeyInput}
        onSubmit={saveKey}
      />
    );
  }

  const header = (
    <AppHeader
      selected={selected}
      tab={tab}
      searchDraft={searchDraft}
      isTV={isTV}
      palette={palette}
      locale="en"
      isPersian={false}
      onBack={() => setSelected(null)}
      onSettings={openSettings}
      onSearchChange={value => setSearchDraft(value)}
      onSearchSubmit={() => refresh(searchDraft)}
      filtersOpen={filtersOpen}
      onToggleFilters={() => setFiltersOpen(value => !value)}
      onClearSearch={() => {
        setSearchDraft('');
        void refresh('');
      }}
    />
  );

  return (
    <SafeAreaView
      edges={
        fullBleedHome || isTV
          ? ['right', 'bottom', 'left']
          : ['top', 'right', 'bottom', 'left']
      }
      style={[styles.safe, {backgroundColor: activeBg}]}>
      <StatusBar
        translucent={fullBleedHome || isTV}
        barStyle="light-content"
        backgroundColor={fullBleedHome || isTV ? 'transparent' : activeBg}
      />
      <View
        style={[
          styles.appFrame,
          isTV && styles.tvAppFrame,
          {flexDirection: isTV ? 'row' : 'column'},
        ]}>
        {/* NuvioTV Collapsible Navigation Drawer: Shown on root routes, hidden on full-screen Detail view */}
        {isTV && !selected ? (
          <TVNavigation
            selected={tab}
            settingsActive={settingsOpen}
            onSelect={value => {
              setSelected(null);
              setTab(value);
              setSearchDraft('');
              closeSettings();
            }}
            onSettings={openSettings}
            accent={palette.accent}
            locale="en"
            showTop250Movies={showTop250Movies}
            showTop250Series={showTop250Series}
          />
        ) : null}

        <View style={[styles.mainContent, {backgroundColor: activeBg}]}>
          {settingsOpen ? (
            <ProfileScreen
              visible
              locale={locale}
              theme={theme}
              isTV={isTV}
              showTop250Movies={showTop250Movies}
              showTop250Series={showTop250Series}
              savedCount={saved.length}
              onClose={closeSettings}
              onLocale={setLocale}
              onTheme={setTheme}
              onShowTop250Movies={setShowTop250Movies}
              onShowTop250Series={setShowTop250Series}
            />
          ) : selected ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.detailScroll,
                isTV && styles.detailScrollTV,
              ]}>
              {!isTV ? header : null}
              <Detail
                item={selected}
                isSaved={isItemSaved(selected)}
                onSave={() => toggleSaved(selected)}
                onBack={() => setSelected(null)}
                seasons={seasons}
                seasonIndex={seasonIndex}
                onSeason={setSeasonIndex}
                isTV={isTV}
                isWide={isTablet}
                onWatch={(source, title) => setPlaying({source, title})}
              />
              {!isTV ? <SiteFooter onNavigate={navigateTo} /> : null}
            </ScrollView>
          ) : tab === 'Home' && !searchDraft.trim() ? (
            <HomeScreen
              header={header}
              isTV={isTV}
              locale="en"
              width={width}
              loading={loading}
              error={error}
              items={items}
              savedItems={saved}
              movies={movies}
              series={series}
              topMovies={topMovies}
              topSeries={topSeries}
              showTop250Movies={showTop250Movies}
              showTop250Series={showTop250Series}
              scrollRef={homeScrollRef}
              sectionY={homeSectionY}
              onOpen={open}
              onToggleSave={toggleSaved}
              isSaved={isItemSaved}
              onNavigate={navigateTo}
            />
          ) : (
            <CatalogScreen
              header={header}
              data={orderedItems}
              columns={columns}
              isTV={isTV}
              locale="en"
              loading={loading}
              error={error}
              intro={
                <CatalogIntro
                  palette={palette}
                  locale="en"
                  sectionTitle={
                    searchDraft.trim()
                      ? `Results for "${searchDraft.trim()}"`
                      : sectionTitle
                  }
                  sectionSubtitle={sectionSubtitle}
                  count={orderedItems.length}
                />
              }
              renderFilters={
                tab !== 'Saved' ? (
                  <FilterPanel locale="en" accent={palette.accent}>
                    <FilterChoices
                      locale="en"
                      latest="Latest"
                      topRated="Top Rated"
                      sortByRating={sortByRating}
                      onLatest={() => setSortByRating(false)}
                      onTopRated={() => setSortByRating(true)}
                      genres={genres}
                      genreId={genreId}
                      onGenre={setGenreId}
                      activeTab={tab}
                      onSelectTab={navigateTo}
                      showExtendedFilters={filtersOpen}
                    />
                  </FilterPanel>
                ) : null
              }
              onSelect={open}
              emptyMessage={
                tab === 'Saved'
                  ? 'Save movies or series to your library to find them here.'
                  : 'No matching titles found.'
              }
              onRefresh={() => refresh(searchDraft)}
              footer={null}
            />
          )}
        </View>

        {!isTV ? (
          <MobileBottomNavigation
            selected={tab}
            locale="en"
            accent={palette.accent}
            onSelect={navigateTo}
          />
        ) : null}
      </View>

      <VideoPlayerModal
        item={playing}
        locale="en"
        isTV={isTV}
        onClose={() => setPlaying(null)}
      />
      <LoadingOverlay accent={palette.accent} visible={loading} />
    </SafeAreaView>
  );
}

export default function AppRoot() {
  const [theme, setTheme] = useState<ThemeId>('nuvio');
  const [locale, setLocale] = useState<Locale>('en');
  const [showTop250Movies, setShowTop250Movies] = useState(true);
  const [showTop250Series, setShowTop250Series] = useState(true);
  const [liquidGlass, setLiquidGlass] = useState(true);
  const [landscapeCards, setLandscapeCards] = useState(false);
  const [tvHomeLayout, setTvHomeLayout] = useState<TVHomeLayout>('modern');
  const [activeProfile, setActiveProfile] = useState<ProfileId>('main');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('nuvio-app-theme'),
      AsyncStorage.getItem('show-top250-movies'),
      AsyncStorage.getItem('show-top250-series'),
      AsyncStorage.getItem('nuvio-liquid-glass'),
      AsyncStorage.getItem('nuvio-landscape-cards'),
      AsyncStorage.getItem('nuvio-tv-home-layout'),
      AsyncStorage.getItem('nuvio-active-profile'),
    ])
      .then(
        ([
          savedTheme,
          savedTopMovies,
          savedTopSeries,
          savedGlass,
          savedLandscape,
          savedTvLayout,
          savedProfile,
        ]) => {
          if (savedTheme && savedTheme in THEMES) {
            setTheme(savedTheme as ThemeId);
          }
          setLocale('en');
          if (savedTopMovies === 'false') setShowTop250Movies(false);
          if (savedTopSeries === 'false') setShowTop250Series(false);
          if (savedGlass === 'false') setLiquidGlass(false);
          if (savedLandscape === 'true') setLandscapeCards(true);
          if (
            savedTvLayout === 'modern' ||
            savedTvLayout === 'classic' ||
            savedTvLayout === 'grid'
          ) {
            setTvHomeLayout(savedTvLayout);
          }
          if (
            savedProfile === 'main' ||
            savedProfile === 'cinema' ||
            savedProfile === 'night' ||
            savedProfile === 'kids'
          ) {
            setActiveProfile(savedProfile);
          }
          setPreferencesLoaded(true);
        },
      )
      .catch(() => setPreferencesLoaded(true));
  }, []);

  useEffect(() => {
    if (preferencesLoaded) {
      void AsyncStorage.setItem('nuvio-app-theme', theme);
    }
  }, [preferencesLoaded, theme]);
  useEffect(() => {
    if (preferencesLoaded) {
      void AsyncStorage.setItem('show-top250-movies', String(showTop250Movies));
    }
  }, [preferencesLoaded, showTop250Movies]);
  useEffect(() => {
    if (preferencesLoaded) {
      void AsyncStorage.setItem('show-top250-series', String(showTop250Series));
    }
  }, [preferencesLoaded, showTop250Series]);
  useEffect(() => {
    if (preferencesLoaded) {
      void AsyncStorage.setItem('nuvio-liquid-glass', String(liquidGlass));
    }
  }, [preferencesLoaded, liquidGlass]);
  useEffect(() => {
    if (preferencesLoaded) {
      void AsyncStorage.setItem('nuvio-landscape-cards', String(landscapeCards));
    }
  }, [preferencesLoaded, landscapeCards]);
  useEffect(() => {
    if (preferencesLoaded) {
      void AsyncStorage.setItem('nuvio-tv-home-layout', tvHomeLayout);
    }
  }, [preferencesLoaded, tvHomeLayout]);
  useEffect(() => {
    if (preferencesLoaded) {
      void AsyncStorage.setItem('nuvio-active-profile', activeProfile);
    }
  }, [preferencesLoaded, activeProfile]);

  const value = useMemo<AppSettings>(
    () => ({
      theme,
      locale: 'en',
      isPersian: false,
      showTop250Movies,
      showTop250Series,
      liquidGlass,
      landscapeCards,
      tvHomeLayout,
      activeProfile,
      setTheme,
      setLocale,
      setShowTop250Movies,
      setShowTop250Series,
      setLiquidGlass,
      setLandscapeCards,
      setTvHomeLayout,
      setActiveProfile,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      settingsOpen,
    }),
    [
      theme,
      showTop250Movies,
      showTop250Series,
      liquidGlass,
      landscapeCards,
      tvHomeLayout,
      activeProfile,
      settingsOpen,
    ],
  );

  return (
    <SafeAreaProvider>
      <SettingsContext.Provider value={value}>
        <App />
      </SettingsContext.Provider>
    </SafeAreaProvider>
  );
}
