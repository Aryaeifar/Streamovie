import React, {useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import type {Locale} from '../../types/media';
import {Text} from './Text';
import {styles} from '../styles';

export function LoadingState({
  accent,
  large = false,
}: {
  accent: string;
  large?: boolean;
}) {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={accent} size={large ? 'large' : 'small'} />
    </View>
  );
}

export function LoadingMore({accent}: {accent: string}) {
  return <ActivityIndicator color={accent} style={styles.loader} />;
}

export function LoadingOverlay({
  accent,
  visible,
}: {
  accent: string;
  visible: boolean;
}) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, visible]);

  if (!visible) return null;
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {backgroundColor: 'rgba(7, 9, 13, 0.45)'},
        ]}
      />
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <View
          style={{
            padding: 18,
            borderRadius: 22,
            backgroundColor: 'rgba(18, 22, 31, 0.92)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
          }}>
          <Animated.View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.14)',
              borderTopColor: accent,
              transform: [{rotate}],
            }}
          />
        </View>
      </View>
    </View>
  );
}

export function EmptyState({
  message,
}: {
  message: string;
  locale: Locale;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

export function ErrorMessage({message}: {message: string}) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: 'rgba(251, 113, 133, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(251, 113, 133, 0.28)',
      }}>
      <Text style={{color: '#fb7185', fontSize: 12.5, fontWeight: '600'}}>
        {message}
      </Text>
    </View>
  );
}
