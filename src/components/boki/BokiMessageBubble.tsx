import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { spacing, borderRadius } from '../../config/spacing';
import { AiChatSource, BokiErrorKind, BokiTurn } from '../../types/boki';
import BokiTypingIndicator from './BokiTypingIndicator';
import BokiSourceLink from './BokiSourceLink';

interface BokiMessageBubbleProps {
  turn: BokiTurn;
  onRetry: (turnId: string) => void;
  onSourcePress: (source: AiChatSource) => void;
}

const ERROR_KEY_BY_KIND: Record<BokiErrorKind, string> = {
  offline: 'boki.error_connection',
  rateLimit: 'boki.error_rate_limit',
  backend: 'boki.error_backend',
};

/**
 * One chat turn: the student's question bubble (trailing edge) followed by
 * Boki's answer bubble (leading edge). The answer bubble shows a typing
 * indicator while pending, the answer + sources when complete, or a localized
 * error with a Retry action when the send failed.
 *
 * Row alignment uses `flexDirection: 'row'` + `justifyContent`, both of which
 * flip automatically under RTL, so no manual direction logic is needed.
 */
const BokiMessageBubble: React.FC<BokiMessageBubbleProps> = ({ turn, onRetry, onSourcePress }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { typography } = useTypography();

  const handleRetry = useCallback(() => onRetry(turn.id), [onRetry, turn.id]);

  return (
    <View style={styles.turn}>
      <View style={[styles.row, styles.userRow]}>
        <View style={[styles.bubble, { backgroundColor: theme.colors.primary }]}>
          <Text style={[typography('body'), styles.text, { color: theme.colors.textOnDark }]}>
            {turn.userText}
          </Text>
        </View>
      </View>

      <View style={[styles.row, styles.aiRow]}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: 1,
            },
          ]}
        >
          {turn.status === 'pending' && <BokiTypingIndicator />}

          {turn.status === 'error' && (
            <View>
              <Text style={[typography('body'), styles.text, { color: theme.colors.errorText }]}>
                {t(ERROR_KEY_BY_KIND[turn.errorKind ?? 'backend'])}
              </Text>
              <TouchableOpacity
                testID="boki-retry-button"
                onPress={handleRetry}
                activeOpacity={0.7}
                style={styles.retry}
              >
                <Ionicons name="refresh" size={spacing.icon.sm} color={theme.colors.primary} />
                <Text
                  style={[typography('button'), styles.retryLabel, { color: theme.colors.primary }]}
                >
                  {t('boki.retry')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {turn.status === 'complete' && turn.answer !== null && (
            <View>
              <Text style={[typography('body'), styles.text, { color: theme.colors.text }]}>
                {turn.answer}
              </Text>
              {turn.sources.length > 0 && (
                <View style={styles.sources}>
                  {turn.sources.map((source) => (
                    <BokiSourceLink key={source.lessonId} source={source} onPress={onSourcePress} />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  turn: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.ssm,
    borderRadius: borderRadius.lg,
  },
  text: {
    textAlign: 'left',
  },
  sources: {
    marginTop: spacing.xs,
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  retryLabel: {
    marginStart: spacing.xs,
  },
});

export default React.memo(BokiMessageBubble);
