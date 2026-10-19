import React, {useContext, useEffect, useRef, useState} from 'react';
import {Linking, Modal, Pressable, SafeAreaView, View} from 'react-native';
import {Text} from '../ui/Text';
import Video, {type VideoRef} from 'react-native-video';
import type {Locale, Source} from '../../types/media';
import {SettingsContext} from '../../context/settings';
import {THEMES} from '../../lib/theme';
import {styles} from '../styles';

export function VideoPlayerModal({
  item,
  onClose,
}: {
  item: {source: Source; title: string} | null;
  locale: Locale;
  isTV: boolean;
  onClose: () => void;
}) {
  const {theme} = useContext(SettingsContext);
  const accent = THEMES[theme].accent;
  const videoRef = useRef<VideoRef>(null);
  const [failed, setFailed] = useState(false);
  const [focusedSeek, setFocusedSeek] = useState<
    'back' | 'forward' | 'external' | null
  >(null);

  useEffect(() => {
    setFailed(false);
  }, [item?.source.url]);

  const seekBy = async (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const position = await video.getCurrentPosition().catch(() => 0);
    video.seek(Math.max(0, position + seconds));
  };

  return (
    <Modal
      visible={!!item}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.playerSafeArea}>
        <View style={styles.playerHeader}>
          <Text numberOfLines={1} style={styles.playerTitle}>
            {item?.title ?? ''}
          </Text>
          {item?.source.quality ? (
            <View style={styles.playerQualityBadge}>
              <Text style={styles.playerQualityText}>
                {item.source.quality}
              </Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close player"
            onPress={onClose}
            style={styles.playerClose}>
            <Text style={styles.playerCloseText}>×</Text>
          </Pressable>
        </View>

        <View style={styles.playerVideoArea}>
          {item ? (
            <Video
              ref={videoRef}
              key={item.source.url}
              source={{uri: item.source.url}}
              controls
              paused={false}
              resizeMode="contain"
              style={styles.playerVideo}
              onLoad={() => setFailed(false)}
              onError={error => {
                console.warn('Video playback error', error);
                setFailed(true);
              }}
            />
          ) : null}
          {failed && item ? (
            <View style={styles.playerError}>
              <Text style={styles.playerErrorText}>
                This stream could not be decoded in the built-in player.
              </Text>
              <Pressable
                onPress={() => {
                  void Linking.openURL(item.source.url);
                }}
                style={styles.spotlightWhitePillBtn}>
                <Text style={styles.spotlightWhitePillBtnText}>
                  Open in External Player
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.playerSeekControls}>
          {(['back', 'forward'] as const).map(direction => (
            <Pressable
              key={direction}
              focusable
              accessibilityRole="button"
              accessibilityLabel={
                direction === 'back' ? 'Back 10 seconds' : 'Forward 10 seconds'
              }
              onFocus={() => setFocusedSeek(direction)}
              onBlur={() => setFocusedSeek(null)}
              onPress={() => {
                void seekBy(direction === 'back' ? -10 : 10);
              }}
              style={[
                styles.playerSeekButton,
                focusedSeek === direction && [
                  styles.playerSeekFocused,
                  {borderColor: accent},
                ],
              ]}>
              <Text style={styles.playerSeekIcon}>
                {direction === 'back' ? '↶' : '↷'}
              </Text>
              <Text style={styles.playerSeekText}>10s</Text>
            </Pressable>
          ))}
          {item ? (
            <Pressable
              focusable
              accessibilityRole="button"
              onFocus={() => setFocusedSeek('external')}
              onBlur={() => setFocusedSeek(null)}
              onPress={() => {
                void Linking.openURL(item.source.url);
              }}
              style={[
                styles.playerSeekButton,
                focusedSeek === 'external' && [
                  styles.playerSeekFocused,
                  {borderColor: accent},
                ],
              ]}>
              <Text style={styles.playerSeekText}>External Player</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
