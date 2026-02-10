import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { layout } from '../../config/layout';
import { tryFetchWithFallback } from '../../config/api';
import { Ionicons } from '@expo/vector-icons';
import QuizSettingsModal from '../../components/QuizSettingsModal';

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
  const { t } = useTranslation();
  const common = useCommonStyles();
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
    onLessonsSelect(Array.from(selectedLessons), quizTypeId);
  };

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius);

  if (loading)
    return (
      <View style={common.container}>
        <View style={common.header}>
          <View style={common.headerTextWrapper}>
            <Text style={common.headerTitle}> {t('quiz_lessons.header_title')} </Text>
          </View>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('quiz_lessons.loading_lessons')} </Text>
        </View>
      </View>
    );

  return (
    <View style={common.container}>
      <View style={common.header}>
        <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
          <Ionicons
            name={common.isRTL ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
        <View style={common.headerTextWrapper}>
          <Text style={common.headerTitle}> {t('quiz_lessons.header_title')} </Text>
          <Text style={common.headerSubtitle}> {subject.name} </Text>
        </View>
      </View>

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={{ padding: layout.screenPadding, paddingBottom: 100 }}
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
                <View style={currentStyles.chapterHeaderContent}>
                  <Text style={currentStyles.chapterName}> {chapter.name} </Text>
                  <Text style={currentStyles.chapterStats}>
                    {selectedInChapter} / {chapterLessonIds.length}
                  </Text>
                </View>
                <View style={currentStyles.chapterCheckbox}>
                  <Ionicons
                    name={
                      allSelected ? 'checkbox' : someSelected ? 'remove-circle' : 'square-outline'
                    }
                    size={24}
                    color={
                      allSelected || someSelected ? theme.colors.primary : theme.colors.textTertiary
                    }
                  />
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
                          size={20}
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
              size={48}
              color={theme.colors.textSecondary}
              style={{ marginBottom: 16 }}
            />
            <Text style={currentStyles.emptyStateTitle}>
              {t('quiz_lessons.no_lessons_available')}
            </Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {t('quiz_lessons.no_lessons_for_subject')}
            </Text>
          </View>
        )}
      </ScrollView>

      {selectedLessons.size > 0 && (
        <View style={currentStyles.footer}>
          <TouchableOpacity
            style={currentStyles.prepareButton}
            onPress={() => setSettingsModalVisible(true)}
          >
            <Text style={currentStyles.prepareButtonText}>
              {t('quiz_lessons.prepare_quiz')}({selectedLessons.size})
            </Text>
            <Ionicons
              name={common.isRTL ? 'arrow-back' : 'arrow-forward'}
              size={20}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
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

const styles = (theme: any, common: any, fontSizes: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: fontSizes.base, color: theme.colors.textSecondary },

    // Header
    backButton: {
      padding: 8,
      marginRight: common.isRTL ? 0 : 16,
      marginLeft: common.isRTL ? 16 : 0,
    },

    // Content
    content: {
      flex: 1,
      marginTop: -30,
    },
    chapterCard: {
      borderRadius: layout.borderRadius.xl,
      marginBottom: spacing.lg,
      backgroundColor: '#F9FAFB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    chapterHeader: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    chapterHeaderContent: {
      flex: 1,
      alignItems: common.alignStart,
    },
    chapterCheckbox: {
      padding: 4,
    },
    chapterName: {
      fontSize: fontSizes.base,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    chapterStats: {
      fontSize: fontSizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: common.textAlign,
    },

    // Lessons
    lessonsContainer: {
      paddingVertical: spacing.sm,
    },
    lessonItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
    },
    lessonItemSelected: {
      backgroundColor: theme.colors.primaryLight || 'rgba(59, 130, 246, 0.05)',
    },
    lessonCheckbox: {
      ...common.marginEnd(12),
    },
    lessonName: {
      fontSize: fontSizes.sm,
      flex: 1,
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    lessonNameSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },

    // Empty State
    emptyState: {
      padding: 40,
      alignItems: 'center',
      marginTop: 60,
    },
    emptyStateTitle: {
      fontSize: fontSizes.lg,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    emptyStateSubtitle: {
      fontSize: fontSizes.sm,
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },

    // Footer
    footer: {
      padding: spacing.xl,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    prepareButton: {
      flexDirection: common.rowDirection,
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: borderRadius.xl,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    prepareButtonText: {
      color: '#fff',
      fontSize: fontSizes.base,
      fontWeight: 'bold',
    },
  });

export default QuizLessonsScreen;
