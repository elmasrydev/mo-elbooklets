import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { LoadStatus, svgLoadStatus, useRemoteSvg } from '../../hooks/useRemoteSvg';
import { resolveMindMapKind } from '../../utils/mindMap';

/**
 * Lesson mind map — the inline preview (BKLT-174).
 *
 * The URL behind `mindMapUrl` is either an AI-generated SVG or an editor's
 * raster upload, and `mindMapMimeType` decides which — `<Image>` renders
 * nothing at all for an SVG, so the branch is not cosmetic. Detection lives in
 * `resolveMindMapKind`; this component only renders.
 *
 * Shown fitted in the lesson page (the generated canvas is 1800px wide with a
 * variable height, far wider than a phone). Tapping it opens `MindMapViewer`, a
 * landscape screen of its own, so this component never rotates anything and
 * never mounts a second copy of the map. An SVG is downloaded once through
 * `useRemoteSvg`; the viewer then reads the same cached text.
 *
 * `active` lets the reader defer the download until its opening transition is
 * over — the preview shows its skeleton meanwhile.
 *
 * Renders `null` when there is no map, so the lesson page never shows an empty
 * or broken mind-map section (BKLT-174 AC 4).
 */

type LessonMindMapProps = {
  url?: string | null;
  mimeType?: string | null;
  /** Fired once the map is actually on screen — drives "Mind Map Viewed". */
  onViewed?: () => void;
  /** Fired when the student opens the zoomable fullscreen view. */
  onZoomed?: () => void;
  /** `false` holds the download back (skeleton shown); default `true`. */
  active?: boolean;
  testID?: string;
};

const LessonMindMap: React.FC<LessonMindMapProps> = ({
  url,
  mimeType,
  onViewed,
  onZoomed,
  active = true,
  testID = 'study-mindmap',
}) => {
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { typography, fontWeight } = useTypography();
  const navigation = useNavigation<any>();

  const kind = resolveMindMapKind(url, mimeType);
  const isSvg = kind === 'svg';

  const svg = useRemoteSvg(isSvg && active ? (url as string) : null);
  // react-native-svg reports a file it cannot parse through `onError`, after
  // the download itself succeeded — it counts as a failed load all the same.
  const [svgUnparseable, setSvgUnparseable] = useState(false);

  // Rasters are driven by expo-image's own load events. Reset per URL: the
  // reader swaps lessons in place, so a previous failure would otherwise stick
  // to the next lesson's map.
  const [rasterStatus, setRasterStatus] = useState<LoadStatus>('loading');
  const [rasterAttempt, setRasterAttempt] = useState(0);
  useEffect(() => {
    setRasterStatus('loading');
    setRasterAttempt(0);
    setSvgUnparseable(false);
  }, [url]);

  const status: LoadStatus = isSvg ? svgLoadStatus(svg.status, svgUnparseable) : rasterStatus;

  // "Viewed" means the map actually rendered — a failed load must not count.
  // NOTE: this is load-based, not viewport-based; a student who never scrolls
  // down to the section still counts once the file arrives.
  useEffect(() => {
    if (status === 'loaded') onViewed?.();
  }, [status, onViewed]);

  const retry = () => {
    if (isSvg) {
      setSvgUnparseable(false);
      svg.retry();
    } else {
      setRasterStatus('loading');
      setRasterAttempt((n) => n + 1);
    }
  };

  const openViewer = () => {
    onZoomed?.();
    navigation.navigate('MindMapViewer', { url, mimeType });
  };

  const s = useMemo(() => styles(theme, spacing, borderRadius), [theme, spacing, borderRadius]);

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
        {isSvg ? (
          // pointerEvents="none" so the SVG's native views don't swallow the
          // tap the parent needs to open the viewer.
          svg.xml && (
            <View style={s.fill} pointerEvents="none">
              <SvgXml
                xml={svg.xml}
                width="100%"
                height="100%"
                onError={() => setSvgUnparseable(true)}
              />
            </View>
          )
        ) : (
          <Image
            key={rasterAttempt}
            source={{ uri: url as string }}
            style={s.fill}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={150}
            onLoad={() => setRasterStatus('loaded')}
            onError={() => setRasterStatus('error')}
          />
        )}
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
  });

export default LessonMindMap;
