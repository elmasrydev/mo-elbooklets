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

const QuizLessonsScreen: React.FC<QuizLessonsScreenProps> = ({ subject, onLessonsSelect, onBack }) => {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [selectedQuizTypeId, setSelectedQuizTypeId] = useState<string | null>(null);
  const [showQuizTypes, setShowQuizTypes] = useState(false);
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
      if (!token) {
        setError(t('common.error'));
        return;
      }

      // Fetch lessons and quiz types in parallel
      const [lessonsResult, quizTypesResult] = await Promise.all([
        tryFetchWithFallback(`
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
        `, { subjectId: subject.id }, token),
        tryFetchWithFallback(`
          query QuizTypes {
            quizTypes {
              id
              name
              slug
              question_count
              is_default
            }
          }
        `, undefined, token)
      ]);

      if (lessonsResult.data?.lessonsForSubject) {
        setChapters(lessonsResult.data.lessonsForSubject);
      } else {
        setError(lessonsResult.errors?.[0]?.message || t('quiz_lessons.error_loading_lessons'));
      }

      if (quizTypesResult.data?.quizTypes) {
        const types = quizTypesResult.data.quizTypes.map((qt: any) => ({
          id: qt.id,
          name: qt.name,
          slug: qt.slug,
          questionCount: qt.question_count,
          isDefault: qt.is_default
        }));
        setQuizTypes(types);
        // Set default quiz type
        const defaultType = types.find((qt: QuizType) => qt.isDefault);
        if (defaultType) {
          setSelectedQuizTypeId(defaultType.id);
        } else if (types.length > 0) {
          setSelectedQuizTypeId(types[0].id);
        }
      }
    } catch (err: any) {
      console.error('Fetch data error:', err);
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

  const handlePrepareQuiz = () => {
    if (selectedLessons.size === 0) {
      Alert.alert(t('quiz_lessons.no_lessons_selected'), t('quiz_lessons.select_at_least_one'));
      return;
    }
    setShowQuizTypes(true);
  };

  const handleStartQuiz = () => {
    onLessonsSelect(Array.from(selectedLessons), selectedQuizTypeId || undefined);
  };

  const handleBackToLessons = () => {
    setShowQuizTypes(false);
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
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchData}>
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

      {/* Footer: Two-step quiz flow */}
      {selectedLessons.size > 0 && !showQuizTypes && (
        <View style={currentStyles.footer}>
          <TouchableOpacity style={currentStyles.startQuizButton} onPress={handlePrepareQuiz}>
            <Text style={currentStyles.startQuizButtonText}>
              {t('quiz_lessons.prepare_quiz')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quiz Type Selection Step */}
      {showQuizTypes && (
        <View style={currentStyles.footer}>
          <View style={currentStyles.quizTypeHeader}>
            <TouchableOpacity onPress={handleBackToLessons}>
              <Text style={currentStyles.backToLessonsText}>{isRTL ? '→' : '←'} {t('quiz_lessons.back_to_lessons')}</Text>
            </TouchableOpacity>
          </View>
          {quizTypes.length > 0 && (
            <View style={currentStyles.quizTypeSection}>
              <Text style={currentStyles.quizTypeSectionTitle}>{t('quiz_lessons.select_quiz_type')}</Text>
              <View style={currentStyles.quizTypeOptions}>
                {quizTypes.map((quizType) => (
                  <TouchableOpacity
                    key={quizType.id}
                    style={[
                      currentStyles.quizTypeOption,
                      selectedQuizTypeId === quizType.id && currentStyles.quizTypeOptionSelected
                    ]}
                    onPress={() => setSelectedQuizTypeId(quizType.id)}
                  >
                    <View style={[
                      currentStyles.radioButton,
                      selectedQuizTypeId === quizType.id && currentStyles.radioButtonSelected
                    ]}>
                      {selectedQuizTypeId === quizType.id && (
                        <View style={currentStyles.radioButtonInner} />
                      )}
                    </View>
                    <View style={currentStyles.quizTypeInfo}>
                      <Text style={[
                        currentStyles.quizTypeName,
                        selectedQuizTypeId === quizType.id && currentStyles.quizTypeNameSelected
                      ]}>{quizType.name}</Text>
                      <Text style={currentStyles.quizTypeCount}>
                        {quizType.questionCount} {t('quiz_lessons.questions')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <TouchableOpacity style={currentStyles.startQuizButton} onPress={handleStartQuiz}>
            <Text style={currentStyles.startQuizButtonText}>
              {t('quiz_lessons.start_quiz')}
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
  // Quiz Type Selection Styles
  quizTypeSection: {
    marginBottom: 16,
  },
  quizTypeSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  quizTypeOptions: {
    flexDirection: 'column',
    gap: 8,
  },
  quizTypeOption: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  quizTypeOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}15`,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  quizTypeInfo: {
    flex: 1,
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  quizTypeName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  quizTypeNameSelected: {
    color: theme.colors.primary,
  },
  quizTypeCount: {
    fontSize: 12,
    marginTop: 2,
    color: theme.colors.textSecondary,
  },
  quizTypeHeader: {
    marginBottom: 12,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  backToLessonsText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
});

export default QuizLessonsScreen;
