import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { spacing, borderRadius } from '../../config/spacing';
import { AiChatSource } from '../../types/boki';

interface BokiSourceLinkProps {
  source: AiChatSource;
  onPress: (source: AiChatSource) => void;
}

/**
 * A tappable chip for one RAG source ("reference link") on an answer.
 * Deep navigation to the exact lesson is gated on a backend `lesson(id)` query
 * (see BKLT-221 known gaps); the press handler surfaces the reference and fires
 * the Reference Link Clicked analytics event.
 */
const BokiSourceLink: React.FC<BokiSourceLinkProps> = ({ source, onPress }) => {
  const { theme } = useTheme();
  const { typography } = useTypography();

  const handlePress = useCallback(() => onPress(source), [onPress, source]);

  return (
    <TouchableOpacity
      testID="boki-source-link"
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        { backgroundColor: theme.colors.primary50, borderColor: theme.colors.border },
      ]}
    >
      <Ionicons name="document-text-outline" size={spacing.icon.sm} color={theme.colors.primary} />
      <Text
        numberOfLines={1}
        style={[typography('caption'), styles.label, { color: theme.colors.primary }]}
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
