import React from 'react';
import {Text as NativeText} from 'react-native';
import {styles} from '../styles';

export function Text(props: React.ComponentProps<typeof NativeText>) {
  return <NativeText {...props} style={[styles.defaultLtrText, props.style]} />;
}
