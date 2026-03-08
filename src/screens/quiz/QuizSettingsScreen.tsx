import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { tryFetchWithFallback } from '../../config/api';
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';
import { layout } from '../../config/layout';
import { useModal } from '../../context/ModalContext';

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

const QuizSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    subject,
    quizTypes = [],
    selectedUnits = [],
    selectedLessonIds = [],
  } = route.params || {};

  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [timedMode, setTimedMode] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!selectedTypeId && quizTypes.length > 0) {
      const defaultType = quizTypes.find((qt: QuizType) => qt.isDefault) || quizTypes[0];
      setSelectedTypeId(defaultType.id);
    }
  }, [quizTypes, selectedTypeId]);

  const handleStartQuiz = async () => {
    if (!selectedTypeId || !subject) return;
    try {
      setStarting(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      const result = await tryFetchWithFallback(
        `mutation StartQuiz($subjectId: ID!, $lessonIds: [ID!]!, $quizTypeId: ID) { startQuiz(subjectId: $subjectId, lessonIds: $lessonIds, quizTypeId: $quizTypeId) { id } }`,
        { subjectId: subject.id, lessonIds: selectedLessonIds, quizTypeId: selectedTypeId },
        token,
      );
      if (result.data?.startQuiz) {
        const quizId = result.data.startQuiz.id;
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          }),
        );
        setTimeout(() => {
          navigation.navigate('QuizTaking', { quizId, isTimed: timedMode });
        }, 500);
      } else {
        showConfirm({
          title: t('common.error'),
          message: t('quiz_screen.error_loading_history'),
          showCancel: false,
          onConfirm: () => {},
        });
      }
    } catch (error: any) {
      showConfirm({
        title: t('common.error'),
        message: error.message || t('quiz_screen.error_loading_history'),
        showCancel: false,
        onConfirm: () => {},
      });
    } finally {
      setStarting(false);
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
    <View style={currentStyles.container}>
      <UnifiedHeader
        title={t('quiz_lessons.quiz_settings')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        centerAlign={true}
      />

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={currentStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.heroSection}>
          <Text style={currentStyles.heroTitle}>{t('quiz_lessons.configure_quiz_title')}</Text>
          <Text style={currentStyles.heroSubtitle}>{t('quiz_lessons.customize_experience')}</Text>
        </View>

        {subject?.name ? (
          <View style={currentStyles.subjectBadgeCard}>
            <View style={currentStyles.subjectBadgeIconContainer}>
              <Ionicons name="book" size={24} color={theme.colors.textOnDark} />
            </View>
            <View style={currentStyles.subjectBadgeInfo}>
              <Text style={currentStyles.subjectBadgeLabel}>{t('quiz_lessons.current_topic')}</Text>
              <Text style={currentStyles.subjectBadgeTitle}>{subject.name}</Text>
            </View>
          </View>
        ) : null}

        {selectedUnits && selectedUnits.length > 0 && (
          <View style={currentStyles.breadcrumbsContainer}>
            {selectedUnits.map((unit: SelectedUnit) => (
              <View key={unit.id} style={currentStyles.unitBreadcrumb}>
                <View style={currentStyles.unitBreadcrumbHeader}>
                  <View style={currentStyles.breadcrumbDot} />
                  <Text style={currentStyles.unitBreadcrumbName}>{unit.name}</Text>
                </View>
                <View style={currentStyles.lessonBreadcrumbsList}>
                  {unit.lessons.map((lesson: SelectedLesson) => (
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

        <View style={currentStyles.sectionContainer}>
          <Text style={currentStyles.sectionTitle}>{t('quiz_lessons.select_quiz_type')}</Text>
          <View style={currentStyles.optionsContainer}>
            {quizTypes.map((type: QuizType) => {
              const isSelected = selectedTypeId === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[currentStyles.optionCard, isSelected && currentStyles.optionCardSelected]}
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
      </ScrollView>

      <View style={currentStyles.actionArea}>
        <AppButton
          title={t('quiz_lessons.start_quiz')}
          onPress={handleStartQuiz}
          disabled={!selectedTypeId || starting}
          loading={starting}
          size="lg"
          icon={<Ionicons name="play" size={20} color={theme.colors.textOnDark} />}
          iconPosition={isRTL ? 'left' : 'right'}
        />
        <Text style={currentStyles.disclaimerText}>{t('quiz_lessons.progress_saved')}</Text>
      </View>
    </View>
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
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
      alignItems: 'stretch', // Critical for preventing the "right-align jump"
    },
    heroSection: {
      marginBottom: spacing.xl,
      width: '100%',
    },
    heroTitle: {
      fontSize: Math.max(24, fontSizes.xl),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: spacing.md,
      textAlign: 'left',
    },
    heroSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'left',
      lineHeight: 22,
    },
    subjectBadgeCard: {
      flexDirection: 'row', // Let React Native handle the flip
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '0D',
      borderWidth: 1,
      borderColor: theme.colors.primary + '1A',
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
    },
    subjectBadgeInfo: {
      flex: 1,
      paddingStart: spacing.md, // Use paddingStart instead of gap for better RTL support
      alignItems: 'flex-start',
    },
    subjectBadgeLabel: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.primary,
      textTransform: 'uppercase',
      textAlign: isRTL ? 'right' : 'left',
    },
    subjectBadgeTitle: {
      fontSize: Math.max(16, fontSizes.lg),
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    breadcrumbsContainer: {
      marginBottom: spacing.lg,
    },
    unitBreadcrumb: {
      marginBottom: spacing.sm,
    },
    unitBreadcrumbHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      flexShrink: 1,
    },
    breadcrumbDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginEnd: spacing.sm,
    },
    unitBreadcrumbName: {
      ...typography('subtitle2'),
      ...fontWeight('700'),
      color: theme.colors.text,
      flexShrink: 1,
      textAlign: 'left',
    },
    lessonBreadcrumbsList: {
      paddingStart: spacing.md,
      paddingVertical: spacing.xs,
    },
    lessonBreadcrumbItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
      flexShrink: 1,
    },
    lessonBreadcrumbDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.textTertiary,
      marginEnd: spacing.sm,
    },
    lessonBreadcrumbName: {
      ...typography('caption'),
      fontSize: 13,
      color: theme.colors.textSecondary,
      flexShrink: 1,
      textAlign: 'left',
    },
    sectionContainer: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography('h3'),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: spacing.md,
      textAlign: 'left',
    },
    optionsContainer: {
      width: '100%',
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      borderRadius: borderRadius.xl || 16,
      backgroundColor: theme.colors.card,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginBottom: spacing.md,
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '05',
    },
    optionInfo: {
      flex: 1,
      alignItems: 'flex-start',
    },
    optionTitle: {
      fontSize: Math.max(16, fontSizes.lg),
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    optionTitleSelected: {
      color: theme.colors.primary,
    },
    optionSubtitle: {
      ...typography('caption'),
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: isRTL ? 'right' : 'left',
    },
    radioButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginStart: spacing.md,
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
      paddingTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingIcon: {
      marginEnd: spacing.sm,
    },
    settingLabel: {
      ...typography('body'),
      ...fontWeight('500'),
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
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
    toggleThumbActive: {},
    toggleThumbInactive: {},
    actionArea: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.lg,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    disclaimerText: {
      ...typography('caption'),
      fontSize: 12,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
  });

export default QuizSettingsScreen;
