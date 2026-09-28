import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { parse, SvgAst } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import CloseButton from '../navigation/CloseButton';
import { useTypography } from '../../hooks/useTypography';
import { combinedLoadStatus, LoadStatus, useRemoteSvg } from '../../hooks/useRemoteSvg';
import { normalizeSvgXml } from '../../utils/svgCompat';
import { COLORS, QUIZ_COLORS } from '../../config/colors';

/**
 * Renders a question's attached image (`imageUrl`) above the question text.
 * Orthogonal to `type` — any question, including paragraph children, may carry
 * one.
 *
 * SVGs are downloaded once through `useRemoteSvg`, parsed once, and drawn with
 * react-native-svg's `SvgAst` (it respects the viewBox even when the file has
 * no explicit width/height — which is exactly where expo-image falls short);
 * the zoom viewer draws the same parsed tree. Raster formats (PNG/JPG/GIF/WebP)
 * go through expo-image for caching + fast decode. Both share a loading
 * skeleton, a broken-image fallback + retry, and a tap-to-zoom viewer.
 */

const isSvgUri = (uri: string): boolean => /\.svg(\?.*)?$/i.test(uri);

type ParsedSvg = { ast: ReturnType<typeof parse>; unparseable: boolean };

/**
 * Parsed here rather than by `SvgXml`, which reports a parse failure from
 * inside its own render — and setting state from there is a React error. A
 * file react-native-svg cannot read becomes the retry card, whatever the
 * parser threw.
 */
const parseSvg = (xml: string | null): ParsedSvg => {
  if (!xml) return { ast: null, unparseable: false };
  try {
    // `normalizeSvgXml`: filters (drawn on the main thread), entities and
    // split spans react-native-svg would get wrong.
    return { ast: parse(normalizeSvgXml(xml)), unparseable: false };
  } catch {
    return { ast: null, unparseable: true };
  }
};

const FILL = { width: '100%', height: '100%' };

type QuestionImageProps = {
  uri: string;
  testID?: string;
};

const QuestionImageView: React.FC<QuestionImageProps> = ({ uri, testID }) => {
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const svg = isSvgUri(uri);
  const remote = useRemoteSvg(svg ? uri : null);
  const parsed = useMemo(() => parseSvg(remote.xml), [remote.xml]);
  const [rasterStatus, setRasterStatus] = useState<LoadStatus>('loading');
  const [viewerOpen, setViewerOpen] = useState(false);
  // Bumped to force a re-request of the same raster URL after a failure.
  const [attempt, setAttempt] = useState(0);

  const status: LoadStatus = svg
    ? combinedLoadStatus(remote.status, parsed.unparseable ? 'error' : 'loaded')
    : rasterStatus;

  const retry = () => {
    if (svg) {
      remote.retry();
    } else {
      setRasterStatus('loading');
      setAttempt((n) => n + 1);
    }
  };

  if (status === 'error') {
    return (
      <TouchableOpacity
        style={styles.fallback}
        onPress={retry}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('quiz_taking.image_retry', 'Image failed to load. Tap to retry.')}
        testID={testID}
      >
        <Ionicons name="image-outline" size={28} color={QUIZ_COLORS.muted} />
        <View style={styles.retryRow}>
          <Ionicons name="refresh" size={14} color={QUIZ_COLORS.secondary} />
          <Text style={[styles.retryText, typography('caption'), fontWeight('600')]}>
            {t('common.retry', 'Retry')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.frame}
        onPress={() => setViewerOpen(true)}
        activeOpacity={0.9}
        accessibilityRole="imagebutton"
        accessibilityLabel={t('quiz_taking.image_open', 'Question image. Tap to enlarge.')}
        testID={testID}
      >
        {svg ? (
          // pointerEvents="none" so the SVG's native views don't swallow the
          // tap — the parent TouchableOpacity needs it to open the zoom viewer.
          parsed.ast && (
            <View style={styles.image} pointerEvents="none">
              <SvgAst ast={parsed.ast} override={FILL} />
            </View>
          )
        ) : (
          <Image
            key={attempt}
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={150}
            onLoad={() => setRasterStatus('loaded')}
            onError={() => setRasterStatus('error')}
          />
        )}
        {status === 'loading' && (
          <View style={styles.skeleton}>
            <ActivityIndicator color={QUIZ_COLORS.navy} />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}
      >
        <View style={styles.viewerBackdrop}>
          {svg ? (
            <View style={styles.viewerSvg}>
              <SvgAst ast={parsed.ast} override={FILL} />
            </View>
          ) : (
            <Image source={{ uri }} style={styles.viewerImage} contentFit="contain" />
          )}
          {/* Rendered last so the close button stays above the white SVG card. */}
          <CloseButton
            variant="floating"
            style={styles.viewerClose}
            color={COLORS.textOnDark}
            size={26}
            onPress={() => setViewerOpen(false)}
            accessibilityLabel={t('common.close', 'Close')}
            testID={testID ? `${testID}-viewer-close` : undefined}
          />
        </View>
      </Modal>
    </>
  );
};

/**
 * Keyed by `uri`: the quiz renders one instance and swaps the question's image,
 * and all of this state — load status, retry count, an open viewer — belongs to
 * one image. Unkeyed, the first render of the next question still showed the
 * previous image's status.
 */
const QuestionImage: React.FC<QuestionImageProps> = (props) => (
  <QuestionImageView key={props.uri} {...props} />
);

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: QUIZ_COLORS.line,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  fallback: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: QUIZ_COLORS.line,
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  retryText: {
    color: QUIZ_COLORS.secondary,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 56,
    right: 20,
    backgroundColor: QUIZ_COLORS.navy,
  },
  viewerImage: {
    width: '100%',
    height: '80%',
  },
  viewerSvg: {
    // SVG diagrams are typically dark strokes on transparency, so they need a
    // light card behind them in the (near-black) viewer to be visible.
    width: '90%',
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
});

export default QuestionImage;
