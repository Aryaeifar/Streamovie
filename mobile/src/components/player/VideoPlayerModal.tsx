import React, {useEffect, useRef, useState} from 'react';
import {Modal, Pressable, SafeAreaView, View} from 'react-native';
import {Text} from '../ui/Text';
import Video, {type VideoRef} from 'react-native-video';
import type {Locale, Source} from '../../types/media';
import {tr} from '../../lib/i18n';
import {styles} from '../styles';

export function VideoPlayerModal({item, locale, isTV, onClose}: {item: {source: Source; title: string} | null; locale: Locale; isTV: boolean; onClose: () => void}) {
  const videoRef = useRef<VideoRef>(null); const [failed, setFailed] = useState(false); const [focusedSeek, setFocusedSeek] = useState<'back'|'forward'|null>(null);
  useEffect(() => {setFailed(false);}, [item?.source.url]);
  const seekBy = async (seconds: number) => {const video = videoRef.current; if (!video) return; const position = await video.getCurrentPosition().catch(() => 0); video.seek(Math.max(0, position + seconds));};
  return <Modal visible={!!item} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}><SafeAreaView style={[styles.playerSafeArea, {direction: locale === 'fa' ? 'rtl':'ltr'}]}>
    <View style={[styles.playerHeader, locale === 'fa' && styles.rtlRow]}><Text numberOfLines={1} style={[styles.playerTitle, locale === 'fa' && styles.rtlText]}>{item?.title ?? ''}</Text><Pressable accessibilityRole="button" accessibilityLabel={tr(locale, 'Close player', 'بستن پخش‌کننده')} onPress={onClose} style={styles.playerClose}><Text style={styles.playerCloseText}>×</Text></Pressable></View>
    <View style={styles.playerVideoArea}>{item ? <Video ref={videoRef} key={item.source.url} source={{uri: item.source.url}} controls paused={false} resizeMode="contain" style={styles.playerVideo} onLoad={() => setFailed(false)} onError={(error) => { console.warn("Video playback error", error); setFailed(true); }} /> : null}{failed ? <View pointerEvents="none" style={styles.playerError}><Text style={[styles.playerErrorText, locale === 'fa' && styles.rtlText]}>{tr(locale, 'This video could not be played.', 'پخش این ویدیو ممکن نیست.')}</Text></View> : null}</View>
    {isTV ? <View style={styles.playerSeekControls}>{(['back','forward'] as const).map(direction => <Pressable key={direction} focusable accessibilityRole="button" accessibilityLabel={tr(locale, direction === 'back' ? 'Back 10 seconds':'Forward 10 seconds', direction === 'back' ? '۱۰ ثانیه به عقب':'۱۰ ثانیه به جلو')} onFocus={() => setFocusedSeek(direction)} onBlur={() => setFocusedSeek(null)} onPress={() => {void seekBy(direction === 'back' ? -10:10);}} style={[styles.playerSeekButton, focusedSeek === direction && styles.playerSeekFocused]}><Text style={styles.playerSeekIcon}>{direction === 'back'?'↶':'↷'}</Text><Text style={styles.playerSeekText}>{tr(locale, '10 sec', '۱۰ ثانیه')}</Text></Pressable>)}</View>:null}
  </SafeAreaView></Modal>;
}
function videoType(url: string): 'm3u8'|'mpd'|'mp4'|undefined {const path=url.split(/[?#]/,1)[0].toLowerCase(); if(path.endsWith('.m3u8'))return'm3u8';if(path.endsWith('.mpd'))return'mpd';if(path.endsWith('.mp4')||path.endsWith('.m4v'))return'mp4';return undefined;}
