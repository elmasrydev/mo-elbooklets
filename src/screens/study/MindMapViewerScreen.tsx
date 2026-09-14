import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../config/colors';
import { spacing } from '../../config/spacing';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { combinedLoadStatus, LoadStatus, useRemoteSvg } from '../../hooks/useRemoteSvg';
import { resolveMindMapKind } from '../../utils/mindMap';
import { svgDocument } from '../../utils/mindMapHtml';
import MindMapWebView from '../../components/study/MindMapWebView';

/**
 * Fullscreen, zoomable mind map (BKLT-174).
 *
 * A screen of its own rather than a `Modal` inside the reader, for one reason:
 * orientation. It is registered with `orientation: 'landscape'`, so
 * react-native-screens rotates the app when it appears and rotates it back
 * when it is popped — by the close button or Android back alike — while every
 * other screen declares `portrait_up`. No orientation lock is called from JS.
 *
 * The generated canvas is ~2:1, so landscape gives the map the long edge of the
 * screen before any zoom. An SVG map renders in `MindMapWebView`, whose native
 * pinch-zoom re-renders the vectors at every level (on iOS, WebKit does not
 * double-tap-zoom this page), and whose drawing never touches the app's main
 * thread; its text comes from `useRemoteSvg`, which the inline preview already
 * filled. An editor-uploaded raster keeps expo-image with gesture zoom.
 */

const MAX_SCALE = 5;
const MIN_SCALE = 1;

export type MindMapViewerParams = { url: string; mimeType?: string | null };
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
  const html = useMemo(() => (svg.xml ? svgDocument(svg.xml, 'viewer') : null), [svg.xml]);
  const [renderStatus, setRenderStatus] = useState<LoadStatus>('loading');
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [rasterStatus, setRasterStatus] = useState<LoadStatus>('loading');
  const [rasterAttempt, setRasterAttempt] = useState(0);

  const status: LoadStatus = isSvg ? combinedLoadStatus(svg.status, renderStatus) : rasterStatus;

  const retry = () => {
    if (!isSvg) {
      setRasterStatus('loading');
      setRasterAttempt((n) => n + 1);
      return;
    }
    setRenderStatus('loading');
    // A failed download fetches again; a failed render remounts the WebView.
    if (svg.status === 'error') svg.retry();
    else setRenderAttempt((n) => n + 1);
  };

  // Gesture zoom for the raster branch; the WebView zooms natively.
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  // Built once — shared values are stable across renders — because RNGH
  // re-attaches its handlers whenever the gesture objects change.
  const zoomGesture = useMemo(() => {
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

    return Gesture.Simultaneous(pinch, pan, doubleTap);
  }, [scale, savedScale, translateX, translateY, savedX, savedY]);

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Clear of whichever side holds a notch or navigation bar: in the app's RTL
  // mode `right` is laid out on the physical left edge.
  const closeStyle = {
    top: Math.max(insets.top, spacing.ssm),
    right: Math.max(insets.left, insets.right, spacing.ssm) + spacing.sm,
  };

  const renderMap = () => {
    if (isSvg) {
      return (
        html && (
          <View style={styles.canvas}>
            <MindMapWebView
              key={renderAttempt}
              html={html}
              mode="viewer"
              onLoad={() => setRenderStatus('loaded')}
              onError={() => setRenderStatus('error')}
              testID="study-mindmap-viewer-web"
            />
          </View>
        )
      );
    }
    return (
      <GestureDetector gesture={zoomGesture}>
        <Animated.View style={[styles.canvas, zoomStyle]}>
          <Image
            key={rasterAttempt}
            source={{ uri: url }}
            style={styles.fill}
            contentFit="contain"
            cachePolicy="memory-disk"
            onLoad={() => setRasterStatus('loaded')}
            onError={() => setRasterStatus('error')}
          />
        </Animated.View>
      </GestureDetector>
    );
  };

  return (
    // RNGH only delivers gestures under a GestureHandlerRootView, and the app
    // mounts none at its root (this viewer is its only RNGH user), so the
    // raster pinch/pan/double-tap bring their own.
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
            <Ionicons name="git-network-outline" size={32} color={COLORS.textOnDark} />
            <Text style={[typography('body'), styles.errorText]}>
              {t('study_lesson.mind_map_error')}
            </Text>
            <View style={styles.retryRow}>
              <Ionicons name="refresh" size={16} color={COLORS.textOnDark} />
              <Text style={[typography('caption'), fontWeight('600'), styles.errorText]}>
                {t('common.retry')}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          renderMap()
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
          <Ionicons name="close" size={26} color={COLORS.textOnDark} />
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
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  // Full-bleed: in landscape the map's 2:1 ratio nearly matches the screen, so
  // any inset is wasted map.
  canvas: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.white,
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
    gap: spacing.sectionGap,
    padding: spacing.lg,
  },
  errorText: {
    color: COLORS.textOnDark,
    textAlign: 'center',
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default MindMapViewerScreen;
