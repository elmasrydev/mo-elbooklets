import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useMindMapLoad } from '../../hooks/useMindMapLoad';
import type { MindMapViewerParams } from '../../screens/study/MindMapViewerScreen';
import MindMapErrorCard from './MindMapErrorCard';
import MindMapWebView from './MindMapWebView';

/**
 * Lesson mind map — the inline preview (BKLT-174).
 *
 * The URL behind `mindMapUrl` is either an AI-generated SVG or an editor's
 * raster upload, and `mindMapMimeType` decides which — `<Image>` renders
 * nothing at all for an SVG, so the branch is not cosmetic. Detection lives in
 * `resolveMindMapKind`; loading state in `useMindMapLoad`, which the viewer
 * shares; this component only renders.
 *
 * An SVG is downloaded once through `useRemoteSvg` and drawn by
 * `MindMapWebView` (its own process — no main-thread drawing, which is what
 * froze the lesson screen); a raster goes through expo-image. Tapping opens
 * `MindMapViewer`, a landscape screen of its own, which reads the same cached
 * SVG text.
 *
 * `active` lets the reader hold the map back until its opening transition is
 * over — SVG download and raster load alike; the preview shows its skeleton
 * meanwhile.
 *
 * Renders `null` when there is no map, so the lesson page never shows an empty
 * or broken mind-map section (BKLT-174 AC 4).
 */

type LessonMindMapProps = {
  url?: string | null;
  mimeType?: string | null;
  /** Fired once the map has rendered (not when it scrolls into view) — drives "Mind Map Viewed". */
  onViewed?: () => void;
  /** Fired when the student opens the zoomable fullscreen view. */
  onZoomed?: () => void;
  /** `false` holds the map back (skeleton shown); default `true`. */
  active?: boolean;
  testID?: string;
};

type ViewerNavigation = NativeStackNavigationProp<{ MindMapViewer: MindMapViewerParams }>;

const MindMapPreview: React.FC<LessonMindMapProps> = ({
  url,
  mimeType,
  onViewed,
  onZoomed,
  active = true,
  testID = 'study-mindmap',
}) => {
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { typography } = useTypography();
  const navigation = useNavigation<ViewerNavigation>();
  const map = useMindMapLoad(url, mimeType, 'preview', active);

  // "Viewed" means the map actually rendered — a failed load must not count.
  // NOTE: this is load-based, not viewport-based; a student who never scrolls
  // down to the section still counts once the map renders.
  useEffect(() => {
    if (map.status === 'loaded') onViewed?.();
  }, [map.status, onViewed]);

  const openViewer = () => {
    onZoomed?.();
    // A URL is certain here: without one, `kind` is 'none' and nothing renders.
    navigation.navigate('MindMapViewer', { url: url as string, mimeType });
  };

  const s = useMemo(() => styles(theme, spacing, borderRadius), [theme, spacing, borderRadius]);

  if (map.kind === 'none') return null;

  if (map.status === 'error') {
    return <MindMapErrorCard variant="inline" onRetry={map.retry} testID={`${testID}-retry`} />;
  }

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
        {map.kind === 'svg'
          ? // pointerEvents="none": the preview is a picture — the tap belongs
            // to the card, and a drag to the lesson's scroll view.
            map.html && (
              <View style={s.fill} pointerEvents="none">
                <MindMapWebView
                  key={map.attempt}
                  html={map.html}
                  mode="preview"
                  onLoad={map.onLoad}
                  onError={map.onError}
                />
              </View>
            )
          : active && (
              <Image
                key={map.attempt}
                source={{ uri: url as string }}
                style={s.fill}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={150}
                onLoad={map.onLoad}
                onError={map.onError}
              />
            )}
        {map.status === 'loading' && (
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
    </>
  );
};

/**
 * Keyed by the map's URL: the reader swaps lessons in place, and all load
 * state — "loaded" included, which is what reports "Mind Map Viewed" — belongs
 * to one map. Unkeyed, the first render after Next still read the previous
 * map's "loaded" and counted the next lesson's map as viewed before it loaded.
 */
const LessonMindMap: React.FC<LessonMindMapProps> = (props) => (
  <MindMapPreview key={props.url ?? 'none'} {...props} />
);

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
  });

export default LessonMindMap;
