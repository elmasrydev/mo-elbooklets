import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
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
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';
import { GenericListSkeleton } from '../../components/SkeletonLoader';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';

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
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [subject?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      const [lessonsResult, quizTypesResult] = await Promise.all([
        tryFetchWithFallback(
          `query LessonsForSubject($subjectId: ID!) { lessonsForSubject(subjectId: $subjectId) { id name description lessons { id name description } } }`,
          { subjectId: subject.id },
          token,
        ),
        tryFetchWithFallback(
          `query QuizTypes { quizTypes { id name slug question_count is_default } }`,
          undefined,
          token,
        ),
      ]);
      if (lessonsResult.data?.lessonsForSubject) setChapters(lessonsResult.data.lessonsForSubject);
      else setError(lessonsResult.errors?.[0]?.message || t('quiz_lessons.error_loading_lessons'));
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

  const handleChapterToggle = (chapter: Chapter) => {
    const chapterLessonIds = chapter.lessons.map((lesson) => lesson.id);
    const newSelected = new Set(selectedLessons);
    const allSelected = chapterLessonIds.every((id) => newSelected.has(id));
    if (allSelected) chapterLessonIds.forEach((id) => newSelected.delete(id));
    else chapterLessonIds.forEach((id) => newSelected.add(id));
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
  );

  if (loading)
    return (
      <View style={common.container}>
        <UnifiedHeader title={t('quiz_lessons.header_title')} />
        <View style={{ paddingTop: 16 }}>
          <GenericListSkeleton numItems={6} />
        </View>
      </View>
    );

  return (
    <View style={common.container}>
      <UnifiedHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title={t('quiz_lessons.header_title')}
        subtitle={subject?.name}
      />

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={{
          padding: layout.screenPadding,
          paddingBottom: Math.max(insets.bottom + 100, spacing.xl),
        }}
        showsVerticalScrollIndicator={false}
      >
        {chapters.map((chapter: Chapter) => {
          const chapterLessonIds = chapter.lessons.map((lesson) => lesson.id);
          const selectedInChapter = chapterLessonIds.filter((id) => selectedLessons.has(id)).length;
          const allSelected =
            selectedInChapter === chapterLessonIds.length && chapterLessonIds.length > 0;
          const someSelected = selectedInChapter > 0;
          const progressPercentage =
            chapterLessonIds.length > 0 ? (selectedInChapter / chapterLessonIds.length) * 100 : 0;

          return (
            <View key={chapter.id} style={currentStyles.chapterGroup}>
              {/* Unit Card */}
              <TouchableOpacity
                style={currentStyles.unitCard}
                onPress={() => handleChapterToggle(chapter)}
                activeOpacity={0.7}
              >
                <View style={currentStyles.unitContent}>
                  <Text style={currentStyles.unitName}>{chapter.name}</Text>
                  <View style={currentStyles.unitStatsRow}>
                    <Text style={currentStyles.unitStatsText}>
                      {selectedInChapter}/{chapterLessonIds.length}{' '}
                      {t('quiz_lessons.lessons_selected', 'lessons selected')}
                    </Text>
                    <View
                      style={[
                        currentStyles.progressBarBackground,
                        { transform: [{ scaleX: contentAlign === 'right' ? -1 : 1 }] },
                      ]}
                    >
                      <View
                        style={[
                          currentStyles.progressBarFill,
                          {
                            width: `${progressPercentage}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
                <View
                  style={[
                    currentStyles.checkboxBase,
                    someSelected || allSelected ? currentStyles.checkboxSelected : null,
                  ]}
                >
                  {(someSelected || allSelected) && (
                    <Ionicons name={allSelected ? 'checkmark' : 'remove'} size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Lesson Cards */}
              <View style={currentStyles.lessonsList}>
                {chapter.lessons.map((lesson: Lesson) => {
                  const isSelected = selectedLessons.has(lesson.id);
                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      style={currentStyles.lessonCard}
                      onPress={() => {
                        const newSelected = new Set(selectedLessons);
                        isSelected ? newSelected.delete(lesson.id) : newSelected.add(lesson.id);
                        setSelectedLessons(newSelected);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={currentStyles.lessonContent}>
                        <Text style={currentStyles.lessonName}>{lesson.name}</Text>
                      </View>
                      <View
                        style={[
                          currentStyles.checkboxBase,
                          isSelected ? currentStyles.checkboxSelected : null,
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Divider between Units */}
              <View style={currentStyles.unitDivider} />
            </View>
          );
        })}

        {chapters.length === 0 && (
          <View style={currentStyles.emptyState}>
            <Ionicons
              name="book-outline"
              size={spacing.icon.xl}
              color={theme.colors.textTertiary}
            />
            <Text style={currentStyles.emptyStateTitle}>
              {' '}
              {t('quiz_lessons.no_lessons_available')}{' '}
            </Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {' '}
              {t('quiz_lessons.no_lessons_for_subject')}{' '}
            </Text>
          </View>
        )}
      </ScrollView>

      {selectedLessons.size > 0 && (
        <View style={currentStyles.footer}>
          <AppButton
            title={`${t('quiz_lessons.prepare_quiz')} (${selectedLessons.size})`}
            onPress={() => handlePrepareQuiz()}
            icon={
              <Ionicons
                name={isRTL ? 'arrow-back' : 'arrow-forward'}
                size={spacing.icon.sm}
                color={theme.colors.textOnDark}
              />
            }
            iconPosition="right"
          />
        </View>
      )}
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
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: {
      marginTop: spacing.md,
      ...typography('body'),
      color: theme.colors.textSecondary,
    },
    content: { flex: 1 },
    chapterGroup: {
      marginBottom: spacing.xs,
    },
    unitCard: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    unitContent: {
      flex: 1,
      marginRight: isContentRTL ? 0 : spacing.md,
      marginLeft: isContentRTL ? spacing.md : 0,
      alignItems: contentFlexAlign,
    },
    unitName: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: spacing.xs,
      textAlign: contentAlign,
    },
    unitStatsRow: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
    },
    unitStatsText: {
      ...typography('caption'),
      color: theme.colors.primary,
      opacity: 0.8,
      marginRight: isContentRTL ? 0 : spacing.sm,
      marginLeft: isContentRTL ? spacing.sm : 0,
      fontSize: 12,
    },
    progressBarBackground: {
      height: 6,
      width: 96,
      backgroundColor: theme.colors.border,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    lessonsList: {
      flexDirection: 'column',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    lessonCard: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    lessonContent: {
      flex: 1,
      marginRight: isContentRTL ? 0 : spacing.md,
      marginLeft: isContentRTL ? spacing.md : 0,
      alignItems: contentFlexAlign,
    },
    lessonName: {
      ...typography('button'),
      ...fontWeight('500'),
      color: theme.colors.text,
      textAlign: contentAlign,
    },
    checkboxBase: {
      height: 24,
      width: 24,
      borderRadius: borderRadius.md || 8,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    checkboxSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    unitDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      opacity: 0.5,
      marginVertical: spacing.md,
    },
    emptyState: { padding: spacing.xl, alignItems: 'center', marginTop: spacing.xl },
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
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      ...layout.shadow,
    },
  });

export default QuizLessonsScreen;
