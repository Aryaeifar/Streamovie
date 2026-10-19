import React, {useContext} from 'react';
import {Text as NativeText} from 'react-native';
import {SettingsContext} from '../../context/settings';
import {styles} from '../styles';

export function Text(props: React.ComponentProps<typeof NativeText>) {
  const {isPersian} = useContext(SettingsContext);
  const content = React.Children.toArray(props.children).map(child => typeof child === 'string' ? child : React.isValidElement(child) ? String((child.props as {children?: unknown}).children ?? '') : '').join(' ');
  const containsPersian = /[\u0600-\u06FF]/.test(content);
  const textDirection = containsPersian ? styles.defaultRtlText : isPersian ? styles.defaultRtlText : styles.defaultLtrText;
  return <NativeText {...props} style={[textDirection, (containsPersian || isPersian) && styles.persianFont, props.style]} />;
}
