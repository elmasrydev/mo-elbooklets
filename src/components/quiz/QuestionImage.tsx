import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SvgUri } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../hooks/useTypography';
import { QUIZ_COLORS } from '../../config/colors';

/**
 * Renders a question's attached image (`imageUrl`) above the question text.
 * Orthogonal to `type` — any question, including paragraph children, may carry
 * one.
 *
 * SVGs are rendered with react-native-svg's `SvgUri` (reliable for remote SVGs,
 * respects the viewBox even when the file has no explicit width/height — which
 * is exactly where expo-image falls short). Raster formats (PNG/JPG/GIF/WebP)
 * go through expo-image for caching + fast decode. Both share a loading
 * skeleton, a broken-image fallback + retry, and a tap-to-zoom viewer.
 */

const isSvgUri = (uri: string): boolean => /\.svg(\?.*)?$/i.test(uri);

type QuestionImageProps = {
  uri: string;
  testID?: string;
};

const QuestionImage: React.FC<QuestionImageProps> = ({ uri, testID }) => {
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const svg = isSvgUri(uri);
  // SVGs render fast and their onLoad can be unreliable, so skip the skeleton
  // for them (start "loaded") — onError still drives the broken-image fallback.
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(svg ? 'loaded' : 'loading');
  const [viewerOpen, setViewerOpen] = useState(false);
  // Bumped to force a re-request of the same URL after a failure.
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    setStatus(svg ? 'loaded' : 'loading');
    setAttempt((n) => n + 1);
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
          <View style={styles.image} pointerEvents="none">
            <SvgUri
              key={attempt}
              uri={uri}
              width="100%"
              height="100%"
              onLoad={() => setStatus('loaded')}
              onError={() => setStatus('error')}
            />
          </View>
        ) : (
          <Image
            key={attempt}
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={150}
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
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
              <SvgUri uri={uri} width="100%" height="100%" />
            </View>
          ) : (
            <Image source={{ uri }} style={styles.viewerImage} contentFit="contain" />
          )}
          {/* Rendered last (and zIndexed) so the close button stays above the
              white SVG card. */}
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setViewerOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.close', 'Close')}
            testID={testID ? `${testID}-viewer-close` : undefined}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

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
    zIndex: 10,
    elevation: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: QUIZ_COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
    // Keep it legible over the white SVG card.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
