import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { isArabicText } from '../../config/fonts';
import { spacing, borderRadius } from '../../config/spacing';
import { AiChatSource } from '../../types/boki';

interface BokiSourceLinkProps {
  source: AiChatSource;
  onPress: (source: AiChatSource) => void;
  /** This exact source is being resolved — shows a spinner in place of the icon. */
  loading?: boolean;
  /** Another source is being resolved — blocks taps without a spinner on this chip. */
  disabled?: boolean;
}

/**
 * A tappable chip for one RAG source ("reference link") on an answer — tapping
 * it resolves and opens the referenced lesson (BKLT-314). Only one lookup runs
 * at a time (see BokiChatScreen's `resolvingLessonId`), so every other chip is
 * disabled while one is in flight — otherwise a second tap would silently
 * no-op instead of giving the student any feedback.
 */
const BokiSourceLink: React.FC<BokiSourceLinkProps> = ({
  source,
  onPress,
  loading = false,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { typography } = useTypography();

  const handlePress = useCallback(() => onPress(source), [onPress, source]);

  return (
    <TouchableOpacity
      testID="boki-source-link"
      onPress={handlePress}
      disabled={loading || disabled}
      activeOpacity={0.7}
      style={[
        styles.chip,
        { backgroundColor: theme.colors.primary50, borderColor: theme.colors.border },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <Ionicons
          name="document-text-outline"
          size={spacing.icon.sm}
          color={theme.colors.primary}
        />
      )}
      <Text
        numberOfLines={1}
        style={[
          typography('caption', undefined, isArabicText(source.title)),
          styles.label,
          { color: theme.colors.primary },
        ]}
      >
        {source.title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  label: {
    marginStart: spacing.xs,
    flexShrink: 1,
    textAlign: 'left',
  },
});

export default React.memo(BokiSourceLink);
