import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { tryFetchWithFallback } from '../../config/api';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';

import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';
import { layout } from '../../config/layout';
import { useModal } from '../../context/ModalContext';
import { useSubscriptionGate } from '../../hooks/useSubscriptionGate';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';

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
    quizTypes: passedQuizTypes,
    selectedUnits = [],
    selectedLessonIds = [],
  } = route.params || {};

  const [quizTypes, setQuizTypes] = useState<QuizType[]>(passedQuizTypes || []);
  const [loadingTypes, setLoadingTypes] = useState(
    !passedQuizTypes || passedQuizTypes.length === 0,
  );

  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const { checkSubscription } = useSubscriptionGate();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [timedMode, setTimedMode] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  const fetchQuizTypes = useCallback(async () => {
    try {
      setLoadingTypes(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      const result = await tryFetchWithFallback(
        `query QuizTypes { quizTypes { id name slug question_count is_default } }`,
        undefined,
        token,
      );
      if (result.data?.quizTypes) {
        setQuizTypes(
          result.data.quizTypes.map((qt: any) => ({
            id: qt.id,
            name: qt.name,
            slug: qt.slug,
            questionCount: qt.question_count,
            isDefault: qt.is_default,
          })),
        );
      }
    } catch (err) {
      console.error('Fetch quiz types error:', err);
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    if (!passedQuizTypes || passedQuizTypes.length === 0) {
      fetchQuizTypes();
    }
  }, [passedQuizTypes, fetchQuizTypes]);

  useEffect(() => {
    if (!selectedTypeId && quizTypes.length > 0) {
      const defaultType = quizTypes.find((qt: QuizType) => qt.isDefault) || quizTypes[0];
      setSelectedTypeId(defaultType.id);
    }
  }, [quizTypes, selectedTypeId]);

  const handleStartQuiz = async () => {
    if (!checkSubscription({ skipModal: true })) {
      setShowSubModal(true);
      return;
    }
    if (!selectedTypeId || !subject) return;
    try {
      setStarting(true);
      const token = await SecureStore.getItemAsync('auth_token');
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

  const { contentAlign, contentFlexAlign, contentRowDirection, isContentRTL } = useSubjectTextAlign(
    subject?.language,
  );

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
    contentAlign,
    contentFlexAlign,
    contentRowDirection,
    !!isContentRTL,
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

        {/* 1. Timer Setting */}
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

        {/* 2. Quiz Type Settings */}
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

        {/* 3. Current Subject Badge */}
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

        {/* 4. Breadcrumb (Units & Lessons) */}
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
      </ScrollView>

      <View style={currentStyles.actionArea}>
        <AppButton
          title={t('quiz_lessons.start_quiz')}
          onPress={handleStartQuiz}
          disabled={!selectedTypeId || starting}
          loading={starting}
          size="lg"
        />
      </View>

      <ConfirmModal
        visible={showSubModal}
        icon={<Ionicons name="lock-closed" size={50} color={theme.colors.primary} />}
        title={t('subscription.required_title')}
        message={t('subscription.required_message')}
        confirmLabel={t('common.ok')}
        onConfirm={() => {
          setShowSubModal(false);
          navigation.navigate('MainTabs', { screen: 'SettingsTab' });
        }}
        showCancel={true}
        onCancel={() => setShowSubModal(false)}
      />
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
  contentAlign: 'left' | 'right',
  contentFlexAlign: 'flex-start' | 'flex-end',
  contentRowDirection: 'row' | 'row-reverse',
  isContentRTL: boolean,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { flex: 1 },
    scrollContent: {
      padding: layout.screenPadding,
      paddingBottom: Math.max(insets.bottom + 80, spacing.xl),
    },
    heroSection: {
      marginBottom: spacing.xl,
      marginTop: spacing.md,
      alignItems: 'center',
    },
    heroTitle: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    heroSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.xl,
    },
    additionalSettingsContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 16,
      padding: spacing.md,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    settingRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingInfo: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    settingIcon: {
      marginRight: isRTL ? 0 : spacing.sm,
      marginLeft: isRTL ? spacing.sm : 0,
    },
    settingLabel: {
      ...typography('subtitle1'),
      ...fontWeight('600'),
      color: theme.colors.text,
    },
    toggleTrack: {
      width: 50,
      height: 28,
      borderRadius: 14,
      padding: 2,
      justifyContent: 'center',
    },
    toggleTrackActive: {
      backgroundColor: theme.colors.primary,
    },
    toggleTrackInactive: {
      backgroundColor: theme.colors.border,
    },
    toggleThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      ...layout.shadow,
    },
    toggleThumbActive: {
      alignSelf: isRTL ? 'flex-start' : 'flex-end',
    },
    toggleThumbInactive: {
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
    },
    sectionContainer: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography('subtitle2'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.md,
      textAlign: isRTL ? 'right' : 'left',
    },
    optionsContainer: {
      gap: spacing.sm,
    },
    optionCard: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 16,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '0A',
    },
    optionInfo: {
      flex: 1,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    optionTitle: {
      ...typography('subtitle1'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    optionSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: isRTL ? 'right' : 'left',
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: isRTL ? 0 : spacing.sm,
      marginRight: isRTL ? spacing.sm : 0,
    },
    radioButtonSelected: {
      borderColor: theme.colors.primary,
    },
    radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    subjectBadgeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary + '1A',
      borderRadius: borderRadius.xl || 16,
      padding: spacing.md,
      marginBottom: spacing.xl,
    },
    subjectBadgeIconContainer: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.lg || 12,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    subjectBadgeInfo: {
      flex: 1,
      alignItems: 'flex-start',
    },
    subjectBadgeLabel: {
      ...typography('label'),
      color: theme.colors.primary,
      textTransform: 'uppercase',
      textAlign: contentAlign,
    },
    subjectBadgeTitle: {
      ...typography('subtitle1'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: contentAlign,
    },
    breadcrumbsContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 16,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    unitBreadcrumb: {
      marginBottom: spacing.sm,
    },
    unitBreadcrumbHeader: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    breadcrumbDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginRight: isContentRTL ? 0 : spacing.sm,
      marginLeft: isContentRTL ? spacing.sm : 0,
    },
    unitBreadcrumbName: {
      ...typography('subtitle2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: contentAlign,
    },
    lessonBreadcrumbsList: {
      paddingLeft: isContentRTL ? 0 : spacing.md,
      paddingRight: isContentRTL ? spacing.md : 0,
    },
    lessonBreadcrumbItem: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      marginBottom: 4,
    },
    lessonBreadcrumbDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.textTertiary,
      marginRight: isContentRTL ? 0 : spacing.sm,
      marginLeft: isContentRTL ? spacing.sm : 0,
    },
    lessonBreadcrumbName: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: contentAlign,
    },
    actionArea: {
      padding: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });

export default QuizSettingsScreen;
