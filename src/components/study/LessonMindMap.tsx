import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SvgUri } from 'react-native-svg';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { resolveMindMapKind } from '../../utils/mindMap';

/**
 * Lesson mind map (BKLT-174).
 *
 * The URL behind `mindMapUrl` is either an AI-generated SVG or an editor's
 * raster upload, and `mindMapMimeType` decides which — `<Image>` renders
 * nothing at all for an SVG, so the branch is not cosmetic. Detection lives in
 * `resolveMindMapKind`; this component only renders.
 *
 * Shown fitted in the lesson page (the generated canvas is 1800px wide with a
 * variable height, far wider than a phone) with a tap-to-zoom fullscreen view.
 * SVG stays sharp at any scale, which is the whole reason the backend switched
 * to it, so the viewer allows a genuinely useful zoom rather than a blurry one.
 *
 * Renders `null` when there is no map, so the lesson page never shows an empty
 * or broken mind-map section (BKLT-174 AC 4).
 */

const MAX_SCALE = 5;
const MIN_SCALE = 1;

type LessonMindMapProps = {
  url?: string | null;
  mimeType?: string | null;
  /** Fired once the map is actually on screen — drives "Mind Map Viewed". */
  onViewed?: () => void;
  /** Fired when the student opens the zoomable fullscreen view. */
  onZoomed?: () => void;
  testID?: string;
};

const LessonMindMap: React.FC<LessonMindMapProps> = ({
  url,
  mimeType,
  onViewed,
  onZoomed,
  testID = 'study-mindmap',
}) => {
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { typography, fontWeight } = useTypography();

  const kind = resolveMindMapKind(url, mimeType);
  const isSvg = kind === 'svg';

  // SvgUri's onLoad is unreliable for remote files, so SVGs start "loaded" and
  // rely on onError for the failure path — same trade-off as QuestionImage.
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    isSvg ? 'loaded' : 'loading',
  );
  const [viewerOpen, setViewerOpen] = useState(false);
  // Bumped to force a re-request of the same URL after a failure.
  const [attempt, setAttempt] = useState(0);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  // The reader swaps lessons in place, so reset per URL or a previous failure
  // would stick to the next lesson's map.
  useEffect(() => {
    setStatus(isSvg ? 'loaded' : 'loading');
    setAttempt(0);
    setViewerOpen(false);
  }, [url, isSvg]);

  // "Viewed" means the map reached the screen, not merely that the lesson had
  // one — a failed load must not count.
  useEffect(() => {
    if (status === 'loaded') onViewed?.();
  }, [status, onViewed]);

  const resetZoom = useCallback(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedX.value = 0;
    savedY.value = 0;
  }, [scale, savedScale, translateX, translateY, savedX, savedY]);

  const openViewer = () => {
    resetZoom();
    setViewerOpen(true);
    onZoomed?.();
  };

  const closeViewer = () => {
    setViewerOpen(false);
    resetZoom();
  };

  const retry = () => {
    setStatus(isSvg ? 'loaded' : 'loading');
    setAttempt((n) => n + 1);
  };

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

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const s = styles(theme, spacing, borderRadius);

  if (kind === 'none') return null;

  if (status === 'error') {
    return (
      <TouchableOpacity
        style={s.fallback}
        onPress={retry}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('study_lesson.mind_map_error')}
        testID={`${testID}-retry`}
      >
        <Ionicons name="git-network-outline" size={28} color={theme.colors.textTertiary} />
        <Text style={[typography('caption'), { color: theme.colors.textSecondary }]}>
          {t('study_lesson.mind_map_error')}
        </Text>
        <View style={s.retryRow}>
          <Ionicons name="refresh" size={14} color={theme.colors.primary} />
          <Text style={[typography('caption'), fontWeight('600'), { color: theme.colors.primary }]}>
            {t('common.retry')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  const renderMap = (fit: 'preview' | 'viewer') =>
    isSvg ? (
      // pointerEvents="none" so the SVG's native views don't swallow the tap the
      // parent needs to open the viewer.
      <View style={s.fill} pointerEvents="none">
        <SvgUri
          key={attempt}
          uri={url as string}
          width="100%"
          height="100%"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      </View>
    ) : (
      <Image
        key={attempt}
        source={{ uri: url as string }}
        style={s.fill}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={fit === 'preview' ? 150 : 0}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    );

  return (
    <>
      <TouchableOpacity
        style={s.frame}
        onPress={openViewer}
        activeOpacity={0.9}
        accessibilityRole="imagebutton"
        accessibilityLabel={t('study_lesson.mind_map_hint')}
        testID={testID}
      >
        {renderMap('preview')}
        {status === 'loading' && (
          <View style={[s.skeleton, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}
        <View style={s.expandBadge}>
          <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      <Text style={[typography('caption'), s.hint, { color: theme.colors.textTertiary }]}>
        {t('study_lesson.mind_map_hint')}
      </Text>

      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        onRequestClose={closeViewer}
        supportedOrientations={['portrait', 'landscape']}
      >
        {/* The reader's Modal sits outside the app's root gesture handler, so
            the viewer needs its own for pinch/pan to receive touches. */}
        <GestureHandlerRootView style={s.viewerRoot}>
          <View style={s.viewerBackdrop} testID={`${testID}-viewer`}>
            <GestureDetector gesture={composed}>
              <Animated.View style={[s.viewerCanvas, zoomStyle]}>
                {renderMap('viewer')}
              </Animated.View>
            </GestureDetector>

            <TouchableOpacity
              style={[s.viewerClose, { backgroundColor: theme.colors.primary }]}
              onPress={closeViewer}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              testID={`${testID}-viewer-close`}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
};

const styles = (theme: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    frame: {
      width: '100%',
      height: 240,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      // Generated maps paint their own light background; a white card keeps a
      // transparent raster legible in dark mode too.
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fill: {
      width: '100%',
      height: '100%',
    },
    skeleton: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    expandBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    hint: {
      marginTop: spacing.xs,
      textAlign: 'left',
    },
    fallback: {
      width: '100%',
      height: 140,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    retryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    viewerRoot: {
      flex: 1,
    },
    viewerBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.92)',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    viewerCanvas: {
      width: '96%',
      height: '82%',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      overflow: 'hidden',
    },
    viewerClose: {
      position: 'absolute',
      top: 56,
      right: 20,
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

export default LessonMindMap;
