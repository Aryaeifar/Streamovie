import React from 'react';
import {View} from 'react-native';
import type {Locale, ThemeId} from '../../types/media';
import {THEMES} from '../../lib/theme';
import {tr} from '../../lib/i18n';
import {Text} from './Text';
import {styles} from '../styles';
type Props = {palette: (typeof THEMES)[ThemeId]; locale: Locale; sectionTitle: string; sectionSubtitle: string; count: number};
export function CatalogIntro({palette,locale,sectionTitle,sectionSubtitle,count}: Props) {const persian=locale==='fa';return <View style={[styles.listIntro,{backgroundColor:`${palette.panel}cc`}]}><View style={[styles.listTitleRow,persian&&styles.rtlRow]}><View style={styles.listTitleCopy}><Text style={[styles.sectionTitle,persian&&styles.rtlText]}>{sectionTitle}</Text><Text style={[styles.listSubtitle,persian&&styles.rtlText]}>{sectionSubtitle}</Text></View><Text style={[styles.resultCount,persian&&styles.rtlText]}>{tr(locale,`${count} TITLES`,`${count} عنوان`)}</Text></View></View>;}
