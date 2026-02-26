import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';
import { Ionicons } from '@expo/vector-icons';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { layout } from '../../config/layout';
import { useTypography } from '../../hooks/useTypography';
import QuizSettingsModal from '../../components/QuizSettingsModal';
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';

interface Subject {
  id: string;
  name: string;
  description?: string;
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
interface QuizLessonsScreenProps {
  subject: Subject;
  onLessonsSelect: (lessonIds: string[], quizTypeId?: string) => void;
  onBack: () => void;
}

const QuizLessonsScreen: React.FC<QuizLessonsScreenProps> = ({
  subject,
  onLessonsSelect,
  onBack,
}) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [subject.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('auth_token');
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

  const handleStartQuiz = (quizTypeId: string) => {
    setSettingsModalVisible(false);
    setTimeout(() => {
      onLessonsSelect(Array.from(selectedLessons), quizTypeId);
    }, 500);
  };

  const currentStyles = styles(theme, common, typography, spacing, borderRadius, insets);

  if (loading)
    return (
      <View style={common.container}>
        <UnifiedHeader isModal title={t('quiz_lessons.header_title')} />
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('quiz_lessons.loading_lessons')} </Text>
        </View>
      </View>
    );

  return (
    <View style={common.container}>
      <UnifiedHeader
        isModal
        showBackButton
        onBackPress={onBack}
        title={t('quiz_lessons.header_title')}
        subtitle={subject.name}
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

          return (
            <View key={chapter.id} style={currentStyles.chapterCard}>
              <TouchableOpacity
                style={currentStyles.chapterHeader}
                onPress={() => handleChapterToggle(chapter)}
                activeOpacity={0.7}
              >
                <View style={currentStyles.chapterCheckbox}>
                  <Ionicons
                    name={
                      allSelected ? 'checkbox' : someSelected ? 'remove-circle' : 'square-outline'
                    }
                    size={spacing.icon.md}
                    color={
                      allSelected || someSelected ? theme.colors.primary : theme.colors.textTertiary
                    }
                  />
                </View>
                <View style={currentStyles.chapterHeaderContent}>
                  <Text style={currentStyles.chapterName}> {chapter.name} </Text>
                  <Text style={currentStyles.chapterStats}>
                    {selectedInChapter} / {chapterLessonIds.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={currentStyles.lessonsContainer}>
                {chapter.lessons.map((lesson: Lesson) => {
                  const isSelected = selectedLessons.has(lesson.id);
                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      style={[
                        currentStyles.lessonItem,
                        isSelected && currentStyles.lessonItemSelected,
                      ]}
                      onPress={() => {
                        const newSelected = new Set(selectedLessons);
                        isSelected ? newSelected.delete(lesson.id) : newSelected.add(lesson.id);
                        setSelectedLessons(newSelected);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={currentStyles.lessonCheckbox}>
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={spacing.icon.sm}
                          color={isSelected ? theme.colors.primary : theme.colors.textTertiary}
                        />
                      </View>
                      <Text
                        style={[
                          currentStyles.lessonName,
                          isSelected && currentStyles.lessonNameSelected,
                        ]}
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
            onPress={() => setSettingsModalVisible(true)}
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

      <QuizSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        onStart={handleStartQuiz}
        quizTypes={quizTypes}
      />
    </View>
  );
};

const styles = (
  theme: any,
  common: any,
  typography: any,
  spacing: any,
  borderRadius: any,
  insets: any,
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
    chapterCard: {
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sectionGap,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      ...layout.shadow,
    },
    chapterHeader: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    chapterHeaderContent: { flex: 1, alignItems: common.alignStart },
    chapterCheckbox: { padding: spacing.xxs, ...common.marginEnd(spacing.xs) },
    chapterName: {
      ...typography('body'),
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    chapterStats: {
      ...typography('caption'),
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: common.textAlign,
    },
    lessonsContainer: { paddingVertical: spacing.xxs },
    lessonItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    lessonItemSelected: { backgroundColor: theme.colors.primary + '0D' },
    lessonCheckbox: { ...common.marginEnd(spacing.sm) },
    lessonName: {
      ...typography('caption'),
      flex: 1,
      color: theme.colors.text,
      textAlign: common.textAlign,
      fontSize: 14,
    },
    lessonNameSelected: { color: theme.colors.primary, fontWeight: '700' },
    emptyState: { padding: spacing.xl, alignItems: 'center', marginTop: spacing.xl },
    emptyStateTitle: {
      ...typography('h3'),
      fontWeight: 'bold',
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
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.lg,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
  });

export default QuizLessonsScreen;
