import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';

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

interface QuizLessonsScreenProps {
  subject: Subject;
  onLessonsSelect: (lessonIds: string[]) => void;
  onBack: () => void;
}

const QuizLessonsScreen: React.FC<QuizLessonsScreenProps> = ({ subject, onLessonsSelect, onBack }) => {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLessons();
  }, [subject.id]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setError(t('common.error'));
        return;
      }

      const result = await tryFetchWithFallback(`
        query LessonsForSubject($subjectId: ID!) {
          lessonsForSubject(subjectId: $subjectId) {
            id
            name
            description
            lessons {
              id
              name
              description
            }
          }
        }
      `, { subjectId: subject.id }, token);
      if (result.data?.lessonsForSubject) {
        setChapters(result.data.lessonsForSubject);
      } else {
        setError(result.errors?.[0]?.message || t('quiz_lessons.error_loading_lessons'));
      }
    } catch (err: any) {
      console.error('Fetch lessons error:', err);
      setError(err.message || t('quiz_lessons.error_loading_lessons'));
    } finally {
      setLoading(false);
    }
  };

  const handleLessonToggle = (lessonId: string) => {
    const newSelected = new Set(selectedLessons);
    if (newSelected.has(lessonId)) {
      newSelected.delete(lessonId);
    } else {
      newSelected.add(lessonId);
    }
    setSelectedLessons(newSelected);
  };

  const handleChapterToggle = (chapter: Chapter) => {
    const chapterLessonIds = chapter.lessons.map(lesson => lesson.id);
    const newSelected = new Set(selectedLessons);
    
    const allSelected = chapterLessonIds.every(id => newSelected.has(id));
    
    if (allSelected) {
      chapterLessonIds.forEach(id => newSelected.delete(id));
    } else {
      chapterLessonIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedLessons(newSelected);
  };

  const handleStartQuiz = () => {
    if (selectedLessons.size === 0) {
      Alert.alert(t('quiz_lessons.no_lessons_selected'), t('quiz_lessons.select_at_least_one'));
      return;
    }
    
    onLessonsSelect(Array.from(selectedLessons));
  };

  const currentStyles = styles(theme, isRTL);

  if (loading) {
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('quiz_lessons.header_title')}</Text>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>{t('quiz_lessons.loading_lessons')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('quiz_lessons.header_title')}</Text>
        </View>
        <View style={currentStyles.errorContainer}>
          <Text style={currentStyles.errorIcon}>⚠️</Text>
          <Text style={currentStyles.errorTitle}>{t('quiz_lessons.error_loading_lessons')}</Text>
          <Text style={currentStyles.errorText}>{error}</Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchLessons}>
            <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={currentStyles.container}>
      <View style={currentStyles.header}>
        <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
          <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={currentStyles.headerTitle}>{t('quiz_lessons.header_title')}</Text>
        <Text style={currentStyles.headerSubtitle}>{subject.name}</Text>
      </View>

      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        {chapters.map((chapter: Chapter) => {
          const chapterLessonIds = chapter.lessons.map(lesson => lesson.id);
          const selectedInChapter = chapterLessonIds.filter(id => selectedLessons.has(id)).length;
          const allSelected = selectedInChapter === chapterLessonIds.length;
          const someSelected = selectedInChapter > 0;

          return (
            <View key={chapter.id} style={currentStyles.chapterCard}>
              <TouchableOpacity
                style={currentStyles.chapterHeader}
                onPress={() => handleChapterToggle(chapter)}
              >
                <View style={currentStyles.chapterLeft}>
                  <View style={[
                    currentStyles.checkbox,
                    allSelected && currentStyles.checkboxSelected,
                    someSelected && !allSelected && currentStyles.checkboxPartial
                  ]}>
                    {allSelected && <Text style={currentStyles.checkmark}>✓</Text>}
                    {someSelected && !allSelected && <Text style={currentStyles.partialMark}>−</Text>}
                  </View>
                  <View style={currentStyles.chapterInfo}>
                    <Text style={currentStyles.chapterName}>{chapter.name}</Text>
                    <Text style={currentStyles.chapterStats}>
                      {selectedInChapter}/{chapterLessonIds.length} {t('quiz_lessons.lessons_selected', { count: selectedInChapter, total: chapterLessonIds.length }).split('/')[1]?.trim() || 'lessons selected'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={currentStyles.lessonsContainer}>
                {chapter.lessons.map((lesson: Lesson) => {
                  const isSelected = selectedLessons.has(lesson.id);
                  
                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      style={currentStyles.lessonItem}
                      onPress={() => handleLessonToggle(lesson.id)}
                    >
                      <View style={[
                        currentStyles.checkbox,
                        isSelected && currentStyles.checkboxSelected
                      ]}>
                        {isSelected && <Text style={currentStyles.checkmark}>✓</Text>}
                      </View>
                      <Text style={currentStyles.lessonName}>{lesson.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {chapters.length === 0 && (
          <View style={currentStyles.emptyState}>
            <Text style={currentStyles.emptyStateIcon}>📚</Text>
            <Text style={currentStyles.emptyStateTitle}>{t('quiz_lessons.no_lessons_available')}</Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {t('quiz_lessons.no_lessons_for_subject')}
            </Text>
          </View>
        )}
      </ScrollView>

      {selectedLessons.size > 0 && (
        <View style={currentStyles.footer}>
          <TouchableOpacity style={currentStyles.startQuizButton} onPress={handleStartQuiz}>
            <Text style={currentStyles.startQuizButtonText}>
              {selectedLessons.size === 1 
                ? t('quiz_lessons.start_quiz_count', { count: selectedLessons.size })
                : t('quiz_lessons.start_quiz_count_plural', { count: selectedLessons.size })}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = (theme: any, isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.headerText,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
    marginTop: 4,
    color: theme.colors.headerSubtitle,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  chapterCard: {
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chapterHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  chapterLeft: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  chapterInfo: {
    flex: 1,
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  chapterName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text,
  },
  chapterStats: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  lessonsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  lessonItem: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  lessonName: {
    fontSize: 14,
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    flex: 1,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: theme.colors.checkboxBorder,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.checkboxSelected,
    borderColor: theme.colors.checkboxSelected,
  },
  checkboxPartial: {
    borderColor: theme.colors.checkboxPartial,
  },
  checkmark: {
    color: theme.colors.checkboxSelectedText,
    fontSize: 14,
    fontWeight: 'bold',
  },
  partialMark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.checkboxPartial,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  startQuizButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.buttonPrimary,
  },
  startQuizButtonText: {
    color: theme.colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: theme.colors.card,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.buttonPrimary,
  },
  retryButtonText: {
    color: theme.colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizLessonsScreen;
