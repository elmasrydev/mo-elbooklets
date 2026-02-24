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
  const { theme, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* Previous Button */}
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
              size={18}
              color={theme.colors.text}
            />
          }
          iconPosition="left"
        />
      ) : (
        <View style={styles.placeholder} />
      )}

      {/* Counter Badge */}
      <View
        style={[
          styles.counterBadge,
          {
            backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}15`,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        <Text style={[typography('label'), styles.counterText, { color: theme.colors.primary }]}>
          {currentIndex + 1} / {totalCount}
        </Text>
      </View>

      {/* Next Button / Finish */}
      {onNext ? (
        <AppButton
          title={t('study_lesson.next')}
          onPress={onNext}
          variant="primary"
          size="sm"
          fullWidth={false}
          style={{ minWidth: 100 }}
          icon={
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color="#fff" />
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
          icon={<Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
          iconPosition="left"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  placeholder: {
    minWidth: 100,
  },
  counterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  counterText: {
    fontWeight: '700',
  },
});

export default LessonNavBar;
