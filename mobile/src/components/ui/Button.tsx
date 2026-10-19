import React, {useContext, useState} from 'react';
import {Pressable} from 'react-native';
import {SettingsContext} from '../../context/settings';
import {THEMES} from '../../lib/theme';
import {Text} from './Text';
import {styles} from '../styles';
export function Action({label, onPress, active = false}: {label: string; onPress: () => void; active?: boolean}) {
  const {theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.action, active && {backgroundColor: accent, borderColor: accent}, focused && styles.focused]}><Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text></Pressable>;
}
