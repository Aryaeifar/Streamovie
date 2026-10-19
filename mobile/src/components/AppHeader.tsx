import React from 'react';
import {Pressable, View} from 'react-native';
import type {AppTab, Locale} from '../types/media';
import type {THEMES} from '../lib/theme';
import {Text} from './ui/Text';
import {SearchFilterBar} from './SearchFilterBar';
import {NavIcon} from './layout/Navigation';
import {Action} from './ui/Button';
import {tr} from '../lib/i18n';
import {styles} from './styles';
import type {Media} from '../types/media';
type Props={selected:Media|null;tab:AppTab;searchDraft:string;isTV:boolean;palette:(typeof THEMES)[keyof typeof THEMES];locale:Locale;isPersian:boolean;onBack:()=>void;onSettings:()=>void;onSearchChange:(value:string)=>void;onSearchSubmit:()=>void;filtersOpen:boolean;onToggleFilters:()=>void;onClearSearch:()=>void};
export function AppHeader({selected,tab,searchDraft,isTV,palette,locale,isPersian,onBack,onSettings,onSearchChange,onSearchSubmit,filtersOpen,onToggleFilters,onClearSearch}:Props) {return <View style={[styles.pageHeader,isTV&&styles.pageHeaderTV]}><View style={[styles.brandRow,isPersian&&styles.rtlRow]}>{selected?<Action label="‹" onPress={onBack}/>:null}<View style={[styles.brandMark,{backgroundColor:palette.accent}]}><Text style={styles.brandMarkText}>S</Text></View><View style={styles.brandCopy}><Text style={styles.brand}>STREAMOVIE</Text><Text style={styles.tagline}>{tr(locale,'Discover something worth watching','چیزی دیدنی برای تماشا پیدا کنید')}</Text></View>{!selected?<Pressable accessibilityRole="button" accessibilityLabel={tr(locale,'Settings','تنظیمات')} onPress={onSettings} style={[styles.headerSettings,{borderColor:`${palette.accent}55`}]}><NavIcon name="settings" color={palette.accent} size={21}/></Pressable>:null}</View>{!selected&&tab!=='Saved'?<View style={isTV&&styles.tvSearchRow}><SearchFilterBar value={searchDraft} placeholder={tr(locale,'Search movies and series','جستجوی فیلم و سریال')} isPersian={isPersian} accent={palette.accent} filtersOpen={filtersOpen} onChange={onSearchChange} onSubmit={onSearchSubmit} onToggleFilters={onToggleFilters} onClear={onClearSearch}/></View>:null}</View>;}
