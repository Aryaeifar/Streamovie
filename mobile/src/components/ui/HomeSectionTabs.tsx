import React from 'react';
import {Pressable, View} from 'react-native';
import type {Locale} from '../../types/media';
import {Text} from './Text';
import {tr} from '../../lib/i18n';
import {styles} from '../styles';
type Props={locale:Locale;showTop250Movies:boolean;showTop250Series:boolean;sectionY:React.MutableRefObject<Record<string,number>>;scrollRef:React.RefObject<any>};
export function HomeSectionTabs({locale,showTop250Movies,showTop250Series,sectionY,scrollRef}:Props){const tabs:[string,string][]=[[tr(locale,'Featured','ویژه'),'featured'],[tr(locale,'Movies','فیلم‌ها'),'movies'],[tr(locale,'Series','سریال‌ها'),'series']];if(showTop250Movies)tabs.push([tr(locale,'Top 250 Movies','۲۵۰ فیلم برتر'),'topMovies']);if(showTop250Series)tabs.push([tr(locale,'Top 250 Series','۲۵۰ سریال برتر'),'topSeries']);return <View style={[styles.homeSectionTabs,locale==='fa'&&styles.rtlRow]}>{tabs.map(([label,target],index)=><Pressable key={target} onPress={()=>scrollRef.current?.scrollTo({y:sectionY.current[target]??0,animated:true})} style={[styles.homeSectionTab,index===0&&styles.homeSectionTabActive]}><Text style={[styles.homeSectionTabText,index===0&&styles.homeSectionTabTextActive]}>{label}</Text></Pressable>)}</View>;}
