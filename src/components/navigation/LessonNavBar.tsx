import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';

interface LessonNavBarProps {
  currentIndex: number;
  totalCount: number;
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
  onFinish?: () => void;
}

/**
 * Fixed bottom navigation bar for lesson prev/next.
 * - Previous on the left (secondary style)
 * - Counter badge in the center
 * - Next on the right (primary style)
 */
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
  const common = useCommonStyles();
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
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.prevButton,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
          onPress={onPrevious}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            size={18}
            color={theme.colors.text}
            style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }}
          />
          <Text
            style={[typography('buttonSmall'), styles.prevButtonText, { color: theme.colors.text }]}
          >
            {t('study_lesson.previous')}
          </Text>
        </TouchableOpacity>
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

      {/* Next Button */}
      {onNext ? (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: borderRadius.lg,
            },
          ]}
          onPress={onNext}
          activeOpacity={0.7}
        >
          <Text style={[typography('buttonSmall'), styles.nextButtonText]}>
            {' '}
            {t('study_lesson.next')}{' '}
          </Text>
          <Ionicons
            name={isRTL ? 'chevron-back' : 'chevron-forward'}
            size={18}
            color="#fff"
            style={{ marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: borderRadius.lg,
            },
          ]}
          onPress={onFinish}
          activeOpacity={0.7}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color="#fff"
            style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }}
          />
          <Text style={[typography('buttonSmall'), styles.nextButtonText]}>
            {' '}
            {t('study_lesson.back_to_chapters')}{' '}
          </Text>
        </TouchableOpacity>
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
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 100,
    justifyContent: 'center',
  },
  prevButton: {
    borderWidth: 1,
  },
  nextButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  prevButtonText: {
    fontWeight: '600',
  },
  nextButtonText: {
    fontWeight: '600',
    color: '#fff',
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
