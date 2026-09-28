import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../config/colors';
import { spacing } from '../../config/spacing';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';

type MindMapErrorCardProps = {
  onRetry: () => void;
  testID: string;
  /** `inline` on the lesson page; `fullscreen` on the viewer's black backdrop. */
  variant: 'inline' | 'fullscreen';
};

/** The "mind map failed to load — tap to retry" card, for the preview and the viewer. */
const MindMapErrorCard: React.FC<MindMapErrorCardProps> = ({ onRetry, testID, variant }) => {
  const { t } = useTranslation();
  const { theme, borderRadius } = useTheme();
  const { typography, fontWeight } = useTypography();
  const inline = variant === 'inline';
  const iconColor = inline ? theme.colors.textTertiary : COLORS.textOnDark;
  const messageColor = inline ? theme.colors.textSecondary : COLORS.textOnDark;
  const actionColor = inline ? theme.colors.primary : COLORS.textOnDark;

  return (
    <TouchableOpacity
      style={
        inline
          ? [
              styles.inline,
              {
                borderRadius: borderRadius.lg,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              },
            ]
          : styles.fullscreen
      }
      onPress={onRetry}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('study_lesson.mind_map_error')}
      testID={testID}
    >
      <Ionicons name="git-network-outline" size={inline ? 28 : 32} color={iconColor} />
      <Text
        style={[typography(inline ? 'caption' : 'body'), styles.message, { color: messageColor }]}
      >
        {t('study_lesson.mind_map_error')}
      </Text>
      <View style={styles.retryRow}>
        <Ionicons name="refresh" size={inline ? 14 : 16} color={actionColor} />
        <Text style={[typography('caption'), fontWeight('600'), { color: actionColor }]}>
          {t('common.retry')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  inline: {
    width: '100%',
    height: 140,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fullscreen: {
    alignItems: 'center',
    gap: spacing.sectionGap,
    padding: spacing.lg,
  },
  message: {
    textAlign: 'center',
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});

export default MindMapErrorCard;
