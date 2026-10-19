import React, {useContext, useState} from 'react';
import {ActivityIndicator, FlatList, Image, Linking, Platform, Pressable, ScrollView, View} from 'react-native';
import type {AppTab, Media, NavIconName, Locale, Season, Source} from '../types/media';
import {SettingsContext} from '../context/settings';
import {THEMES} from '../lib/theme';
import {tr} from '../lib/i18n';
import {asText, sourcesFrom, parseDescription} from '../lib/media-format';
import {Text} from './ui/Text';
import {Action} from './ui/Button';
import {SearchFilterBar} from './SearchFilterBar';
import {styles} from './styles';
const NAV_ICONS: Record<NavIconName, number> = {
 home: require('../../assets/nav-icons/home.png'), movies: require('../../assets/nav-icons/movies.png'), series: require('../../assets/nav-icons/series.png'), trending: require('../../assets/nav-icons/trending.png'), saved: require('../../assets/nav-icons/saved.png'), search: require('../../assets/nav-icons/search.png'), top: require('../../assets/nav-icons/top.png'), settings: require('../../assets/nav-icons/settings.png'), play: require('../../assets/nav-icons/play.png'),
};
export function Spotlight({item, onPress, isTV}: {item: Media; onPress: () => void; isTV: boolean}) {
  const {locale, theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [focused, setFocused] = useState(false);
  return <Pressable onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.spotlight, !isTV && styles.spotlightMobile, isTV && styles.spotlightTV, focused && styles.spotlightFocused]}>
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

export function MediaRail({title, subtitle, items, width, isTV = false, landscape = false, onSelect}: {title: string; subtitle?: string; items: Media[]; width: number; isTV?: boolean; landscape?: boolean; onSelect: (item: Media) => void}) {
  const {locale, isPersian} = useContext(SettingsContext);
  const localizedTitle: Record<string, string> = {'Movies': 'فیلم‌ها', 'Series': 'سریال‌ها', 'Top rated movies': 'فیلم‌های برتر', 'Top rated series': 'سریال‌های برتر', 'IMDb Top 250 movies': '۲۵۰ فیلم برتر IMDb', 'IMDb Top 250 series': '۲۵۰ سریال برتر IMDb'};
  const localizedSubtitle: Record<string, string> = {'Popular picks for your next movie night': 'پیشنهادهایی برای تماشای فیلم', 'Find your next series': 'سریال بعدی خود را پیدا کنید'};
  const cardWidth = isTV ? Math.min(Math.max(width * 0.21, 190), 290) : Math.min(width * (width >= 620 ? 0.29 : 0.46), width >= 620 ? 240 : 210);
  const tileWidth = landscape ? cardWidth * 1.35 : cardWidth;
  if (!items.length) return null;
  return <View style={styles.rail}>
    <View style={[styles.railHeading, isPersian && styles.rtlRow]}>
      <View style={[styles.railHeadingCopy, isPersian && styles.rtlAlign]}><Text style={[styles.railTitle, isPersian && styles.rtlText]}>{locale === 'fa' ? localizedTitle[title] ?? title : title}</Text>{subtitle ? <Text style={[styles.railSubtitle, isPersian && styles.rtlText]}>{locale === 'fa' ? localizedSubtitle[subtitle] ?? subtitle : subtitle}</Text> : null}</View>
      <Text style={[styles.railMore, isPersian && styles.rtlText]}>{tr(locale, 'SEE ALL  ›', 'مشاهده همه  ‹')}</Text>
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

export function TVNavigation({selected, onSelect, onSettings, accent, locale, showTop250Movies, showTop250Series}: {selected: AppTab; onSelect: (tab: AppTab) => void; onSettings: () => void; accent: string; locale: Locale; showTop250Movies: boolean; showTop250Series: boolean}) {
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

export function AppHeader({selected, tab, searchDraft, isTV, palette, locale, isPersian, onBack, onSettings, onSearchChange, onSearchSubmit, filtersOpen, onToggleFilters, onClearSearch}: {selected: Media | null; tab: AppTab; searchDraft: string; isTV: boolean; palette: (typeof THEMES)[keyof typeof THEMES]; locale: Locale; isPersian: boolean; onBack: () => void; onSettings: () => void; onSearchChange: (value: string) => void; onSearchSubmit: () => void; filtersOpen: boolean; onToggleFilters: () => void; onClearSearch: () => void}) {
  return <View style={[styles.pageHeader, isTV && styles.pageHeaderTV]}><View style={[styles.brandRow, isPersian && styles.rtlRow]}>{selected ? <Action label="‹" onPress={onBack}/> : null}<View style={[styles.brandMark, {backgroundColor: palette.accent}]}><Text style={styles.brandMarkText}>S</Text></View><View style={styles.brandCopy}><Text style={styles.brand}>STREAMOVIE</Text><Text style={styles.tagline}>{tr(locale, 'Discover something worth watching', 'چیزی دیدنی برای تماشا پیدا کنید')}</Text></View>{!selected ? <Pressable accessibilityRole="button" accessibilityLabel={tr(locale, 'Settings', 'تنظیمات')} onPress={onSettings} style={[styles.headerSettings,{borderColor:`${palette.accent}55`}]}><NavIcon name="settings" color={palette.accent} size={21}/></Pressable> : null}</View>{!selected && tab !== 'Saved' ? <View style={isTV && styles.tvSearchRow}><SearchFilterBar value={searchDraft} placeholder={tr(locale,'Search movies and series','جستجوی فیلم و سریال')} isPersian={isPersian} accent={palette.accent} filtersOpen={filtersOpen} onChange={onSearchChange} onSubmit={onSearchSubmit} onToggleFilters={onToggleFilters} onClear={onClearSearch}/></View> : null}</View>;
}

export function NavIcon({name, color, size}: {name: NavIconName; color: string; size: number}) {
  return <Image source={NAV_ICONS[name]} resizeMode="contain" style={{width: size, height: size, tintColor: color}} />;
}

function TVNavigationItem({item, selected, onSelect}: {item: {name: AppTab | 'Search'; icon: NavIconName}; selected: boolean; onSelect: () => void}) {
  const [focused, setFocused] = useState(false);
  return <Pressable onPress={onSelect} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.tvNavigationItem, selected && styles.tvNavigationSelected, focused && styles.tvNavigationFocused]}>
    <NavIcon name={item.icon} color={selected || focused ? '#fff' : '#888'} size={23} />
  </Pressable>;
}

export const MediaCard = React.memo(function MediaCard({item, isTV = false, landscape = false, onPress}: {item: Media; isTV?: boolean; landscape?: boolean; onPress: () => void}) {
  const [focused, setFocused] = useState(false);
  return <Pressable onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.card, isTV && styles.cardTV, landscape && styles.cardLandscape, focused && styles.cardFocused]}>
    <View style={[styles.posterFrame, landscape && styles.landscapeFrame]}>{item.image ? <Image source={{uri: landscape ? item.backdrop || item.image : item.image}} resizeMode="cover" style={[styles.poster, landscape && styles.landscapePoster]} /> : <View style={[styles.poster, styles.posterPlaceholder]}><Text style={styles.body}>No artwork</Text></View>}
      {item.rating ? <Text style={styles.posterRating}>★ {item.rating}</Text> : null}
    </View>
    <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
    <Text style={styles.meta}>{[item.year, item.rating ? `★ ${item.rating}` : ''].filter(Boolean).join(' · ')}</Text>
  </Pressable>;
}, (previous, next) => previous.item === next.item && previous.isTV === next.isTV && previous.landscape === next.landscape);

export function Detail({item, isSaved, onSave, seasons, seasonIndex, onSeason, isTV, isWide, onWatch}: {
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

export function SourceGrid({sources, columns, title, onWatch}: {sources: Source[]; columns: number; title: string; onWatch: (source: Source, title: string) => void}) {
  const {locale} = useContext(SettingsContext);
  if (!sources.length) return <Text style={[styles.meta, locale === 'fa' && styles.rtlText]}>{tr(locale, 'No download links available.', 'لینک دانلودی موجود نیست.')}</Text>;
  return <View style={styles.sourceGrid}>{sources.map((source, index) => <SourceButton key={`${source.url}-${index}`} source={source} columns={columns} title={title} onWatch={onWatch} />)}</View>;
}

export function SourceButton({source, columns, title, onWatch}: {source: Source; columns: number; title: string; onWatch: (source: Source, title: string) => void}) {
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

export function SiteFooter({onNavigate}: {onNavigate: (tab: AppTab) => void}) {
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
