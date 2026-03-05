import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from './UnifiedHeader';
import AppButton from './AppButton';
import { layout } from '../config/layout';

interface QuizType {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
  isDefault: boolean;
}

interface SelectedLesson {
  id: string;
  name: string;
}

interface SelectedUnit {
  id: string;
  name: string;
  lessons: SelectedLesson[];
}

interface QuizSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: (quizTypeId: string) => void;
  quizTypes: QuizType[];
  initialQuizTypeId?: string | null;
  subjectName?: string;
  selectedUnits?: SelectedUnit[];
}

const QuizSettingsModal: React.FC<QuizSettingsModalProps> = ({
  visible,
  onClose,
  onStart,
  quizTypes,
  initialQuizTypeId,
  subjectName,
  selectedUnits,
}) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(initialQuizTypeId || null);
  const [timedMode, setTimedMode] = useState(false);

  useEffect(() => {
    if (visible && !selectedTypeId && quizTypes.length > 0) {
      const defaultType = quizTypes.find((qt) => qt.isDefault) || quizTypes[0];
      setSelectedTypeId(defaultType.id);
    }
  }, [visible, quizTypes, selectedTypeId]);

  const handleStart = () => {
    if (selectedTypeId) {
      onStart(selectedTypeId);
    }
  };

  const currentStyles = styles(
    theme,
    common,
    typography,
    fontWeight,
    fontSizes,
    spacing,
    borderRadius,
    insets,
    isRTL,
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={currentStyles.container}>
        <UnifiedHeader
          title={t('quiz_lessons.quiz_settings')}
          showBackButton={true}
          onBackPress={onClose}
          isModal={true}
          centerAlign={true}
        />

        <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={currentStyles.heroSection}>
            <Text style={currentStyles.heroTitle}>{t('quiz_lessons.configure_quiz_title')}</Text>
            <Text style={currentStyles.heroSubtitle}>{t('quiz_lessons.customize_experience')}</Text>
          </View>

          {/* Subject Badge */}
          {subjectName ? (
            <View style={currentStyles.subjectBadgeCard}>
              <View style={currentStyles.subjectBadgeIconContainer}>
                <Ionicons name="book" size={24} color={theme.colors.textOnDark} />
              </View>
              <View style={currentStyles.subjectBadgeInfo}>
                <Text style={currentStyles.subjectBadgeLabel}>
                  {t('quiz_lessons.current_topic')}
                </Text>
                <Text style={currentStyles.subjectBadgeTitle}>{subjectName}</Text>
              </View>
            </View>
          ) : null}

          {/* Selected Lessons Breadcrumbs */}
          {selectedUnits && selectedUnits.length > 0 && (
            <View style={currentStyles.breadcrumbsContainer}>
              {selectedUnits.map((unit) => (
                <View key={unit.id} style={currentStyles.unitBreadcrumb}>
                  <View style={currentStyles.unitBreadcrumbHeader}>
                    <View style={currentStyles.breadcrumbDot} />
                    <Text style={currentStyles.unitBreadcrumbName}>{unit.name}</Text>
                  </View>
                  <View style={currentStyles.lessonBreadcrumbsList}>
                    {unit.lessons.map((lesson) => (
                      <View key={lesson.id} style={currentStyles.lessonBreadcrumbItem}>
                        <View style={currentStyles.lessonBreadcrumbDot} />
                        <Text style={currentStyles.lessonBreadcrumbName}>{lesson.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Question Selection */}
          <View style={currentStyles.sectionContainer}>
            <Text style={currentStyles.sectionTitle}>{t('quiz_lessons.select_quiz_type')}</Text>
            <View style={currentStyles.optionsContainer}>
              {quizTypes.map((type) => {
                const isSelected = selectedTypeId === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      currentStyles.optionCard,
                      isSelected && currentStyles.optionCardSelected,
                    ]}
                    onPress={() => setSelectedTypeId(type.id)}
                    activeOpacity={0.7}
                  >
                    <View style={currentStyles.optionInfo}>
                      <Text
                        style={[
                          currentStyles.optionTitle,
                          isSelected && currentStyles.optionTitleSelected,
                        ]}
                      >
                        {t(`quiz_types.${type.slug}`, { defaultValue: type.name })}
                      </Text>
                      <Text style={currentStyles.optionSubtitle}>
                        {type.questionCount} {t('quiz_lessons.questions')}
                      </Text>
                    </View>
                    <View
                      style={[
                        currentStyles.radioButton,
                        isSelected && currentStyles.radioButtonSelected,
                      ]}
                    >
                      {isSelected && <View style={currentStyles.radioButtonInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Additional Settings */}
          <View style={currentStyles.additionalSettingsContainer}>
            <View style={currentStyles.settingRow}>
              <View style={currentStyles.settingInfo}>
                <Ionicons
                  name="timer-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={currentStyles.settingIcon}
                />
                <Text style={currentStyles.settingLabel}>{t('quiz_lessons.timed_mode')}</Text>
              </View>
              <TouchableOpacity
                style={[
                  currentStyles.toggleTrack,
                  timedMode ? currentStyles.toggleTrackActive : currentStyles.toggleTrackInactive,
                ]}
                onPress={() => setTimedMode(!timedMode)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    currentStyles.toggleThumb,
                    timedMode ? currentStyles.toggleThumbActive : currentStyles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Start Button Area inside scroll view so it flows naturally if screen is small */}
        <View style={currentStyles.actionArea}>
          <AppButton
            title={t('quiz_lessons.start_quiz')}
            onPress={handleStart}
            disabled={!selectedTypeId}
            size="lg"
            icon={<Ionicons name="play" size={20} color={theme.colors.textOnDark} />}
            iconPosition="right"
          />
          <Text style={currentStyles.disclaimerText}>{t('quiz_lessons.progress_saved')}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = (
  theme: any,
  common: any,
  typography: any,
  fontWeight: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  insets: any,
  isRTL: boolean,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.lg,
    },
    heroSection: {
      marginBottom: spacing.xl,
      alignItems: common.alignStart,
    },
    heroTitle: {
      fontSize: Math.max(24, fontSizes.xl),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: spacing.xs,
      textAlign: common.textAlign,
    },
    heroSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
      lineHeight: 22,
    },
    subjectBadgeCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '0D', // Very light primary shade
      borderWidth: 1,
      borderColor: theme.colors.primary + '1A', // Light border
      borderRadius: borderRadius.xl || 16,
      padding: spacing.md,
      marginBottom: spacing.xl,
    },
    subjectBadgeIconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg || 12,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
    },
    subjectBadgeInfo: {
      flex: 1,
      alignItems: common.alignStart,
      justifyContent: 'center',
    },
    subjectBadgeLabel: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.primary,
      textTransform: 'uppercase',
      opacity: 0.8,
      marginBottom: 2,
      letterSpacing: 0.5,
      textAlign: common.textAlign,
    },
    subjectBadgeTitle: {
      fontSize: Math.max(16, fontSizes.lg),
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    breadcrumbsContainer: {
      marginBottom: spacing.lg,
    },
    unitBreadcrumb: {
      marginBottom: spacing.sm,
    },
    unitBreadcrumbHeader: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    breadcrumbDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      ...common.marginEnd(spacing.sm),
    },
    unitBreadcrumbName: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    lessonBreadcrumbsList: {
      marginStart: 11, // align with the center of the unit dot (8/2 = 4 + margin)
      borderStartWidth: 2,
      borderStartColor: theme.colors.border,
      paddingStart: spacing.md,
      paddingVertical: spacing.xs,
    },
    lessonBreadcrumbItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    lessonBreadcrumbDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.textTertiary,
      ...common.marginEnd(spacing.sm),
    },
    lessonBreadcrumbName: {
      ...typography('caption'),
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    sectionContainer: {
      marginBottom: spacing.xl,
      alignItems: common.alignStart,
    },
    sectionTitle: {
      ...typography('h3'),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: spacing.md,
      textAlign: common.textAlign,
    },
    optionsContainer: {
      width: '100%',
      gap: spacing.md,
    },
    optionCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: spacing.lg,
      borderRadius: borderRadius.xl || 16,
      backgroundColor: theme.colors.card,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '05', // tiny hint of blue
    },
    optionInfo: {
      flex: 1,
      alignItems: common.alignStart,
      justifyContent: 'center',
    },
    optionTitle: {
      fontSize: Math.max(16, fontSizes.lg),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: 2,
      textAlign: common.textAlign,
    },
    optionTitleSelected: {
      color: theme.colors.primary,
    },
    optionSubtitle: {
      ...typography('caption'),
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      textAlign: common.textAlign,
    },
    radioButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginStart(spacing.md),
    },
    radioButtonSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    radioButtonInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FFF',
    },
    additionalSettingsContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.lg,
      marginBottom: spacing.xl,
    },
    settingRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingInfo: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
    },
    settingIcon: {
      ...common.marginEnd(spacing.sm),
    },
    settingLabel: {
      ...typography('body'),
      ...fontWeight('500'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    toggleTrack: {
      width: 48,
      height: 24,
      borderRadius: 12,
      padding: 2,
      justifyContent: 'center',
    },
    toggleTrackActive: {
      backgroundColor: theme.colors.primary,
      alignItems: 'flex-end',
    },
    toggleTrackInactive: {
      backgroundColor: theme.colors.textTertiary,
      alignItems: 'flex-start',
    },
    toggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#FFF',
    },
    toggleThumbActive: {
      // additional active thumb styling if needed
    },
    toggleThumbInactive: {
      // additional inactive thumb styling if needed
    },
    actionArea: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.lg,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 5,
    },
    disclaimerText: {
      ...typography('caption'),
      fontSize: 12,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
  });

export default QuizSettingsModal;
