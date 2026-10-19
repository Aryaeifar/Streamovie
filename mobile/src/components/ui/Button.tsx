import React, {useContext, useState} from 'react';
import {Pressable} from 'react-native';
import {SettingsContext} from '../../context/settings';
import {THEMES} from '../../lib/theme';
import {Text} from './Text';
import {styles} from '../styles';

export function Action({
  label,
  onPress,
  active = false,
  subtle = false,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  subtle?: boolean;
}) {
  const {theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.action,
        subtle && {backgroundColor: 'rgba(255,255,255,0.04)'},
        active && styles.actionActive,
        focused && [styles.focused, {borderColor: accent}],
      ]}>
      <Text style={[styles.actionText, active && styles.actionTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}
