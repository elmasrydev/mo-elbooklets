import React, { useEffect } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { isArabicText } from '../config/fonts';
import { spacing } from '../config/spacing';
import type { MobileAvailabilityStatus } from '../hooks/useMobileAvailability';

interface MobileAvailabilityHintProps {
  status: MobileAvailabilityStatus;
  /** Already localized by the backend — rendered as-is. */
  message: string;
  /**
   * Vertical-rhythm override. The hint sits between two fields whose own
   * margins differ per screen, so the host tunes the gap to stay centred.
   */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * One-line hint under the registration mobile field (BKLT-308).
 *
 * Deliberately quiet: a spinner while the check runs, then nothing at all when
 * the number is free — only an already-registered number is worth interrupting
 * for, and it just gets a plain warning-coloured sentence. (No tick/cross marks
 * and no inline action: the Log In shortcut lives in the popup raised when the
 * user tries to continue, so the field itself stays uncluttered.)
 */
const MobileAvailabilityHint: React.FC<MobileAvailabilityHintProps> = ({
  status,
  message,
  style,
  testID,
}) => {
  const { theme } = useTheme();
  const { typography } = useTypography();
  const { t } = useTranslation();

  // The verdict appears asynchronously (after blur), which screen readers
  // don't pick up on their own. Android gets accessibilityLiveRegion on the
  // Text below; iOS has no live regions, so VoiceOver is told imperatively.
  useEffect(() => {
    if (status === 'taken' && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message || t('auth.mobile_already_registered'));
    }
  }, [status, message, t]);

  if (status === 'checking') {
    return (
      <View style={[styles.row, styles.block, style]} testID={testID}>
        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
        <Text
          style={[
            typography('caption'),
            styles.checkingText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {t('auth.checking_mobile')}
        </Text>
      </View>
    );
  }

  // 'idle' and 'available' stay silent — a free number needs no confirmation.
  if (status !== 'taken') return null;

  const text = message || t('auth.mobile_already_registered');

  return (
    <Text
      testID={testID}
      accessibilityLiveRegion="polite"
      style={[
        // Backend copy, so the font follows the message's own script.
        typography('caption', undefined, isArabicText(text)),
        styles.text,
        styles.block,
        // warningText, not warning: the amber is theme-aware here and stays
        // readable on the form background at caption size.
        { color: theme.colors.warningText },
        style,
      ]}
    >
      {text}
    </Text>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Shared vertical rhythm so the hint sits evenly between the two fields
  // instead of hugging the one below it.
  block: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  text: {
    textAlign: 'left',
  },
  checkingText: {
    textAlign: 'left',
    marginStart: spacing.sm,
  },
});

export default MobileAvailabilityHint;
