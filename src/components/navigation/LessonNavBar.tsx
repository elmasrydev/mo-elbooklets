import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../hooks/useTypography';
import AppButton from '../AppButton';

interface LessonNavBarProps {
  currentIndex: number;
  totalCount: number;
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
  onFinish?: () => void;
}

const LessonNavBar: React.FC<LessonNavBarProps> = ({
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
  onFinish,
}) => {
  const { theme, borderRadius, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();

  const currentStyles = styles(theme, spacing, borderRadius);

  return (
    <View
      style={[
        currentStyles.container,
        {
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      {onPrevious ? (
        <AppButton
          title={t('study_lesson.previous')}
          onPress={onPrevious}
          variant="secondary"
          size="sm"
          fullWidth={false}
          style={{ minWidth: 100 }}
          icon={
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={spacing.icon.xs}
              color={theme.colors.text}
            />
          }
          iconPosition="left"
        />
      ) : (
        <View style={currentStyles.placeholder} />
      )}

      <View style={currentStyles.counterBadge}>
        <Text style={[typography('label'), currentStyles.counterText]}>
          {currentIndex + 1} / {totalCount}
        </Text>
      </View>

      {onNext ? (
        <AppButton
          title={t('study_lesson.next')}
          onPress={onNext}
          variant="primary"
          size="sm"
          fullWidth={false}
          style={{ minWidth: 100 }}
          icon={
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={spacing.icon.xs}
              color={theme.colors.textOnDark}
            />
          }
          iconPosition="right"
        />
      ) : (
        <AppButton
          title={t('study_lesson.back_to_chapters')}
          onPress={onFinish}
          variant="primary"
          size="sm"
          fullWidth={false}
          style={{ minWidth: 120 }}
          icon={
            <Ionicons
              name="checkmark-circle-outline"
              size={spacing.icon.xs}
              color={theme.colors.textOnDark}
            />
          }
          iconPosition="left"
        />
      )}
    </View>
  );
};

const styles = (theme: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    placeholder: {
      minWidth: 100,
    },
    counterBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.primary + '1A',
    },
    counterText: {
      fontWeight: '700',
      color: theme.colors.primary,
    },
  });

export default LessonNavBar;
