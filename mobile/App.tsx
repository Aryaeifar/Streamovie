import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text as NativeText,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import Video, {type VideoRef} from 'react-native-video';
import {STREAMOVIE_API_KEY} from './src/env.generated';
import {imdbTop250Movies, imdbTop250Series} from './src/imdb-top250';

type MediaKind = 'movie' | 'series';
type AppTab = 'Home' | 'Movies' | 'Series' | 'Trending' | 'Saved' | 'Top Movies' | 'Top Series';
type Source = {quality: string; url: string};
type Genre = {id: number; title: string};
type Episode = {title: string; sources: Source[]};
type Season = {title: string; episodes: Episode[]};
type Media = {
  id: number;
  title: string;
  image: string;
  backdrop: string;
  year: string;
  rating: string;
  overview: string;
  kind: MediaKind;
  raw: Record<string, any>;
};

const COLORS = {
  bg: '#080808',
  panel: '#141414',
  panel2: '#202020',
  accent: '#e50914',
  accentSoft: '#471015',
  text: '#f6f3ff',
  muted: '#aaa6ba',
  line: 'rgba(255,255,255,0.10)',
};
type ThemeId = 'netflix' | 'midnight' | 'aurora' | 'ocean' | 'sunset' | 'candy' | 'noir';
const THEMES: Record<ThemeId, {label: string; bg: string; panel: string; accent: string; accentDark: string}> = {
  netflix: {label: 'Netflix', bg: '#080808', panel: '#141414', accent: '#e50914', accentDark: '#b20710'},
  midnight: {label: 'Midnight', bg: '#06060b', panel: '#15121c', accent: '#a78bfa', accentDark: '#d946ef'},
  aurora: {label: 'Aurora', bg: '#04090a', panel: '#101819', accent: '#34d399', accentDark: '#22d3ee'},
  ocean: {label: 'Ocean', bg: '#04070f', panel: '#101522', accent: '#38bdf8', accentDark: '#6366f1'},
  sunset: {label: 'Sunset', bg: '#0b0704', panel: '#19100b', accent: '#fb923c', accentDark: '#f43f5e'},
  candy: {label: 'Candy', bg: '#0b050c', panel: '#1a101c', accent: '#f472b6', accentDark: '#a855f7'},
  noir: {label: 'Noir', bg: '#0a0a0a', panel: '#181818', accent: '#a1a1aa', accentDark: '#71717a'},
};
type Locale = 'fa' | 'en';
type NavIconName = 'home' | 'movies' | 'series' | 'trending' | 'saved' | 'search' | 'top' | 'settings' | 'play';
const NAV_ICONS: Record<NavIconName, number> = {
  home: require('./assets/nav-icons/home.png'),
  movies: require('./assets/nav-icons/movies.png'),
  series: require('./assets/nav-icons/series.png'),
  trending: require('./assets/nav-icons/trending.png'),
  saved: require('./assets/nav-icons/saved.png'),
  search: require('./assets/nav-icons/search.png'),
  top: require('./assets/nav-icons/top.png'),
  settings: require('./assets/nav-icons/settings.png'),
  play: require('./assets/nav-icons/play.png'),
};
type AppSettings = {theme: ThemeId; locale: Locale; isPersian: boolean; showTop250Movies: boolean; showTop250Series: boolean; setTheme: (value: ThemeId) => void; setLocale: (value: Locale) => void; setShowTop250Movies: (value: boolean) => void; setShowTop250Series: (value: boolean) => void; openSettings: () => void; closeSettings: () => void; settingsOpen: boolean};
const AppSettingsContextDefault: AppSettings = {theme: 'netflix', locale: 'fa', isPersian: true, showTop250Movies: true, showTop250Series: true, setTheme: () => {}, setLocale: () => {}, setShowTop250Movies: () => {}, setShowTop250Series: () => {}, openSettings: () => {}, closeSettings: () => {}, settingsOpen: false};
const SettingsContext = createContext<AppSettings>(AppSettingsContextDefault);
const tr = (locale: Locale, en: string, fa: string) => locale === 'fa' ? fa : en;
const EXCLUDED_TITLES = new Set(['نسخه جدید ملودی باکس', 'نسخه جدید هورتون'].map(normalizeExcludedTitle));

function normalizeExcludedTitle(value: string) {
  return value.normalize('NFKC').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[^\p{L}\p{N}]/gu, '').toLocaleLowerCase('fa');
}

function isExcludedTitle(raw: Record<string, any>) {
  return [raw.title, raw.name].some((title) => typeof title === 'string' && EXCLUDED_TITLES.has(normalizeExcludedTitle(title)));
}

function normalizeChartTitle(title: string) {
  return title.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

const CHARTS = {movie: imdbTop250Movies, series: imdbTop250Series} as const;

function getTop250Rank(media: Media) {
  const chart = CHARTS[media.kind];
  const raw = media.raw;
  const titles = [media.title, raw.original_title, raw.original_name, raw.originalTitle, raw.en_title];
  const description = asText(raw.description, raw.summary);
  for (const line of description.split(/\r?\n/)) {
    if (!/(?:نام اصلی|نام انگلیسی)\s*[:：]/.test(line)) continue;
    const original = line.split(/[:：]/).slice(1).join(':').trim();
    if (original) titles.push(original);
  }
  const yearValue = Number(media.year || raw.year || raw.release_year);
  const year = Number.isInteger(yearValue) && yearValue >= 1880 && yearValue <= 2100 ? yearValue : undefined;
  for (const title of [...new Set(titles.filter((value): value is string => typeof value === 'string' && value.length > 0))]) {
    const normalized = normalizeChartTitle(title);
    const entry = chart.find((candidate) => {
      const candidateTitles = [candidate.title, candidate.originalTitle].map(normalizeChartTitle);
      if (!candidateTitles.includes(normalized)) return false;
      const titleYear = title.match(/\b(18\d{2}|19\d{2}|20\d{2}|2100)\s*$/)?.[1];
      const actualYear = year ?? (titleYear ? Number(titleYear) : undefined);
      return !actualYear || !candidate.year || actualYear === candidate.year;
    });
    if (entry) return chart.findIndex((candidate) => candidate.id === entry.id) + 1;
  }
  return Number.MAX_SAFE_INTEGER;
}

function rankTop250(items: Media[], kind: MediaKind) {
  return items.map((item) => ({item, rank: item.kind === kind ? getTop250Rank(item) : Number.MAX_SAFE_INTEGER}))
    .filter(({rank}) => rank !== Number.MAX_SAFE_INTEGER)
    .sort((first, second) => first.rank - second.rank)
    .map(({item}) => item);
}
function Text(props: React.ComponentProps<typeof NativeText>) {
  const {isPersian} = useContext(SettingsContext);
  const content = React.Children.toArray(props.children).filter((child): child is string => typeof child === 'string').join(' ');
  const containsPersian = /[\u0600-\u06FF]/.test(content);
  const textDirection = containsPersian ? styles.defaultRtlText : isPersian ? styles.defaultRtlText : styles.defaultLtrText;
  return <NativeText {...props} style={[textDirection, containsPersian && styles.persianFont, props.style]} />;
}
const API_HOSTS = [
  'https://server-hi-speed-iran.info',
  'https://hostinnegar.com',
  'https://windowsdiba.info',
];
const encode = (value: string) => encodeURIComponent(value);

function asText(...values: unknown[]): string {
  const value = values.find(x => (typeof x === 'string' && x.trim()) || typeof x === 'number');
  return value == null ? '' : String(value).trim();
}

function parseMedia(raw: Record<string, any>, kind: MediaKind): Media {
  return {
    id: Number(raw.id ?? raw.poster_id ?? 0),
    title: asText(raw.title, raw.name) || 'Untitled',
    image: asText(raw.image, raw.poster, raw.poster_url, raw.thumbnail),
    backdrop: asText(raw.backdrop_url, raw.backdrop, raw.backdrop_image, raw.banner, raw.wallpaper, raw.background_image, raw.cover, raw.image),
    year: asText(raw.year, raw.release_year, raw.release_date).slice(0, 4),
    rating: asText(raw.imdb, raw.rating, raw.rate),
    overview: asText(raw.overview, raw.summary, raw.description),
    kind,
    raw,
  };
}

function sourcesFrom(raw: Record<string, any>): Source[] {
  const values = Array.isArray(raw.sources) ? raw.sources : [];
  return values.flatMap((source: Record<string, any>) => {
    const url = asText(source?.url, source?.link, source?.src);
    const quality = asText(source?.quality, source?.resolution, source?.label) || 'Download';
    if (!url || /trailer|teaser|تیزر/i.test(quality)) return [];
    return [{quality, url}];
  });
}

function parseDescription(value: string): {overview: string; fields: {label: string; value: string}[]} {
  const fields: {label: string; value: string}[] = [];
  let overview = '';
  const knownLabels: Record<string, string> = {
    'نام پارسی': 'Persian title', 'سایر عناوین': 'Other titles', 'کارگردان': 'Director',
    'ستارگان': 'Cast', 'پخش از شبکه': 'Network', 'وضعیت سریال': 'Status',
  };
  for (const part of value.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const separator = part.indexOf(':');
    if (separator < 0) {
      if (!overview && part.trim()) overview = part.trim();
      continue;
    }
    const label = part.slice(0, separator).replace(/\s+/g, ' ').trim();
    const text = part.slice(separator + 1).replace(/[ \t]+/g, ' ').trim();
    if (!text) continue;
    if (/خلاصه/.test(label)) overview = text;
    else if (knownLabels[label]) fields.push({label: knownLabels[label], value: text});
  }
  return {overview, fields};
}

async function apiGet(path: string) {
  let lastError: unknown;
  for (const host of API_HOSTS) {
    try {
      const response = await fetch(`${host}${path}`);
      if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Could not reach the catalog');
}

async function loadMedia(kind: MediaKind, key: string, query = '', sort = 'created'): Promise<Media[]> {
  const json = query.trim()
    ? await apiGet(`/api/search/${encode(query.trim())}/${encode(key)}/`)
    : await apiGet(`/api/${kind === 'movie' ? 'movie' : 'serie'}/by/filtres/0/${encode(sort)}/0/${encode(key)}`);
  const records = Array.isArray(json) ? json : Array.isArray(json?.posters) ? json.posters : [];
  return records.filter((record: Record<string, any>) => !isExcludedTitle(record)).map((record: Record<string, any>) => parseMedia(record, kind));
}

async function searchHome(key: string, query: string): Promise<Media[]> {
  const json = await apiGet(`/api/search/${encode(query.trim())}/${encode(key)}/`);
  const records = Array.isArray(json?.posters) ? json.posters : [];
  return records.filter((record: Record<string, any>) => !isExcludedTitle(record)).map((record: Record<string, any>) => {
    const type = asText(record.type, record.kind, record.media_type).toLowerCase();
    return parseMedia(record, /serie|series|tv/.test(type) ? 'series' : 'movie');
  });
}

async function loadSeasons(id: number, key: string): Promise<Season[]> {
  const json = await apiGet(`/api/season/by/serie/${id}/${encode(key)}/`);
  if (!Array.isArray(json)) return [];
  return json.map((season: Record<string, any>, index: number) => {
    const episodesRaw = season.episodes ?? season.parts ?? season.items ?? [];
    return {
      title: asText(season.title, season.name) || `Season ${index + 1}`,
      episodes: (Array.isArray(episodesRaw) ? episodesRaw : []).map((episode: Record<string, any>, epIndex: number) => ({
        title: asText(episode.title, episode.name) || `Episode ${epIndex + 1}`,
        sources: sourcesFrom(episode),
      })),
    };
  });
}

async function loadGenres(key: string): Promise<Genre[]> {
  const json = await apiGet(`/api/genre/all/${encode(key)}/`);
  return (Array.isArray(json) ? json : []).map((item: Record<string, any>) => ({id: Number(item.id), title: asText(item.title, item.name)})).filter((item: Genre) => item.id && item.title);
}

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
  const [query, setQuery] = useState('');
  const [sortByRating, setSortByRating] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreId, setGenreId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const activeKind: MediaKind = tab === 'Series' || tab === 'Top Series' ? 'series' : 'movie';
  const refresh = useCallback(async (searchText = '') => {
    if (!apiKey || tab === 'Saved') return;
    setLoading(true); setError('');
    try {
      if (tab === 'Home' || tab === 'Trending') {
        if (searchText.trim()) setItems(await searchHome(apiKey, searchText));
        else {
          const [movies, series, topMovies, topSeries] = await Promise.all([
            loadMedia('movie', apiKey), loadMedia('series', apiKey),
            tab === 'Home' && showTop250Movies ? loadMedia('movie', apiKey, '', 'imdb') : Promise.resolve([]),
            tab === 'Home' && showTop250Series ? loadMedia('series', apiKey, '', 'imdb') : Promise.resolve([]),
          ]);
          const all = [...movies, ...series];
          setItems(tab === 'Trending' ? all.sort((a, b) => Number(b.rating) - Number(a.rating)) : all);
          setTopMovieItems(rankTop250(topMovies, 'movie'));
          setTopSeriesItems(rankTop250(topSeries, 'series'));
        }
      } else {
        const isTopTab = tab.startsWith('Top ');
        const loaded = await loadMedia(activeKind, apiKey, searchText, isTopTab ? 'imdb' : 'created');
        setItems(isTopTab ? rankTop250(loaded, activeKind) : loaded);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load titles');
    } finally { setLoading(false); }
  }, [activeKind, apiKey, showTop250Movies, showTop250Series, tab]);

  useEffect(() => { if (apiKey && !selected) refresh(''); }, [apiKey, tab, selected, refresh]);

  const open = async (item: Media) => {
    setSelected(item); setSeasons([]); setSeasonIndex(0);
    if (item.kind === 'series' && apiKey) {
      try { setSeasons(await loadSeasons(item.id, apiKey)); } catch { setSeasons([]); }
    }
  };

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
  const homeSectionTabs: [string, string][] = [[tr(locale, 'Featured', 'ویژه'), 'featured'], [tr(locale, 'Movies', 'فیلم‌ها'), 'movies'], [tr(locale, 'Series', 'سریال‌ها'), 'series']];
  if (showTop250Movies) homeSectionTabs.push([tr(locale, 'Top 250 Movies', '۲۵۰ فیلم برتر'), 'topMovies']);
  if (showTop250Series) homeSectionTabs.push([tr(locale, 'Top 250 Series', '۲۵۰ سریال برتر'), 'topSeries']);
  const sectionTitle = tr(locale, tab === 'Saved' ? 'My List' : tab === 'Trending' ? 'Trending now' : tab.startsWith('Top ') ? `Top rated ${activeKind === 'movie' ? 'movies' : 'series'}` : `Explore ${tab.toLowerCase()}`, tab === 'Saved' ? 'فهرست من' : tab === 'Trending' ? 'محبوب‌های این روزها' : tab.startsWith('Top ') ? `برترین ${activeKind === 'movie' ? 'فیلم‌ها' : 'سریال‌ها'}` : tab === 'Movies' ? 'کاوش فیلم‌ها' : tab === 'Series' ? 'کاوش سریال‌ها' : 'کاوش');
  const sectionSubtitle = tab === 'Saved' ? tr(locale, 'The movies and series you have saved for later.', 'فیلم‌ها و سریال‌هایی که برای بعد ذخیره کرده‌اید.')
    : tab === 'Trending' ? tr(locale, 'Popular titles across movies and series.', 'عنوان‌های محبوب فیلم و سریال.')
      : tab === 'Movies' || tab === 'Top Movies' ? tr(locale, 'Browse the latest movies and find your next watch.', 'فیلم‌های تازه را ببینید و انتخاب بعدی‌تان را پیدا کنید.')
        : tr(locale, 'Browse series and discover your next favorite.', 'سریال‌ها را ببینید و موردعلاقه بعدی‌تان را پیدا کنید.');
  const orderedItems = useMemo(() => sortByRating
    ? [...visibleItems].sort((a, b) => Number(b.rating) - Number(a.rating))
    : visibleItems, [visibleItems, sortByRating]);

  const header = <View style={[styles.pageHeader, isTV && styles.pageHeaderTV]}>
    <View style={[styles.brandRow, isPersian && styles.rtlRow]}>
      {selected ? <Action label="‹" onPress={() => setSelected(null)} /> : null}
      <View style={[styles.brandMark, {backgroundColor: palette.accent}]}><Text style={styles.brandMarkText}>S</Text></View>
      <View style={styles.brandCopy}>
        <Text style={styles.brand}>STREAMOVIE</Text>
        <Text style={styles.tagline}>{tr(locale, 'Discover something worth watching', 'چیزی دیدنی برای تماشا پیدا کنید')}</Text>
      </View>
      {!selected ? <Pressable accessibilityLabel={tr(locale, 'Settings', 'تنظیمات')} onPress={openSettings} onFocus={() => {}} style={[styles.headerSettings, {borderColor: `${palette.accent}55`}]}><NavIcon name="settings" color={palette.accent} size={21} /></Pressable> : null}
    </View>
    {!selected && tab !== 'Saved' ? <View style={[styles.searchRow, isTV && styles.tvSearchRow, isPersian && styles.rtlRow]}>
      <TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => refresh(query)} placeholder={tr(locale, 'Search movies and series', 'جستجوی فیلم و سریال')} placeholderTextColor={COLORS.muted} returnKeyType="search" style={[styles.searchInput, isPersian ? styles.rtlText : styles.ltrInput, {borderColor: `${palette.accent}44`}]} />
      <Action label={tr(locale, 'Search', 'جستجو')} onPress={() => refresh(query)} active />
    </View> : null}
  </View>;

  if (!apiKey) return <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.safe, {backgroundColor: palette.bg, direction: isPersian ? 'rtl' : 'ltr'}]}><StatusBar barStyle="light-content" backgroundColor={palette.bg} /><View style={styles.keyPanel}>
    <Text style={styles.brand}>STREAMOVIE</Text><Text style={[styles.sectionTitle, isPersian && styles.rtlText]}>{tr(locale, 'Connect your catalog', 'اتصال به فهرست فیلم‌ها')}</Text>
    <Text style={[styles.body, isPersian && styles.rtlText]}>{tr(locale, 'Enter your Streamovie API key to load movies and series. The key is stored on this device and sent to the catalog API.', 'برای بارگذاری فیلم‌ها و سریال‌ها، کلید API استریمووی را وارد کنید. کلید روی همین دستگاه ذخیره می‌شود.')}</Text>
    <TextInput value={keyInput} onChangeText={setKeyInput} placeholder="Catalog API key" placeholderTextColor={COLORS.muted} autoCapitalize="none" autoCorrect={false} secureTextEntry style={[styles.searchInput, styles.ltrInput]} />
    <Action label={tr(locale, 'Continue', 'ادامه')} active onPress={saveKey} />
  </View></SafeAreaView>;

  return <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.safe, {backgroundColor: palette.bg, direction: isPersian ? 'rtl' : 'ltr'}]}><StatusBar barStyle="light-content" backgroundColor={palette.bg} />
    <View style={[styles.appFrame, isTV && styles.tvAppFrame, {direction: isPersian ? 'rtl' : 'ltr', flexDirection: isTV ? 'row' : 'column'}]}>
      {isTV ? <TVNavigation selected={tab} onSelect={value => { setSelected(null); setTab(value); setQuery(''); }} onSettings={openSettings} accent={palette.accent} locale={locale} showTop250Movies={showTop250Movies} showTop250Series={showTop250Series} /> : null}
      <View style={[styles.mainContent, {backgroundColor: palette.bg, direction: isPersian ? 'rtl' : 'ltr'}]}>
      {selected ? <ScrollView contentContainerStyle={[styles.detailScroll, {direction: isPersian ? 'rtl' : 'ltr'}]}>
        {header}
        <Detail item={selected} isSaved={saved.some(value => value.id === selected.id && value.kind === selected.kind)} onSave={() => toggleSaved(selected)} seasons={seasons} seasonIndex={seasonIndex} onSeason={setSeasonIndex} isTV={isTV} isWide={isTablet} onWatch={(source, title) => setPlaying({source, title})} />
        <SiteFooter onNavigate={value => { setSelected(null); setTab(value); }} />
      </ScrollView> : tab === 'Home' ? <ScrollView ref={homeScrollRef} contentContainerStyle={[styles.homeContent, {direction: isPersian ? 'rtl' : 'ltr'}]}>
        {isTV ? <View style={[styles.homeSectionTabs, isPersian && styles.rtlRow]}>{homeSectionTabs.map(([label, target], index) => <Pressable key={target} onPress={() => homeScrollRef.current?.scrollTo({y: homeSectionY.current[target] ?? 0, animated: true})} onFocus={() => {}} style={[styles.homeSectionTab, index === 0 && styles.homeSectionTabActive]}><Text style={[styles.homeSectionTabText, index === 0 && styles.homeSectionTabTextActive]}>{label}</Text></Pressable>)}</View> : header}
        <View onLayout={event => { homeSectionY.current.featured = event.nativeEvent.layout.y; }}>
        {items[0] ? <Spotlight item={items[0]} onPress={() => open(items[0])} isTV={isTV} /> : loading ? <View style={styles.heroLoading}><ActivityIndicator color={palette.accent} size="large" /></View> : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View onLayout={event => { homeSectionY.current.movies = event.nativeEvent.layout.y; }}><MediaRail title="Movies" subtitle="Popular picks for your next movie night" items={movies.slice(0, 20)} width={width} isTV={isTV} landscape={isTV} onSelect={open} /></View>
        <View onLayout={event => { homeSectionY.current.series = event.nativeEvent.layout.y; }}><MediaRail title="Series" subtitle="Find your next series" items={series.slice(0, 20)} width={width} isTV={isTV} onSelect={open} /></View>
        {showTop250Movies ? <View onLayout={event => { homeSectionY.current.topMovies = event.nativeEvent.layout.y; }}><MediaRail title="IMDb Top 250 movies" items={topMovies} width={width} isTV={isTV} onSelect={open} /></View> : null}
        {showTop250Series ? <View onLayout={event => { homeSectionY.current.topSeries = event.nativeEvent.layout.y; }}><MediaRail title="IMDb Top 250 series" items={topSeries} width={width} isTV={isTV} onSelect={open} /></View> : null}
        <SiteFooter onNavigate={value => { setSelected(null); setTab(value); }} />
        {!loading && !items.length ? <View style={styles.empty}><Text style={styles.body}>{error || tr(locale, 'No titles to show.', 'عنوانی برای نمایش نیست.')}</Text></View> : null}
      </ScrollView> : <FlatList
        key={`${columns}-${tab}`}
        data={orderedItems}
        numColumns={columns}
        initialNumToRender={isTV ? 12 : 8}
        maxToRenderPerBatch={isTV ? 18 : 10}
        updateCellsBatchingPeriod={40}
        windowSize={isTV ? 7 : 9}
        removeClippedSubviews={Platform.OS === 'android' && !isTV}
        keyExtractor={(item, index) => `${item.kind}-${item.id}-${index}`}
        ListHeaderComponent={<>{header}<View style={[styles.listIntro, {backgroundColor: `${palette.panel}cc`}]}>
          <View style={[styles.listTitleRow, isPersian && styles.rtlRow]}>
            <View style={styles.listTitleCopy}><Text style={[styles.sectionTitle, isPersian && styles.rtlText]}>{sectionTitle}</Text><Text style={[styles.listSubtitle, isPersian && styles.rtlText]}>{sectionSubtitle}</Text></View>
            <Text style={[styles.resultCount, isPersian && styles.rtlText]}>{tr(locale, `${orderedItems.length} TITLES`, `${orderedItems.length} عنوان`)}</Text>
          </View>
          {tab !== 'Saved' ? <View style={styles.listControls}>
            <Text style={[styles.filterLabel, isPersian && styles.rtlText]}>{tr(locale, 'SORT BY', 'مرتب‌سازی')}</Text>
            <Action label={tr(locale, 'Latest', 'جدیدترین')} active={!sortByRating} onPress={() => setSortByRating(false)} />
            <Action label={tr(locale, 'Top rated', 'بالاترین امتیاز')} active={sortByRating} onPress={() => setSortByRating(true)} />
          </View> : null}
          {tab !== 'Saved' && genres.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreFilters}><Action label={tr(locale, 'All genres', 'همه ژانرها')} active={!genreId} onPress={() => setGenreId(0)} />{genres.map(genre => <Action key={genre.id} label={genre.title} active={genreId === genre.id} onPress={() => setGenreId(genre.id)} />)}</ScrollView> : null}
        </View></>}
        contentContainerStyle={[styles.listContent, {direction: isPersian ? 'rtl' : 'ltr'}]}
        columnWrapperStyle={[styles.gridRow, isPersian && styles.rtlRow]}
        renderItem={({item}) => <MediaCard item={item} isTV={isTV} onPress={() => open(item)} />}
        ListEmptyComponent={<View style={styles.empty}>{loading ? <ActivityIndicator color={palette.accent} size="large" /> : <Text style={[styles.body, isPersian && styles.rtlText]}>{error || tr(locale, tab === 'Saved' ? 'Save titles to find them here.' : 'No titles to show.', tab === 'Saved' ? 'عنوان‌ها را ذخیره کنید تا اینجا ببینید.' : 'عنوانی برای نمایش نیست.')}</Text>}</View>}
        ListFooterComponent={<>{loading && visibleItems.length ? <ActivityIndicator color={COLORS.accent} style={styles.loader} /> : null}<SiteFooter onNavigate={value => { setSelected(null); setTab(value); }} /></>}
        refreshing={loading}
        onRefresh={() => refresh('')}
      />}
      </View>
      {!isTV ? <BottomNavigation selected={tab} onSelect={value => { setSelected(null); setTab(value); setQuery(''); }} /> : null}
    </View>
    <SettingsModal visible={settingsOpen} locale={locale} theme={theme} isTV={isTV} showTop250Movies={showTop250Movies} showTop250Series={showTop250Series} onClose={closeSettings} onLocale={setLocale} onTheme={setTheme} onShowTop250Movies={setShowTop250Movies} onShowTop250Series={setShowTop250Series} />
    <VideoPlayerModal item={playing} locale={locale} isTV={isTV} onClose={() => setPlaying(null)} />
  </SafeAreaView>;
}

function Action({label, onPress, active = false}: {label: string; onPress: () => void; active?: boolean}) {
  const {theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [focused, setFocused] = useState(false);
  return <Pressable onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.action, active && {backgroundColor: accent, borderColor: accent}, focused && styles.focused]}>
    <Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text>
  </Pressable>;
}

function Spotlight({item, onPress, isTV}: {item: Media; onPress: () => void; isTV: boolean}) {
  const {locale, theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [focused, setFocused] = useState(false);
  return <Pressable onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.spotlight, isTV && styles.spotlightTV, focused && styles.spotlightFocused]}>
    {item.backdrop ? <Image source={{uri: item.backdrop}} resizeMode="cover" style={styles.spotlightImage} /> : null}
    <View style={styles.spotlightShade} />
    <View style={[styles.spotlightContent, locale === 'fa' && styles.rtlContent]}>
      <Text style={[styles.spotlightEyebrow, {color: accent}]}>{tr(locale, '●  FEATURED', '●  پیشنهاد ویژه')}</Text>
      <Text style={styles.spotlightMeta}>{[item.rating ? `★ ${item.rating} IMDb` : '', item.year, item.kind === 'series' ? tr(locale, 'Series', 'سریال') : tr(locale, 'Movie', 'فیلم')].filter(Boolean).join('  ·  ')}</Text>
      <Text numberOfLines={2} style={styles.spotlightTitle}>{item.title}</Text>
      {item.overview ? <Text numberOfLines={3} style={styles.spotlightOverview}>{item.overview}</Text> : null}
      <View style={styles.spotlightActions}><Action label={tr(locale, '▶  View details', '▶  مشاهده جزئیات')} active onPress={onPress} /></View>
    </View>
  </Pressable>;
}

function MediaRail({title, subtitle, items, width, isTV = false, landscape = false, onSelect}: {title: string; subtitle?: string; items: Media[]; width: number; isTV?: boolean; landscape?: boolean; onSelect: (item: Media) => void}) {
  const {locale} = useContext(SettingsContext);
  const localizedTitle: Record<string, string> = {'Movies': 'فیلم‌ها', 'Series': 'سریال‌ها', 'Top rated movies': 'فیلم‌های برتر', 'Top rated series': 'سریال‌های برتر', 'IMDb Top 250 movies': '۲۵۰ فیلم برتر IMDb', 'IMDb Top 250 series': '۲۵۰ سریال برتر IMDb'};
  const localizedSubtitle: Record<string, string> = {'Popular picks for your next movie night': 'پیشنهادهایی برای تماشای فیلم', 'Find your next series': 'سریال بعدی خود را پیدا کنید'};
  const cardWidth = isTV ? Math.min(Math.max(width * 0.21, 190), 290) : Math.min(width * (width >= 620 ? 0.29 : 0.46), width >= 620 ? 240 : 210);
  const tileWidth = landscape ? cardWidth * 1.35 : cardWidth;
  if (!items.length) return null;
  return <View style={styles.rail}>
    <View style={styles.railHeading}>
      <View><Text style={[styles.railTitle, locale === 'fa' && styles.rtlText]}>{locale === 'fa' ? localizedTitle[title] ?? title : title}</Text>{subtitle ? <Text style={[styles.railSubtitle, locale === 'fa' && styles.rtlText]}>{locale === 'fa' ? localizedSubtitle[subtitle] ?? subtitle : subtitle}</Text> : null}</View>
      <Text style={styles.railMore}>{tr(locale, 'SEE ALL  ›', 'مشاهده همه  ‹')}</Text>
    </View>
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item, index) => `${item.kind}-${item.id}-${index}`}
      renderItem={({item}) => <View style={[styles.railCard, {width: tileWidth}]}><MediaCard item={item} landscape={landscape} onPress={() => onSelect(item)} /></View>}
      getItemLayout={(_, index) => ({length: tileWidth + 12, offset: (tileWidth + 12) * index, index})}
      initialNumToRender={isTV ? 5 : 4}
      maxToRenderPerBatch={isTV ? 6 : 5}
      windowSize={4}
      removeClippedSubviews={Platform.OS === 'android' && !isTV}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.railContent}
    />
  </View>;
}

function BottomNavigation({selected, onSelect}: {selected: AppTab; onSelect: (tab: AppTab) => void}) {
  const {locale, theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const items: {name: AppTab; icon: NavIconName}[] = [
    {name: 'Home', icon: 'home'}, {name: 'Movies', icon: 'movies'}, {name: 'Series', icon: 'series'}, {name: 'Trending', icon: 'trending'}, {name: 'Saved', icon: 'saved'},
  ] as const;
  return <View style={styles.bottomNav}>
    {items.map(item => <Pressable key={item.name} onPress={() => onSelect(item.name)} onFocus={() => {}} style={styles.bottomNavItem}>
      {selected === item.name ? <View style={[styles.bottomNavActiveMark, {backgroundColor: accent}]} /> : null}
      <NavIcon name={item.icon} color={selected === item.name ? accent : '#777'} size={22} />
      <Text numberOfLines={1} style={[styles.bottomNavLabel, selected === item.name && styles.bottomNavActive]}>{tr(locale, item.name, ({Home: 'خانه', Movies: 'فیلم‌ها', Series: 'سریال‌ها', Trending: 'محبوب', Saved: 'ذخیره‌شده'} as Record<string, string>)[item.name] ?? item.name)}</Text>
    </Pressable>)}
  </View>;
}

function TVNavigation({selected, onSelect, onSettings, accent, locale, showTop250Movies, showTop250Series}: {selected: AppTab; onSelect: (tab: AppTab) => void; onSettings: () => void; accent: string; locale: Locale; showTop250Movies: boolean; showTop250Series: boolean}) {
  const items: {name: AppTab | 'Search'; icon: NavIconName}[] = [
    {name: 'Home', icon: 'home'}, {name: 'Search', icon: 'search'}, {name: 'Trending', icon: 'trending'}, {name: 'Saved', icon: 'saved'}, {name: 'Movies', icon: 'movies'}, {name: 'Series', icon: 'series'},
    ...(showTop250Movies ? [{name: 'Top Movies' as const, icon: 'top' as const}] : []),
    ...(showTop250Series ? [{name: 'Top Series' as const, icon: 'top' as const}] : []),
  ];
  return <View style={[styles.tvNavigation, locale === 'fa' && {borderRightWidth: 0, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.07)'}]}>
    <View style={[styles.tvBrandMark, {backgroundColor: accent}]}><NavIcon name="play" color="#fff" size={23} /></View>
    <View style={styles.tvNavigationItems}>{items.map(item => <TVNavigationItem key={item.name} item={item} selected={selected === item.name || (item.name === 'Search' && selected === 'Movies')} onSelect={() => onSelect(item.name === 'Search' ? 'Movies' : item.name)} />)}</View>
    <Pressable accessibilityLabel={tr(locale, 'Settings', 'تنظیمات')} onPress={onSettings} onFocus={() => {}} style={styles.tvNavigationItem}><NavIcon name="settings" color={accent} size={23} /></Pressable>
  </View>;
}

function NavIcon({name, color, size}: {name: NavIconName; color: string; size: number}) {
  return <Image source={NAV_ICONS[name]} resizeMode="contain" style={{width: size, height: size, tintColor: color}} />;
}

function TVNavigationItem({item, selected, onSelect}: {item: {name: AppTab | 'Search'; icon: NavIconName}; selected: boolean; onSelect: () => void}) {
  const [focused, setFocused] = useState(false);
  return <Pressable onPress={onSelect} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.tvNavigationItem, selected && styles.tvNavigationSelected, focused && styles.tvNavigationFocused]}>
    <NavIcon name={item.icon} color={selected || focused ? '#fff' : '#888'} size={23} />
  </Pressable>;
}

const MediaCard = React.memo(function MediaCard({item, isTV = false, landscape = false, onPress}: {item: Media; isTV?: boolean; landscape?: boolean; onPress: () => void}) {
  const [focused, setFocused] = useState(false);
  return <Pressable onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.card, isTV && styles.cardTV, landscape && styles.cardLandscape, focused && styles.cardFocused]}>
    <View style={[styles.posterFrame, landscape && styles.landscapeFrame]}>{item.image ? <Image source={{uri: landscape ? item.backdrop || item.image : item.image}} resizeMode="cover" style={[styles.poster, landscape && styles.landscapePoster]} /> : <View style={[styles.poster, styles.posterPlaceholder]}><Text style={styles.body}>No artwork</Text></View>}
      {item.rating ? <Text style={styles.posterRating}>★ {item.rating}</Text> : null}
    </View>
    <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
    <Text style={styles.meta}>{[item.year, item.rating ? `★ ${item.rating}` : ''].filter(Boolean).join(' · ')}</Text>
  </Pressable>;
}, (previous, next) => previous.item === next.item && previous.isTV === next.isTV && previous.landscape === next.landscape);

function Detail({item, isSaved, onSave, seasons, seasonIndex, onSeason, isTV, isWide, onWatch}: {
  item: Media; isSaved: boolean; onSave: () => void; seasons: Season[]; seasonIndex: number; onSeason: (index: number) => void; isTV: boolean; isWide: boolean; onWatch: (source: Source, title: string) => void;
}) {
  const {locale, theme, isPersian} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const mediaSources = sourcesFrom(item.raw);
  const description = parseDescription(asText(item.raw.description, item.raw.summary, item.overview));
  const sourceColumns = isTV ? 3 : isWide ? 2 : 1;
  const episodeColumns = isTV || isWide ? 2 : 1;
  return <View style={styles.detail}>
    <View style={[styles.detailHero, isWide ? styles.detailHeroWide : styles.detailHeroMobile, {backgroundColor: THEMES[theme].panel}]}>
      {item.backdrop || item.image ? <Image source={{uri: item.backdrop || item.image}} resizeMode="cover" style={styles.detailBackdrop} /> : null}
      <View pointerEvents="none" style={styles.detailBackdropShade} />
      {item.image ? <Image source={{uri: item.image}} resizeMode="cover" style={[styles.detailPoster, isWide ? styles.detailPosterWide : styles.detailPosterMobile]} /> : null}
      <View style={[styles.detailCopy, isPersian && styles.detailCopyRTL]}>
        <Text style={[styles.detailEyebrow, {color: accent}, isPersian && styles.rtlText]}>{item.kind === 'series' ? tr(locale, 'SERIES', 'سریال') : tr(locale, 'MOVIE', 'فیلم')}  ·  {item.year || '—'}</Text>
        <Text style={[styles.detailTitle, isPersian && styles.rtlText]}>{item.title}</Text>
        {item.rating ? <Text style={styles.detailRating}>★  {item.rating} <Text style={styles.meta}>IMDb rating</Text></Text> : null}
        <View style={styles.detailMetaRow}>
          {asText(item.raw.duration, item.raw.runtime) ? <Text style={styles.detailMetaChip}>◷  {asText(item.raw.duration, item.raw.runtime)}</Text> : null}
          {asText(item.raw.country, item.raw.countries) ? <Text style={styles.detailMetaChip}>⌖  {asText(item.raw.country, item.raw.countries)}</Text> : null}
          {asText(item.raw.genre, item.raw.genres) ? <Text style={styles.detailMetaChip}>{asText(item.raw.genre, item.raw.genres)}</Text> : null}
        </View>
        {description.overview ? <Text style={[styles.detailOverview, isPersian && styles.rtlText]}>{description.overview}</Text> : null}
        <View style={[styles.detailActions, isPersian && styles.rtlRow]}>
          <Action label={item.kind === 'movie' ? tr(locale, '↓  Downloads', '↓  دانلودها') : tr(locale, '↓  Episodes', '↓  قسمت‌ها')} onPress={() => { const source = mediaSources[0]; if (source) void Linking.openURL(source.url); }} active />
          <Action label={isSaved ? tr(locale, '★ Saved', '★ ذخیره‌شده') : tr(locale, '♡  My List', '♡  فهرست من')} onPress={onSave} active={isSaved} />
        </View>
      </View>
    </View>
    {description.fields.length ? <View style={[styles.section, {backgroundColor: THEMES[theme].panel}]}>
        <Text style={[styles.panelHeading, isPersian && styles.rtlText]}>{tr(locale, 'About this title', 'درباره این عنوان')}</Text>
      <View style={styles.metadataGrid}>{description.fields.map((field, index) => <View key={`${field.label}-${index}`} style={[styles.metadataItem, isWide && styles.metadataItemWide]}>
        <Text style={[styles.metadataLabel, isPersian && styles.rtlText]}>{tr(locale, field.label, ({'Persian title': 'نام فارسی', 'Other titles': 'عنوان‌های دیگر', Director: 'کارگردان', Cast: 'بازیگران', Network: 'شبکه پخش', Status: 'وضعیت'} as Record<string, string>)[field.label] ?? field.label)}</Text><Text style={[styles.metadataValue, isPersian && styles.rtlText]}>{field.value}</Text>
      </View>)}</View>
    </View> : null}
    {item.kind === 'movie' ? <View style={[styles.section, {backgroundColor: THEMES[theme].panel}]}>
      <View style={styles.detailSectionHeading}><View><Text style={[styles.sectionTitle, isPersian && styles.rtlText]}>{tr(locale, 'Downloads', 'دانلودها')}</Text><Text style={[styles.railSubtitle, isPersian && styles.rtlText]}>{tr(locale, 'Choose a quality to open the download source.', 'کیفیت موردنظر را برای دریافت لینک دانلود انتخاب کنید.')}</Text></View></View>
      <SourceGrid sources={mediaSources} columns={sourceColumns} title={item.title} onWatch={onWatch} />
    </View> : <View style={[styles.section, {backgroundColor: THEMES[theme].panel}]}>
      <View style={styles.detailSectionHeading}><View><Text style={[styles.sectionTitle, isPersian && styles.rtlText]}>{tr(locale, 'Episode guide', 'راهنمای قسمت‌ها')}</Text><Text style={[styles.railSubtitle, isPersian && styles.rtlText]}>{tr(locale, 'Select a season, then choose an episode.', 'فصل را انتخاب کنید و سپس قسمت موردنظر را برگزینید.')}</Text></View></View>
      {!seasons.length ? <Text style={[styles.body, isPersian && styles.rtlText]}>{tr(locale, 'Loading episodes, or no episodes are available.', 'قسمتی یافت نشد یا در حال بارگذاری قسمت‌ها هستیم.')}</Text> : <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonRow}>
          {seasons.map((season, index) => <Action key={`${season.title}-${index}`} label={season.title} active={seasonIndex === index} onPress={() => onSeason(index)} />)}
        </ScrollView>
        <View style={styles.episodeGrid}>
          {seasons[seasonIndex]?.episodes.map((episode, index) => <View key={`${episode.title}-${index}`} style={[styles.episode, {width: `${100 / episodeColumns}%`} ]}>
            <Text style={styles.episodeNumber}>S{String(seasonIndex + 1).padStart(2, '0')} · E{String(index + 1).padStart(2, '0')}</Text>
            <Text numberOfLines={2} style={styles.episodeTitle}>{episode.title}</Text>
            <SourceGrid sources={episode.sources} columns={sourceColumns} title={`${item.title} · ${episode.title}`} onWatch={onWatch} />
          </View>)}
        </View>
      </>}
    </View>}
  </View>;
}

function SourceGrid({sources, columns, title, onWatch}: {sources: Source[]; columns: number; title: string; onWatch: (source: Source, title: string) => void}) {
  const {locale} = useContext(SettingsContext);
  if (!sources.length) return <Text style={[styles.meta, locale === 'fa' && styles.rtlText]}>{tr(locale, 'No download links available.', 'لینک دانلودی موجود نیست.')}</Text>;
  return <View style={styles.sourceGrid}>{sources.map((source, index) => <SourceButton key={`${source.url}-${index}`} source={source} columns={columns} title={title} onWatch={onWatch} />)}</View>;
}

function SourceButton({source, columns, title, onWatch}: {source: Source; columns: number; title: string; onWatch: (source: Source, title: string) => void}) {
  const {theme, locale} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [focused, setFocused] = useState(false);
  const sourceWidth = (columns === 1 ? '100%' : `${100 / columns - 2}%`) as `${number}%` | '100%';
  return <View style={[styles.source, {width: sourceWidth}, focused && {borderColor: accent, borderWidth: 2}]}>
    <View style={styles.sourceCard}>
      <Text numberOfLines={1} style={[styles.sourceText, locale === 'fa' && styles.rtlText]}>↓  {source.quality}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={tr(locale, `Watch ${title} online`, `تماشای آنلاین ${title}`)} onPress={() => onWatch(source, title)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.sourcePlayButton, {backgroundColor: `${accent}22`, borderColor: `${accent}77`}]}>
        <Text numberOfLines={1} style={[styles.sourcePlayText, {color: accent}, locale === 'fa' && styles.rtlText]}>▶  {tr(locale, 'Watch online', 'تماشای آنلاین')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={tr(locale, `Download ${source.quality}`, `دانلود ${source.quality}`)} onPress={() => { void Linking.openURL(source.url); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={styles.sourceDownloadButton}>
        <Text numberOfLines={1} style={[styles.sourceHint, locale === 'fa' && styles.rtlText]}>↓  {tr(locale, 'Download', 'دانلود')}</Text>
      </Pressable>
    </View>
  </View>;
}

function SiteFooter({onNavigate}: {onNavigate: (tab: AppTab) => void}) {
  const {locale, theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const year = new Date().getFullYear();
  const link = (en: string, fa: string, tab: AppTab) => <Pressable key={en} onPress={() => onNavigate(tab)} onFocus={() => {}} style={styles.footerLink}><Text style={[styles.footerLinkText, locale === 'fa' && styles.rtlText]}>{tr(locale, en, fa)}</Text></Pressable>;
  return <View style={styles.siteFooter}>
    <View style={[styles.footerBrand, locale === 'fa' && styles.rtlRow]}><View style={[styles.footerMark, {backgroundColor: accent}]}><Text style={styles.footerMarkText}>▣</Text></View><Text style={styles.footerBrandText}>STREAMOVIE</Text></View>
    <Text style={[styles.footerDescription, locale === 'fa' && styles.rtlText]}>{tr(locale, 'Discover movies and series, browse what’s trending, and save titles to watch later.', 'فیلم‌ها و سریال‌ها را کشف کنید، محبوب‌ها را ببینید و عنوان‌های دلخواهتان را ذخیره کنید.')}</Text>
    <View style={[styles.footerColumns, locale === 'fa' && styles.rtlRow]}>
      <View style={styles.footerColumn}><Text style={styles.footerHeading}>{tr(locale, 'BROWSE', 'مرور')}</Text>{link('Home', 'خانه', 'Home')}{link('Movies', 'فیلم‌ها', 'Movies')}{link('Series', 'سریال‌ها', 'Series')}{link('Trending', 'محبوب‌ها', 'Trending')}{link('My List', 'فهرست من', 'Saved')}</View>
      <View style={styles.footerColumn}><Text style={styles.footerHeading}>{tr(locale, 'TOP RATED', 'برترین‌ها')}</Text>{link('Trending', 'محبوب‌ها', 'Trending')}{link('Top rated movies', 'فیلم‌های برتر', 'Top Movies')}{link('Top rated series', 'سریال‌های برتر', 'Top Series')}</View>
    </View>
    <View style={[styles.footerBottom, locale === 'fa' && styles.rtlRow]}><Text style={[styles.footerCopyright, locale === 'fa' && styles.rtlText]}>{tr(locale, `© ${year} Streamovie. All rights reserved. For entertainment purposes only.`, `© ${year} استریمووی. تمامی حقوق محفوظ است.`)}</Text><Pressable onPress={() => onNavigate('Home')} style={styles.backToTop}><Text style={styles.footerLinkText}>{tr(locale, '↑  Back to top', '↑  بازگشت به بالا')}</Text></Pressable></View>
  </View>;
}

export default function AppRoot() {
  const [theme, setTheme] = useState<ThemeId>('netflix');
  const [locale, setLocale] = useState<Locale>('fa');
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

function VideoPlayerModal({item, locale, isTV, onClose}: {item: {source: Source; title: string} | null; locale: Locale; isTV: boolean; onClose: () => void}) {
  const videoRef = useRef<VideoRef>(null);
  const [failed, setFailed] = useState(false);
  const [focusedSeek, setFocusedSeek] = useState<'back' | 'forward' | null>(null);
  useEffect(() => { setFailed(false); }, [item?.source.url]);
  const seekBy = async (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const position = await video.getCurrentPosition().catch(() => 0);
    video.seek(Math.max(0, position + seconds));
  };
  return <Modal visible={!!item} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
    <SafeAreaProvider>
      <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.playerSafeArea, {direction: locale === 'fa' ? 'rtl' : 'ltr'}]}>
        <View style={[styles.playerHeader, locale === 'fa' && styles.rtlRow]}>
          <Text numberOfLines={1} style={[styles.playerTitle, locale === 'fa' && styles.rtlText]}>{item?.title ?? ''}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={tr(locale, 'Close player', 'بستن پخش‌کننده')} onPress={onClose} style={styles.playerClose}>
            <Text style={styles.playerCloseText}>×</Text>
          </Pressable>
        </View>
        <View style={styles.playerVideoArea}>
          {item ? <Video ref={videoRef} key={item.source.url} source={{uri: item.source.url}} controls resizeMode="contain" style={styles.playerVideo} onError={() => setFailed(true)} /> : null}
          {failed ? <View pointerEvents="none" style={styles.playerError}><Text style={[styles.playerErrorText, locale === 'fa' && styles.rtlText]}>{tr(locale, 'This video could not be played.', 'پخش این ویدیو ممکن نیست.')}</Text></View> : null}
        </View>
        {isTV ? <View style={styles.playerSeekControls}>
          <Pressable focusable accessibilityRole="button" accessibilityLabel={tr(locale, 'Back 10 seconds', '۱۰ ثانیه به عقب')} onFocus={() => setFocusedSeek('back')} onBlur={() => setFocusedSeek(null)} onPress={() => { void seekBy(-10); }} style={[styles.playerSeekButton, focusedSeek === 'back' && styles.playerSeekFocused]}>
            <Text style={styles.playerSeekIcon}>↶</Text>
            <Text style={[styles.playerSeekText, locale === 'fa' ? styles.defaultRtlText : styles.defaultLtrText]}>{tr(locale, '10 sec', '۱۰ ثانیه')}</Text>
          </Pressable>
          <Pressable focusable accessibilityRole="button" accessibilityLabel={tr(locale, 'Forward 10 seconds', '۱۰ ثانیه به جلو')} onFocus={() => setFocusedSeek('forward')} onBlur={() => setFocusedSeek(null)} onPress={() => { void seekBy(10); }} style={[styles.playerSeekButton, focusedSeek === 'forward' && styles.playerSeekFocused]}>
            <Text style={styles.playerSeekIcon}>↷</Text>
            <Text style={[styles.playerSeekText, locale === 'fa' ? styles.defaultRtlText : styles.defaultLtrText]}>{tr(locale, '10 sec', '۱۰ ثانیه')}</Text>
          </Pressable>
        </View> : null}
      </SafeAreaView>
    </SafeAreaProvider>
  </Modal>;
}

function SettingsModal({visible, locale, theme, isTV, showTop250Movies, showTop250Series, onClose, onLocale, onTheme, onShowTop250Movies, onShowTop250Series}: {visible: boolean; locale: Locale; theme: ThemeId; isTV: boolean; showTop250Movies: boolean; showTop250Series: boolean; onClose: () => void; onLocale: (value: Locale) => void; onTheme: (value: ThemeId) => void; onShowTop250Movies: (value: boolean) => void; onShowTop250Series: (value: boolean) => void}) {
  const accent = THEMES[theme].accent;
  const languages: {id: Locale; label: string}[] = [{id: 'fa', label: 'فارسی'}, {id: 'en', label: 'English'}];
  const themeIds = Object.keys(THEMES) as ThemeId[];
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <SafeAreaProvider><SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.modalSafeArea}>
    <View style={[styles.modalBackdrop, {direction: locale === 'fa' ? 'rtl' : 'ltr'}]}><View style={[styles.settingsPanel, isTV && styles.settingsPanelTV, {backgroundColor: THEMES[theme].panel, borderColor: `${accent}55`}]}>
      <View style={[styles.settingsHeader, locale === 'fa' && styles.rtlRow]}><View><Text style={[styles.settingsTitle, locale === 'fa' && styles.rtlText]}>{tr(locale, 'Settings', 'تنظیمات')}</Text><Text style={[styles.settingsDescription, locale === 'fa' && styles.rtlText]}>{tr(locale, 'Personalize your Streamovie app', 'اپلیکیشن استریمووی را شخصی‌سازی کنید')}</Text></View><Pressable onPress={onClose} onFocus={() => {}} style={styles.settingsClose}><Text style={styles.settingsCloseText}>×</Text></Pressable></View>
      <ScrollView style={styles.settingsOptions} contentContainerStyle={styles.settingsOptionsContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.settingsSectionTitle, locale === 'fa' && styles.rtlText]}>{tr(locale, 'Language', 'زبان')}</Text>
      <View style={[styles.languageOptions, locale === 'fa' && styles.rtlRow]}>{languages.map(option => <Pressable key={option.id} onPress={() => onLocale(option.id)} onFocus={() => {}} style={[styles.languageOption, locale === option.id && {borderColor: accent, backgroundColor: `${accent}22`}]}><Text style={[styles.languageText, locale === 'fa' && styles.rtlText]}>{option.label}{locale === option.id ? '  ✓' : ''}</Text></Pressable>)}</View>
      <Text style={[styles.settingsSectionTitle, locale === 'fa' && styles.rtlText]}>{tr(locale, 'Theme', 'پوسته')}</Text>
      <View style={styles.themeOptions}>{themeIds.map(id => <Pressable key={id} onPress={() => onTheme(id)} onFocus={() => {}} style={[styles.themeOption, {width: `${isTV ? 32 : 48}%`}, theme === id && {borderColor: THEMES[id].accent}]}><View style={[styles.themeSwatch, {backgroundColor: THEMES[id].bg, borderColor: THEMES[id].accent}]}><View style={[styles.themeSwatchBar, {backgroundColor: THEMES[id].accent}]} /><Text style={{color: '#fff', fontSize: 12, fontWeight: '900'}}>S</Text></View><Text style={[styles.themeName, locale === 'fa' && styles.rtlText]}>{tr(locale, THEMES[id].label, ({netflix: 'نتفلیکس', midnight: 'نیمه‌شب', aurora: 'شفق قطبی', ocean: 'اقیانوس', sunset: 'غروب', candy: 'آبنباتی', noir: 'نوآر'} as Record<ThemeId, string>)[id])}{theme === id ? '  ✓' : ''}</Text></Pressable>)}</View>
      <Text style={[styles.settingsSectionTitle, locale === 'fa' && styles.rtlText]}>{tr(locale, 'Home sections', 'بخش‌های صفحه اصلی')}</Text>
      <SettingsToggle label={tr(locale, 'Show IMDb Top 250 movies', 'نمایش ۲۵۰ فیلم برتر IMDb')} value={showTop250Movies} locale={locale} accent={accent} onChange={onShowTop250Movies} />
      <SettingsToggle label={tr(locale, 'Show IMDb Top 250 series', 'نمایش ۲۵۰ سریال برتر IMDb')} value={showTop250Series} locale={locale} accent={accent} onChange={onShowTop250Series} />
      <Text style={[styles.settingsSectionTitle, locale === 'fa' && styles.rtlText]}>{tr(locale, 'Always hidden from lists', 'عنوان‌های همیشه پنهان از فهرست‌ها')}</Text>
      <Text style={[styles.hiddenTitlesText, locale === 'fa' && styles.rtlText]}>نسخه جدید ملودی باکس · نسخه جدید هورتون</Text>
      </ScrollView>
      <Pressable onPress={onClose} onFocus={() => {}} style={[styles.settingsDone, {backgroundColor: accent}]}><Text style={styles.settingsDoneText}>{tr(locale, 'Done', 'انجام شد')}</Text></Pressable>
    </View></View>
    </SafeAreaView></SafeAreaProvider>
  </Modal>;
}

function SettingsToggle({label, value, locale, accent, onChange}: {label: string; value: boolean; locale: Locale; accent: string; onChange: (value: boolean) => void}) {
  return <View style={[styles.settingToggleRow, locale === 'fa' && styles.rtlRow]}>
    <Text style={[styles.settingToggleText, locale === 'fa' && styles.rtlText]}>{label}</Text>
    <Switch value={value} onValueChange={onChange} trackColor={{false: '#383838', true: `${accent}99`}} thumbColor={value ? accent : '#aaa'} accessibilityLabel={label} />
  </View>;
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.bg},
  defaultRtlText: {writingDirection: 'rtl', textAlign: 'right'},
  defaultLtrText: {writingDirection: 'ltr', textAlign: 'left'},
  persianFont: {fontFamily: 'Vazirmatn'},
  ltrInput: {writingDirection: 'ltr', textAlign: 'left'},
  appFrame: {flex: 1},
  tvAppFrame: {flexDirection: 'row'},
  mainContent: {flex: 1, minWidth: 0},
  pageHeader: {paddingHorizontal: 18, paddingTop: 8},
  pageHeaderTV: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24, paddingHorizontal: 32, paddingTop: 14, paddingBottom: 10},
  tvSearchRow: {flex: 1, maxWidth: 650, marginTop: 0, marginBottom: 0},
  homeContent: {paddingBottom: 28},
  homeSectionTabs: {alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 12, marginBottom: 10, padding: 7, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(0,0,0,0.72)'},
  homeSectionTab: {minHeight: 38, paddingHorizontal: 17, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  homeSectionTabActive: {backgroundColor: '#fff'},
  homeSectionTabText: {color: 'rgba(255,255,255,0.68)', fontSize: 14, fontWeight: '700'},
  homeSectionTabTextActive: {color: '#111'},
  listContent: {paddingHorizontal: 16, paddingBottom: 28},
  listIntro: {marginTop: 12, marginBottom: 14, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.025)'},
  listTitleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  listTitleCopy: {flex: 1},
  listSubtitle: {color: '#9696a7', fontSize: 13, lineHeight: 19, marginTop: -8, marginBottom: 4},
  resultCount: {color: '#aaa', fontSize: 10, fontWeight: '800', letterSpacing: 1, borderWidth: 1, borderColor: COLORS.line, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7},
  listControls: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)'},
  genreFilters: {gap: 8, paddingTop: 10, paddingBottom: 2},
  filterLabel: {color: '#777', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginRight: 2},
  brandRow: {paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10},
  rtlRow: {flexDirection: 'row'},
  rtlText: {textAlign: 'right', writingDirection: 'rtl'},
  rtlContent: {alignItems: 'flex-end'},
  headerSettings: {width: 42, height: 42, borderWidth: 1, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center'},
  brandMark: {width: 38, height: 38, borderRadius: 11, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center'},
  brandMarkText: {color: '#fff', fontSize: 22, fontWeight: '900'},
  brandCopy: {flex: 1},
  brand: {color: COLORS.text, fontSize: 19, fontWeight: '900', letterSpacing: 1.3},
  tagline: {color: COLORS.muted, fontSize: 11, marginTop: 1},
  action: {minHeight: 42, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.panel2, borderWidth: 1, borderColor: COLORS.line, justifyContent: 'center', alignItems: 'center'},
  actionActive: {backgroundColor: COLORS.accent, borderColor: COLORS.accent},
  actionText: {color: COLORS.muted, fontSize: 14, fontWeight: '700'},
  actionTextActive: {color: COLORS.text},
  focused: {borderColor: '#fff', borderWidth: 2, backgroundColor: '#4b1519'},
  searchRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 8},
  searchInput: {flex: 1, minHeight: 46, color: COLORS.text, backgroundColor: '#171717', borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9},
  sectionTitle: {color: COLORS.text, fontSize: 23, fontWeight: '900', marginTop: 14, marginBottom: 14},
  spotlight: {height: 500, marginTop: 4, marginBottom: 26, justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: '#151515'},
  spotlightTV: {height: 610},
  spotlightFocused: {borderWidth: 2, borderColor: COLORS.accent},
  spotlightImage: {...StyleSheet.absoluteFillObject, width: '100%', height: '100%'},
  spotlightShade: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.50)'},
  spotlightContent: {paddingHorizontal: 22, paddingBottom: 30, paddingTop: 150, backgroundColor: 'rgba(0,0,0,0.42)'},
  spotlightEyebrow: {color: '#f87171', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 8},
  spotlightMeta: {color: '#e5e5e5', fontSize: 12, fontWeight: '600'},
  spotlightTitle: {color: '#fff', fontSize: 38, lineHeight: 42, fontWeight: '900', marginTop: 9, textShadowColor: '#000', textShadowRadius: 10},
  spotlightOverview: {color: '#e1e1e1', fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 620},
  spotlightActions: {flexDirection: 'row', marginTop: 16},
  heroLoading: {height: 420, alignItems: 'center', justifyContent: 'center'},
  rail: {marginBottom: 28},
  railHeading: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginBottom: 10},
  railTitle: {color: '#f6f6fb', fontSize: 19, fontWeight: '800'},
  railSubtitle: {color: '#8b8ba0', fontSize: 12, marginTop: 3},
  railMore: {color: '#aaa', fontSize: 10, fontWeight: '800', letterSpacing: 0.8},
  railContent: {gap: 12, paddingHorizontal: 18, paddingBottom: 4},
  railCard: {flexShrink: 0},
  bottomNav: {height: 62, flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(8,8,8,0.96)', paddingBottom: 2},
  bottomNavItem: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2},
  bottomNavActiveMark: {position: 'absolute', top: 0, width: 28, height: 2, borderRadius: 2, backgroundColor: COLORS.accent},
  bottomNavIcon: {color: '#777', fontSize: 21, lineHeight: 24},
  bottomNavLabel: {color: '#777', fontSize: 9, fontWeight: '600'},
  bottomNavActive: {color: '#fff'},
  tvNavigation: {width: 72, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.07)', backgroundColor: '#080808', paddingTop: 20, paddingBottom: 18},
  tvBrandMark: {width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 32},
  tvNavigationItems: {flex: 1, justifyContent: 'center', gap: 10, width: '100%', paddingHorizontal: 10},
  tvNavigationItem: {width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent'},
  tvNavigationSelected: {backgroundColor: 'rgba(255,255,255,0.08)'},
  tvNavigationFocused: {borderColor: '#fff', backgroundColor: 'rgba(229,9,20,0.25)'},
  tvNavigationIcon: {color: '#888', fontSize: 24, lineHeight: 28},
  tvNavigationLabel: {color: '#888', fontSize: 10, fontWeight: '700'},
  tvNavigationTextActive: {color: '#fff'},
  cardLandscape: {paddingBottom: 8},
  landscapeFrame: {overflow: 'hidden', borderRadius: 24},
  landscapePoster: {aspectRatio: 16 / 9, borderRadius: 24},
  siteFooter: {marginTop: 48, paddingHorizontal: 28, paddingTop: 30, paddingBottom: 22, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(16,16,16,0.7)'},
  footerBrand: {flexDirection: 'row', alignItems: 'center', gap: 10},
  footerMark: {width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center'},
  footerMarkText: {color: '#fff', fontSize: 18, fontWeight: '900'},
  footerBrandText: {color: '#f6f6fb', fontSize: 18, fontWeight: '900', letterSpacing: 0.6},
  footerDescription: {color: '#8b8ba0', fontSize: 13, lineHeight: 20, maxWidth: 420, marginTop: 12, marginBottom: 24},
  footerColumns: {flexDirection: 'row', gap: 72, marginBottom: 26},
  footerColumn: {gap: 8, alignItems: 'flex-start'},
  footerHeading: {color: '#777', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 3},
  footerLink: {minHeight: 30, justifyContent: 'center'},
  footerLinkText: {color: '#c2c2cd', fontSize: 13, fontWeight: '600'},
  footerBottom: {borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  footerCopyright: {color: '#666675', fontSize: 11, flexShrink: 1},
  backToTop: {paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)'},
  errorText: {color: '#fb7185', paddingHorizontal: 18, marginBottom: 12},
  gridRow: {gap: 12, marginBottom: 12},
  card: {flex: 1, minWidth: 0, backgroundColor: 'transparent', paddingBottom: 4},
  cardTV: {paddingBottom: 8},
  cardFocused: {transform: [{scale: 1.025}], borderWidth: 2, borderColor: '#fff', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)'},
  posterFrame: {position: 'relative'},
  poster: {width: '100%', aspectRatio: 0.68, borderRadius: 22, backgroundColor: COLORS.panel2},
  posterPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  posterRating: {position: 'absolute', left: 8, bottom: 8, color: '#fcd34d', backgroundColor: 'rgba(0,0,0,0.78)', overflow: 'hidden', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, fontSize: 11, fontWeight: '800'},
  cardTitle: {color: '#ececf5', fontSize: 13, fontWeight: '700', lineHeight: 17, marginTop: 7, paddingHorizontal: 3},
  meta: {color: '#8b8ba0', fontSize: 12, marginTop: 4, paddingHorizontal: 3},
  body: {color: COLORS.muted, fontSize: 15, lineHeight: 23, marginVertical: 8},
  empty: {minHeight: 180, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24},
  loader: {padding: 20},
  detailScroll: {paddingBottom: 24},
  detail: {paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30},
  detailHero: {position: 'relative', minHeight: 510, gap: 22, alignItems: 'center', overflow: 'hidden', borderRadius: 28, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.panel, padding: 20, paddingTop: 190},
  detailBackdrop: {...StyleSheet.absoluteFillObject, width: '100%', height: '100%'},
  detailBackdropShade: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,9,0.78)'},
  detailHeroMobile: {flexDirection: 'column-reverse', paddingTop: 200},
  detailHeroWide: {flexDirection: 'row', paddingTop: 24, minHeight: 540},
  detailPoster: {width: '38%', maxWidth: 270, aspectRatio: 0.68, borderRadius: 24, backgroundColor: COLORS.panel2},
  detailPosterMobile: {width: '62%', maxWidth: 260},
  detailPosterWide: {maxWidth: 320},
  detailCopy: {flex: 1, width: '100%', alignItems: 'flex-start'},
  detailCopyRTL: {alignItems: 'flex-end'},
  detailMetaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10},
  detailMetaChip: {color: '#ddd', fontSize: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(0,0,0,0.28)', overflow: 'hidden', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6},
  detailActions: {flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 8},
  detailOverview: {color: '#d0cfdb', fontSize: 14, lineHeight: 23, marginTop: 12, marginBottom: 8},
  panelHeading: {color: '#f6f6fb', fontSize: 18, fontWeight: '800', marginBottom: 14},
  metadataGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 16},
  metadataItem: {width: '100%'},
  metadataItemWide: {width: '47%'},
  metadataLabel: {color: '#858594', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase'},
  metadataValue: {color: '#ddd', fontSize: 14, lineHeight: 21, marginTop: 5},
  detailEyebrow: {color: '#f87171', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8},
  detailTitle: {color: '#fff', fontSize: 31, lineHeight: 36, fontWeight: '900', marginBottom: 6},
  detailRating: {color: '#fcd34d', fontSize: 20, fontWeight: '800'},
  detailSectionHeading: {marginBottom: 12},
  section: {marginTop: 20, padding: 18, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(16,16,16,0.9)'},
  sourceGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4},
  source: {paddingVertical: 4, paddingHorizontal: 3},
  sourceCard: {minHeight: 104, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.035)', borderRadius: 14, justifyContent: 'center', paddingHorizontal: 11, paddingVertical: 9},
  sourceText: {color: '#f6f6fb', fontSize: 13, fontWeight: '700'},
  sourcePlayButton: {minHeight: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 9, marginTop: 8, paddingHorizontal: 6},
  sourcePlayText: {fontSize: 11, fontWeight: '800'},
  sourceDownloadButton: {minHeight: 30, justifyContent: 'center', marginTop: 2},
  sourceHint: {color: '#aaa', fontSize: 10, fontWeight: '700'},
  seasonRow: {gap: 8, paddingVertical: 4},
  episodeGrid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 8},
  episode: {padding: 10, minWidth: 0},
  episodeNumber: {color: '#f87171', fontSize: 11, fontWeight: '900', marginBottom: 5},
  episodeTitle: {color: COLORS.text, fontSize: 15, fontWeight: '700', minHeight: 38},
  keyPanel: {flex: 1, padding: 24, justifyContent: 'center'},
  modalBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.76)', alignItems: 'center', justifyContent: 'center', padding: 20},
  modalSafeArea: {flex: 1},
  settingsPanel: {width: '100%', maxWidth: 560, maxHeight: '92%', borderWidth: 1, borderRadius: 24, padding: 22},
  settingsOptions: {flexShrink: 1},
  settingsOptionsContent: {paddingBottom: 4},
  settingToggleRow: {minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)'},
  settingToggleText: {flex: 1, color: '#eee', fontSize: 13, fontWeight: '600'},
  hiddenTitlesText: {color: '#aaa6ba', fontSize: 13, lineHeight: 21, marginBottom: 6},
  settingsPanelTV: {maxWidth: 900, padding: 30},
  settingsHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22},
  settingsTitle: {color: '#fff', fontSize: 24, fontWeight: '900'},
  settingsDescription: {color: '#aaa6ba', fontSize: 13, marginTop: 5},
  settingsClose: {width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center'},
  settingsCloseText: {color: '#fff', fontSize: 28, lineHeight: 32},
  settingsSectionTitle: {color: '#aaa6ba', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 10, marginTop: 8},
  languageOptions: {flexDirection: 'row', gap: 10, marginBottom: 14},
  languageOption: {flex: 1, minHeight: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', paddingHorizontal: 14},
  languageText: {color: '#fff', fontSize: 15, fontWeight: '700'},
  themeOptions: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10},
  themeOption: {minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', padding: 9},
  themeSwatch: {width: 38, height: 38, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  themeSwatchBar: {position: 'absolute', width: '100%', height: 5, top: 0},
  themeName: {color: '#fff', fontSize: 13, fontWeight: '700', flexShrink: 1},
  settingsDone: {minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 20},
  settingsDoneText: {color: '#fff', fontSize: 15, fontWeight: '900'},
  playerSafeArea: {flex: 1, backgroundColor: '#000', paddingHorizontal: 18},
  playerHeader: {minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  playerTitle: {color: '#fff', fontSize: 17, fontWeight: '700', flex: 1},
  playerClose: {width: 42, height: 42, borderRadius: 21, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center'},
  playerCloseText: {color: '#fff', fontSize: 28, lineHeight: 32},
  playerVideoArea: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  playerVideo: {width: '100%', height: '100%'},
  playerSeekControls: {minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18},
  playerSeekButton: {minWidth: 132, minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', backgroundColor: '#202020', borderRadius: 28, paddingHorizontal: 16},
  playerSeekFocused: {borderColor: '#fff', borderWidth: 2, backgroundColor: '#353535'},
  playerSeekIcon: {color: '#fff', fontSize: 23, fontWeight: '700'},
  playerSeekText: {color: '#fff', fontSize: 13, fontWeight: '800'},
  playerError: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.65)'},
  playerErrorText: {color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: 24},
});
