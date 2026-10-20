import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import type {Locale} from '../../types/media';
import {Text} from './Text';
import {styles} from '../styles';

function LoaderDot({size, color, style}: {size: number; color: string; style: any}) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function StreamovieLoader({color}: {color: string}) {
  const spinOuter = useRef(new Animated.Value(0)).current;
  const spinInner = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const outerLoop = Animated.loop(
      Animated.timing(spinOuter, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    const innerLoop = Animated.loop(
      Animated.timing(spinInner, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    outerLoop.start();
    innerLoop.start();
    return () => {
      outerLoop.stop();
      innerLoop.stop();
    };
  }, [spinInner, spinOuter]);

  const rotateOuter = spinOuter.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const rotateInner = spinInner.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={{width: 50, height: 50}}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{rotate: rotateOuter}],
        }}>
        <LoaderDot size={12} color={color} style={{top: 0, left: '50%', marginLeft: -6}} />
        <LoaderDot size={12} color={color} style={{bottom: 0, left: '50%', marginLeft: -6}} />
        <LoaderDot size={12} color={color} style={{top: '50%', right: 0, marginTop: -6}} />
        <LoaderDot size={12} color={color} style={{top: '50%', left: 0, marginTop: -6}} />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          right: 4,
          bottom: 4,
          transform: [{rotate: rotateInner}],
        }}>
        <LoaderDot size={8} color={color} style={{top: 0, left: '50%', marginLeft: -4}} />
        <LoaderDot size={8} color={color} style={{bottom: 0, left: '50%', marginLeft: -4}} />
        <LoaderDot size={8} color={color} style={{top: '50%', right: 0, marginTop: -4}} />
        <LoaderDot size={8} color={color} style={{top: '50%', left: 0, marginTop: -4}} />
      </Animated.View>
    </View>
  );
}

export function LoadingState({
  accent,
  large = false,
}: {
  accent: string;
  large?: boolean;
}) {
  return (
    <View style={styles.empty}>
      <StreamovieLoader color={accent} />
    </View>
  );
}

export function LoadingMore({accent}: {accent: string}) {
  return (
    <View style={{paddingVertical: 16, alignItems: 'center'}}>
      <StreamovieLoader color={accent} />
    </View>
  );
}

export function LoadingOverlay({
  accent,
  visible,
}: {
  accent: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="auto">
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {backgroundColor: 'rgba(7, 9, 13, 0.62)'},
        ]}
      />
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <View
          style={{
            padding: 20,
            borderRadius: 24,
            backgroundColor: 'rgba(18, 22, 31, 0.94)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.14)',
          }}>
          <StreamovieLoader color={accent} />
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
