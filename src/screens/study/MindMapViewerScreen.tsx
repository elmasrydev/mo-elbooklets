import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SvgXml } from 'react-native-svg';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { LoadStatus, svgLoadStatus, useRemoteSvg } from '../../hooks/useRemoteSvg';
import { resolveMindMapKind } from '../../utils/mindMap';

/**
 * Fullscreen, zoomable mind map (BKLT-174).
 *
 * A screen of its own rather than a `Modal` inside the reader, for one reason:
 * orientation. It is registered with `orientation: 'landscape'`, so
 * react-native-screens rotates the app when it appears and rotates it back
 * when it is popped — by close button, swipe or Android back alike — while
 * every other screen declares `portrait_up`. No orientation lock is called
 * from JS any more; the previous Modal-plus-`lockAsync` design issued locks
 * while the modal was still animating and raced a second request from the
 * presentation machinery, which is why the app sometimes stayed sideways.
 *
 * The generated canvas is ~2:1, so landscape gives the map the long edge of the
 * screen before any pinch-zoom. SVG stays sharp at any scale, which is the
 * whole reason the backend switched to it, so the viewer allows a genuinely
 * useful zoom rather than a blurry one.
 *
 * An SVG comes from `useRemoteSvg`, which the inline preview already filled —
 * opening is a cache hit, not a second download.
 */

const MAX_SCALE = 5;
const MIN_SCALE = 1;

type MindMapViewerParams = { url: string; mimeType?: string | null };
type MindMapViewerRoute = RouteProp<{ MindMapViewer: MindMapViewerParams }, 'MindMapViewer'>;

const MindMapViewerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { url, mimeType } = useRoute<MindMapViewerRoute>().params;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const isSvg = resolveMindMapKind(url, mimeType) === 'svg';
  const svg = useRemoteSvg(isSvg ? url : null);
  const [svgUnparseable, setSvgUnparseable] = useState(false);
  const [rasterStatus, setRasterStatus] = useState<LoadStatus>('loading');
  const [rasterAttempt, setRasterAttempt] = useState(0);

  const status: LoadStatus = isSvg ? svgLoadStatus(svg.status, svgUnparseable) : rasterStatus;

  const retry = () => {
    if (isSvg) {
      setSvgUnparseable(false);
      svg.retry();
    } else {
      setRasterStatus('loading');
      setRasterAttempt((n) => n + 1);
    }
  };

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Snapping back to centre at 1x keeps the map from drifting off screen.
      if (scale.value <= MIN_SCALE) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      // Panning only makes sense once zoomed in.
      if (scale.value <= MIN_SCALE) return;
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scale.value > MIN_SCALE ? MIN_SCALE : 2.5;
      scale.value = withTiming(next);
      savedScale.value = next;
      if (next === MIN_SCALE) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  // Memoised: RNGH re-attaches handlers when the gesture object identity changes.
  const composed = useMemo(
    () => Gesture.Simultaneous(pinch, pan, doubleTap),
    [pinch, pan, doubleTap],
  );

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const closeStyle = {
    top: Math.max(insets.top, 12),
    right: Math.max(insets.right, 12) + 8,
  };

  return (
    // Its own gesture root: a fullScreenModal screen on Android is hosted
    // outside the app's root handler view, and pinch/pan must still receive
    // touches there.
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.backdrop} testID="study-mindmap-viewer">
        {status === 'error' ? (
          <TouchableOpacity
            style={styles.errorCard}
            onPress={retry}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('study_lesson.mind_map_error')}
            testID="study-mindmap-viewer-retry"
          >
            <Ionicons name="git-network-outline" size={32} color="#FFFFFF" />
            <Text style={[typography('body'), styles.errorText]}>
              {t('study_lesson.mind_map_error')}
            </Text>
            <View style={styles.retryRow}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={[typography('caption'), fontWeight('600'), styles.errorText]}>
                {t('common.retry')}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <GestureDetector gesture={composed}>
            {/* Full-bleed: in landscape the map's 2:1 ratio nearly matches the
                screen, so any inset is wasted map. */}
            <Animated.View style={[styles.canvas, zoomStyle]}>
              {isSvg ? (
                svg.xml && (
                  <SvgXml
                    xml={svg.xml}
                    width="100%"
                    height="100%"
                    onError={() => setSvgUnparseable(true)}
                  />
                )
              ) : (
                <Image
                  key={rasterAttempt}
                  source={{ uri: url }}
                  style={styles.fill}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  onLoad={() => setRasterStatus('loaded')}
                  onError={() => setRasterStatus('error')}
                />
              )}
            </Animated.View>
          </GestureDetector>
        )}

        {status === 'loading' && (
          <View style={styles.spinner} pointerEvents="none">
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        <TouchableOpacity
          style={[styles.close, closeStyle, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          testID="study-mindmap-viewer-close"
        >
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  spinner: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  close: {
    position: 'absolute',
    zIndex: 10,
    elevation: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default MindMapViewerScreen;
