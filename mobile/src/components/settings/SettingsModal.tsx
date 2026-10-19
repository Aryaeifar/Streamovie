import React from 'react';
import {Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, View} from 'react-native';
import {Text} from '../ui/Text';
import type {Locale, ThemeId} from '../../types/media';
import {THEMES} from '../../lib/theme';
import {tr} from '../../lib/i18n';
import {styles} from '../styles';

type Props = {visible: boolean; locale: Locale; theme: ThemeId; isTV: boolean; showTop250Movies: boolean; showTop250Series: boolean; onClose: () => void; onLocale: (value: Locale) => void; onTheme: (value: ThemeId) => void; onShowTop250Movies: (value: boolean) => void; onShowTop250Series: (value: boolean) => void};
export function SettingsModal({visible, locale, theme, isTV, showTop250Movies, showTop250Series, onClose, onLocale, onTheme, onShowTop250Movies, onShowTop250Series}: Props) {
  const accent=THEMES[theme].accent; const themeIds=Object.keys(THEMES) as ThemeId[];
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><SafeAreaView style={styles.modalSafeArea}><View style={[styles.modalBackdrop,{direction:locale==='fa'?'rtl':'ltr'}]}><View style={[styles.settingsPanel,isTV&&styles.settingsPanelTV,{backgroundColor:THEMES[theme].panel,borderColor:`${accent}55`}]}>
    <View style={[styles.settingsHeader,locale==='fa'&&styles.rtlRow]}><View><Text style={[styles.settingsTitle,locale==='fa'&&styles.rtlText]}>{tr(locale,'Settings','تنظیمات')}</Text><Text style={[styles.settingsDescription,locale==='fa'&&styles.rtlText]}>{tr(locale,'Personalize your Streamovie app','اپلیکیشن استریمووی را شخصی‌سازی کنید')}</Text></View><Pressable accessibilityRole="button" onPress={onClose} style={styles.settingsClose}><Text style={styles.settingsCloseText}>×</Text></Pressable></View>
    <ScrollView style={styles.settingsOptions} contentContainerStyle={styles.settingsOptionsContent} showsVerticalScrollIndicator={false}>
      <SettingHeading locale={locale} en="Theme" fa="پوسته"/><View style={styles.themeOptions}>{themeIds.map(id=><Pressable key={id} accessibilityRole="button" onPress={()=>onTheme(id)} style={[styles.themeOption,{width:`${isTV?32:48}%`},theme===id&&{borderColor:THEMES[id].accent}]}><View style={[styles.themeSwatch,{backgroundColor:THEMES[id].bg,borderColor:THEMES[id].accent}]}><View style={[styles.themeSwatchBar,{backgroundColor:THEMES[id].accent}]}/><Text style={{color:'#fff',fontSize:12,fontWeight:'900'}}>S</Text></View><Text style={[styles.themeName,locale==='fa'&&styles.rtlText]}>{tr(locale,THEMES[id].label,({netflix:'نتفلیکس',midnight:'نیمه‌شب',aurora:'شفق قطبی',ocean:'اقیانوس',sunset:'غروب',candy:'آبنباتی',noir:'نوآر'} as Record<ThemeId,string>)[id])}{theme===id?'  ✓':''}</Text></Pressable>)}</View>
      <SettingHeading locale={locale} en="Home sections" fa="بخش‌های صفحه اصلی"/><SettingsToggle label={tr(locale,'Show IMDb Top 250 movies','نمایش ۲۵۰ فیلم برتر IMDb')} value={showTop250Movies} locale={locale} accent={accent} onChange={onShowTop250Movies}/><SettingsToggle label={tr(locale,'Show IMDb Top 250 series','نمایش ۲۵۰ سریال برتر IMDb')} value={showTop250Series} locale={locale} accent={accent} onChange={onShowTop250Series}/>
    </ScrollView><Pressable accessibilityRole="button" onPress={onClose} style={[styles.settingsDone,{backgroundColor:accent}]}><Text style={styles.settingsDoneText}>{tr(locale,'Done','انجام شد')}</Text></Pressable>
  </View></View></SafeAreaView></Modal>;
}
function SettingHeading({locale,en,fa}:{locale:Locale;en:string;fa:string}) {return <Text style={[styles.settingsSectionTitle,locale==='fa'&&styles.rtlText]}>{tr(locale,en,fa)}</Text>;}
function SettingsToggle({label,value,locale,accent,onChange}:{label:string;value:boolean;locale:Locale;accent:string;onChange:(value:boolean)=>void}) {return <View style={[styles.settingToggleRow,locale==='fa'&&styles.rtlRow]}><Text style={[styles.settingToggleText,locale==='fa'&&styles.rtlText]}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{false:'#383838',true:`${accent}99`}} thumbColor={value?accent:'#aaa'} accessibilityLabel={label}/></View>;}
