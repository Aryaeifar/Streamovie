import {ActivityIndicator, StyleSheet, View} from 'react-native';
import type {Locale} from '../../types/media';
import {Text} from './Text';
import {styles} from '../styles';
export function LoadingState({accent,large=false}:{accent:string;large?:boolean}) {return <View style={styles.empty}><ActivityIndicator color={accent} size={large?'large':'small'}/></View>;}
export function LoadingMore({accent}:{accent:string}) {return <ActivityIndicator color={accent} style={styles.loader}/>;}
export function LoadingOverlay({accent,visible}:{accent:string;visible:boolean}) {if(!visible)return null;return <View style={StyleSheet.absoluteFillObject} pointerEvents="none"><View style={[StyleSheet.absoluteFillObject,{backgroundColor:'rgba(0,0,0,0.45)'}]}/><View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={accent} size="large"/></View></View>;}
export function EmptyState({message,locale}:{message:string;locale:Locale}) {return <View style={styles.empty}><Text style={[styles.body,locale==='fa'&&styles.rtlText]}>{message}</Text></View>;}
export function ErrorMessage({message}:{message:string}) {return <Text style={styles.errorText}>{message}</Text>;}
