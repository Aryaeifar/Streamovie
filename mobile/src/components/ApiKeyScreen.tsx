import React from 'react';
import {TextInput, View} from 'react-native';
import type {Locale} from '../types/media';
import type {THEMES} from '../lib/theme';
import {Text} from './ui/Text';
import {Action} from './ui/Button';
import {tr} from '../lib/i18n';
import {styles} from './styles';
type Props={locale:Locale;isPersian:boolean;palette:(typeof THEMES)[keyof typeof THEMES];keyInput:string;onChangeKey:(value:string)=>void;onSubmit:()=>void};
export function ApiKeyScreen({locale,isPersian,palette,keyInput,onChangeKey,onSubmit}:Props) {return <View style={[styles.safe,{backgroundColor:palette.bg,direction:isPersian?'rtl':'ltr'}]}><View style={styles.keyPanel}><Text style={styles.brand}>STREAMOVIE</Text><Text style={[styles.sectionTitle,isPersian&&styles.rtlText]}>{tr(locale,'Connect your catalog','اتصال به فهرست فیلم‌ها')}</Text><Text style={[styles.body,isPersian&&styles.rtlText]}>{tr(locale,'Enter your Streamovie API key to load movies and series. The key is stored on this device and sent to the catalog API.','برای بارگذاری فیلم‌ها و سریال‌ها، کلید API استریمووی را وارد کنید. کلید روی همین دستگاه ذخیره می‌شود.')}</Text><TextInput value={keyInput} onChangeText={onChangeKey} placeholder="Catalog API key" placeholderTextColor="#aaa6ba" autoCapitalize="none" autoCorrect={false} secureTextEntry style={[styles.searchInput,styles.ltrInput]}/><Action label={tr(locale,'Continue','ادامه')} active onPress={onSubmit}/></View></View>;}
