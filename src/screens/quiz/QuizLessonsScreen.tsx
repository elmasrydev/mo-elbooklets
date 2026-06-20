import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';
import { Ionicons } from '@expo/vector-icons';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { layout } from '../../config/layout';
import { useTypography } from '../../hooks/useTypography';
import QuizFlowHeader from '../../components/QuizFlowHeader';
import AppButton from '../../components/AppButton';
import { GenericListSkeleton } from '../../components/SkeletonLoader';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';
import { getSubjectConfig } from '../../utils/subjectTheme';
import { useSubscriptionGate } from '../../hooks/useSubscriptionGate';
import { useModal } from '../../context/ModalContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import SubjectIcon from '../../components/SubjectIcon';

interface Subject {
  id: string;
  name: string;
  description?: string;
  language?: string;
}
interface Lesson {
  id: string;
  name: string;
  description?: string;
  isLocked?: boolean;
}
interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
}
interface QuizType {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
  isDefault: boolean;
}

const QuizLessonsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const subject = route.params?.subject;
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const { checkSubscription } = useSubscriptionGate();
  const { showConfirm } = useModal();

  const showLockedDisclaimer = () => {
    setShowSubModal(true);
  };

  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subject) {
      navigation.navigate('QuizFlowSubjects');
      return;
    }
    fetchData();
  }, [subject]);

  const fetchData = async () => {
    try {
      if (!subject?.id) return;
      setLoading(true);
      setError(null);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      const [lessonsResult, quizTypesResult] = await Promise.all([
        tryFetchWithFallback(
          `query LessonsForSubject($subjectId: ID!) { lessonsForSubject(subjectId: $subjectId) { id name description lessons { id name description isLocked } } }`,
          { subjectId: subject.id },
          token,
        ),
        tryFetchWithFallback(
          `query QuizTypes { quizTypes { id name slug question_count is_default } }`,
          undefined,
          token,
        ),
      ]);
      if (lessonsResult.data?.lessonsForSubject) {
        setChapters(lessonsResult.data.lessonsForSubject);
      } else {
        setError(lessonsResult.errors?.[0]?.message || t('quiz_lessons.error_loading_lessons'));
      }
      if (quizTypesResult.data?.quizTypes) {
        setQuizTypes(
          quizTypesResult.data.quizTypes.map((qt: any) => ({
            id: qt.id,
            name: qt.name,
            slug: qt.slug,
            questionCount: qt.question_count,
            isDefault: qt.is_default,
          })),
        );
      }
    } catch (err: any) {
      setError(t('quiz_lessons.error_loading_lessons'));
    } finally {
      setLoading(false);
    }
  };

  // Tapping a unit selects/deselects all of its unlocked lessons.
  const handleChapterToggle = (chapter: Chapter) => {
    const isFreePlan = !checkSubscription({ skipModal: true });
    const hasLocked = chapter.lessons.some((l) => l.isLocked);
    if (isFreePlan && hasLocked) {
      showLockedDisclaimer();
      return;
    }
    const unlockedLessonIds = chapter.lessons.filter((l) => !l.isLocked).map((l) => l.id);
    if (unlockedLessonIds.length === 0) return;
    const newSelected = new Set(selectedLessons);
    const allSelected = unlockedLessonIds.every((id) => newSelected.has(id));
    if (allSelected) {
      unlockedLessonIds.forEach((id) => newSelected.delete(id));
    } else {
      unlockedLessonIds.forEach((id) => newSelected.add(id));
    }
    setSelectedLessons(newSelected);
  };

  const toggleLesson = (lesson: Lesson) => {
    if (lesson.isLocked) {
      showLockedDisclaimer();
      return;
    }
    const newSelected = new Set(selectedLessons);
    if (newSelected.has(lesson.id)) {
      newSelected.delete(lesson.id);
    } else {
      newSelected.add(lesson.id);
    }
    setSelectedLessons(newSelected);
  };

  const handlePrepareQuiz = () => {
    navigation.navigate('QuizFlowSettings', {
      subject,
      quizTypes,
      selectedUnits,
      selectedLessonIds: Array.from(selectedLessons),
    });
  };

  const selectedUnits = useMemo(() => {
    return chapters
      .map((chapter) => ({
        id: chapter.id,
        name: chapter.name,
        lessons: chapter.lessons.filter((lesson) => selectedLessons.has(lesson.id)),
      }))
      .filter((chapter) => chapter.lessons.length > 0);
  }, [chapters, selectedLessons]);

  const { contentAlign, contentFlexAlign, contentRowDirection, isContentRTL } = useSubjectTextAlign(
    subject?.language,
  );

  const subjectConfig = getSubjectConfig(subject?.name || '', theme);

  const currentStyles = styles(
    theme,
    common,
    typography,
    fontWeight,
    fontSizes,
    spacing,
    borderRadius,
    insets,
    contentAlign,
    contentFlexAlign,
    contentRowDirection,
    !!isContentRTL,
    subjectConfig,
  );

  if (loading) {
    return (
      <View style={common.container}>
        <QuizFlowHeader currentStep={2} />
        <View style={{ paddingTop: 16 }}>
          <GenericListSkeleton numItems={6} />
        </View>
      </View>
    );
  }

  const unitsText =
    selectedUnits.length === 1
      ? t('quiz_flow.units_count')
      : t('quiz_flow.units_count_plural', { count: selectedUnits.length });

  const lessonsText =
    selectedLessons.size === 1
      ? t('quiz_flow.x_lessons')
      : t('quiz_flow.x_lessons_plural', { count: selectedLessons.size });

  const selectionText = isRTL ? `${unitsText}، ${lessonsText}` : `${unitsText}, ${lessonsText}`;

  return (
    <View style={common.container}>
      <QuizFlowHeader currentStep={2} />

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing.lg,
          paddingBottom: Math.max(insets.bottom + 150, spacing.xl),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Subject context & title */}
        <View style={currentStyles.titleSection}>
          <View style={currentStyles.subjectHeaderRow}>
            <SubjectIcon
              subjectName={subject?.name || ''}
              size={24}
              style={{ marginRight: isContentRTL ? 0 : 8, marginLeft: isContentRTL ? 8 : 0 }}
            />
            <Text style={currentStyles.subjectHeaderName}>{subject?.name}</Text>
          </View>
          <Text style={currentStyles.pageTitle}>{t('quiz_flow.select_units')}</Text>
          <Text style={currentStyles.pageSubtitle}>{t('quiz_flow.select_units_subtitle')}</Text>
        </View>

        {/* Unit & Lesson list — all units are always expanded */}
        <View style={currentStyles.listContainer}>
          {chapters.map((chapter: Chapter) => {
            const chapterLessonIds = chapter.lessons.map((lesson) => lesson.id);
            const unlockedLessonIds = chapter.lessons.filter((l) => !l.isLocked).map((l) => l.id);
            const isChapterLocked = chapter.lessons.length > 0 && unlockedLessonIds.length === 0;
            const selectedInChapter = chapter.lessons.filter((l) =>
              selectedLessons.has(l.id),
            ).length;
            const isUnitSelected = selectedInChapter > 0;
            const isAllUnitSelected =
              selectedInChapter === unlockedLessonIds.length && unlockedLessonIds.length > 0;

            return (
              <View key={chapter.id} style={currentStyles.chapterContainer}>
                {/* Unit Card (checkbox toggles the whole unit) */}
                <TouchableOpacity
                  style={[
                    currentStyles.unitCard,
                    isUnitSelected && currentStyles.unitCardSelected,
                    isChapterLocked && currentStyles.unitCardLocked,
                  ]}
                  onPress={() => handleChapterToggle(chapter)}
                  activeOpacity={0.7}
                >
                  {/* Unit Checkbox */}
                  <View
                    style={[
                      currentStyles.checkbox,
                      isUnitSelected && currentStyles.checkboxSelected,
                      isChapterLocked && currentStyles.checkboxLocked,
                    ]}
                  >
                    {isChapterLocked ? (
                      <Ionicons name="lock-closed" size={12} color="#94A3B8" />
                    ) : (
                      isUnitSelected && (
                        <Ionicons
                          name={isAllUnitSelected ? 'checkmark' : 'remove'}
                          size={14}
                          color="#ffffff"
                        />
                      )
                    )}
                  </View>

                  <View style={currentStyles.unitInfo}>
                    <Text
                      style={[
                        currentStyles.unitName,
                        isChapterLocked && currentStyles.unitNameLocked,
                      ]}
                      numberOfLines={2}
                    >
                      {chapter.name}
                    </Text>
                    {!isChapterLocked && (
                      <Text style={currentStyles.unitStats}>
                        {selectedInChapter}/{chapterLessonIds.length}{' '}
                        {t('quiz_lessons.lessons_selected')}
                      </Text>
                    )}
                    {isChapterLocked && (
                      <Text style={[currentStyles.unitStats, { color: '#94A3B8' }]}>
                        {t('quiz_flow.unit_locked')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Lessons — always visible, each a checkbox row */}
                <View style={currentStyles.lessonsContainer}>
                  {chapter.lessons.map((lesson: Lesson) => {
                    const isLessonSelected = selectedLessons.has(lesson.id);
                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        style={currentStyles.lessonRow}
                        onPress={() => toggleLesson(lesson)}
                        activeOpacity={0.7}
                      >
                        {lesson.isLocked ? (
                          <Ionicons
                            name="lock-closed"
                            size={16}
                            color="#94A3B8"
                            style={{ marginEnd: 10 }}
                          />
                        ) : (
                          <View
                            style={[
                              currentStyles.lessonCheckbox,
                              isLessonSelected && currentStyles.lessonCheckboxSelected,
                            ]}
                          >
                            {isLessonSelected && (
                              <Ionicons name="checkmark" size={12} color="#ffffff" />
                            )}
                          </View>
                        )}
                        <Text
                          style={[
                            currentStyles.lessonName,
                            lesson.isLocked && currentStyles.lessonNameLocked,
                          ]}
                          numberOfLines={2}
                        >
                          {lesson.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        {chapters.length === 0 && (
          <View style={currentStyles.emptyState}>
            <Ionicons name="book-outline" size={32} color={theme.colors.textTertiary} />
            <Text style={currentStyles.emptyStateTitle}>
              {t('quiz_lessons.no_lessons_available')}
            </Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {t('quiz_lessons.no_lessons_for_subject')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Footer */}
      {selectedLessons.size > 0 && (
        <View style={currentStyles.footer}>
          <View style={currentStyles.footerTextContainer}>
            <Text style={currentStyles.footerTitle}>{selectionText}</Text>
          </View>
          <AppButton
            title={t('common.continue', 'Continue')}
            onPress={handlePrepareQuiz}
            style={currentStyles.continueBtn}
            textStyle={currentStyles.continueBtnText}
            icon={
              <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={16} color="#ffffff" />
            }
            iconPosition="right"
          />
        </View>
      )}

      {/* Local Confirm Modal to bypass iOS fullScreenModal backdrop issues */}
      <ConfirmModal
        visible={showSubModal}
        icon={<Ionicons name="lock-closed" size={50} color={theme.colors.primary} />}
        title={t('quiz_flow.locked_lessons_title', 'Upgrade to Pro')}
        message={t(
          'quiz_flow.locked_lessons_message',
          'Some lessons in this unit are locked. Upgrade to the Pro Plan to unlock all content!',
        )}
        confirmLabel={t('common.ok', 'OK')}
        onConfirm={() => {
          setShowSubModal(false);
        }}
        showCancel={false}
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
  contentAlign: 'left' | 'right',
  contentFlexAlign: 'flex-start' | 'flex-end',
  contentRowDirection: 'row' | 'row-reverse',
  isContentRTL: boolean,
  subjectConfig: any,
) =>
  StyleSheet.create({
    content: {
      flex: 1,
    },
    titleSection: {
      marginBottom: spacing.md,
      alignItems: common.alignStart,
    },
    subjectHeaderRow: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: spacing.xs,
    },
    subjectHeaderName: {
      ...typography('bodyLarge'),
      ...fontWeight('900'),
      color: subjectConfig.color || '#004A9A',
      textAlign: 'center',
    },
    pageTitle: {
      fontSize: 24,
      ...fontWeight('900'),
      color: theme.colors.text || '#0F172A',
      marginBottom: spacing.xs,
      textAlign: common.textAlign,
    },
    pageSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary || '#475569',
      textAlign: common.textAlign,
    },
    listContainer: {
      gap: spacing.sm,
    },
    chapterContainer: {
      marginBottom: spacing.xs,
    },
    unitCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card || '#FFFFFF',
      borderRadius: 20,
      padding: spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
      ...layout.shadow,
    },
    unitCardSelected: {
      borderColor: '#004A9A',
      backgroundColor: '#EFF6FF',
    },
    unitCardLocked: {
      backgroundColor: '#F8FAFC',
      borderColor: 'transparent',
    },
    unitNameLocked: {
      color: '#94A3B8',
    },
    checkboxLocked: {
      backgroundColor: '#F1F5F9',
      borderColor: '#E2E8F0',
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: '#cbd5e1',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      marginEnd: 12,
    },
    checkboxSelected: {
      backgroundColor: '#004A9A',
      borderColor: '#004A9A',
    },
    unitInfo: {
      flex: 1,
      justifyContent: 'center',
      alignItems: contentFlexAlign,
    },
    unitName: {
      fontSize: 14,
      ...fontWeight('900'),
      color: theme.colors.text || '#0F172A',
      textAlign: contentAlign,
    },
    unitStats: {
      fontSize: 11,
      ...fontWeight('700'),
      color: '#004A9A',
      marginTop: 2,
    },
    lessonsContainer: {
      backgroundColor: 'transparent',
      marginTop: 4,
      paddingStart: 12,
      gap: 2,
    },
    lessonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
    },
    lessonCheckbox: {
      width: 18,
      height: 18,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: '#cbd5e1',
      alignItems: 'center',
      justifyContent: 'center',
      marginEnd: 10,
      backgroundColor: '#FFFFFF',
    },
    lessonCheckboxSelected: {
      backgroundColor: '#004A9A',
      borderColor: '#004A9A',
    },
    lessonName: {
      fontSize: 12,
      ...fontWeight('600'),
      color: '#475569',
      flex: 1,
      textAlign: contentAlign,
    },
    lessonNameLocked: {
      color: '#94A3B8',
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      start: 0,
      end: 0,
      flexDirection: 'column',
      alignItems: 'stretch',
      padding: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      backgroundColor: theme.colors.card || '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 74, 154, 0.06)',
      ...layout.shadow,
    },
    footerTextContainer: {
      flexDirection: 'column',
      marginBottom: spacing.sm,
      alignItems: common.alignStart,
    },
    footerTitle: {
      ...typography('body'),
      ...fontWeight('900'),
      color: '#004A9A',
      textAlign: common.textAlign,
    },
    continueBtn: {
      height: 44,
      paddingHorizontal: spacing.lg,
      borderRadius: 16,
      backgroundColor: '#004A9A',
    },
    continueBtnText: {
      fontSize: 13,
      ...fontWeight('900'),
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    emptyStateTitle: {
      ...typography('h3'),
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      color: theme.colors.text,
    },
    emptyStateSubtitle: {
      ...typography('caption'),
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
  });

export default QuizLessonsScreen;
