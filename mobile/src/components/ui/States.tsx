import {ActivityIndicator, Animated, Easing, StyleSheet, View} from 'react-native';
import {useEffect, useRef} from 'react';
import type {Locale} from '../../types/media';
import {Text} from './Text';
import {styles} from '../styles';
export function LoadingState({accent,large=false}:{accent:string;large?:boolean}) {return <View style={styles.empty}><ActivityIndicator color={accent} size={large?'large':'small'}/></View>;}
export function LoadingMore({accent}:{accent:string}) {return <ActivityIndicator color={accent} style={styles.loader}/>;}
export function LoadingOverlay({accent,visible}:{accent:string;visible:boolean}) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(Animated.timing(spin, {toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true}));
    loop.start();
    return () => loop.stop();
  }, [spin, visible]);
  if (!visible) return null;
  const rotate = spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
  return <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <View style={[StyleSheet.absoluteFillObject, {backgroundColor: 'rgba(0,0,0,0.65)'}]} />
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Animated.View style={{width: 56, height: 56, borderRadius: 28, borderWidth: 4, borderColor: 'rgba(255,255,255,0.18)', borderTopColor: accent, transform: [{rotate}]}} />
    </View>
  </View>;
}
export function EmptyState({message,locale}:{message:string;locale:Locale}) {return <View style={styles.empty}><Text style={[styles.body,locale==='fa'&&styles.rtlText]}>{message}</Text></View>;}
export function ErrorMessage({message}:{message:string}) {return <Text style={styles.errorText}>{message}</Text>;}
