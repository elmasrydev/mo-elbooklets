import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
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

interface LessonPoint {
  id: string;
  title: string;
  explanation?: string;
  order: number;
}

interface Lesson {
  id: string;
  name: string;
  summary?: string;
  points?: string[];
  lessonPoints?: LessonPoint[];
  chapter: {
    id: string;
    name: string;
    order: number;
  };
}

interface Chapter {
  id: string;
  name: string;
  order: number;
  lessons: Lesson[];
}

interface StudyChaptersScreenProps {
  subject: Subject;
  onLessonSelect: (lesson: Lesson, allLessons: Lesson[]) => void;
  onBack: () => void;
}

const StudyChaptersScreen: React.FC<StudyChaptersScreenProps> = ({ subject, onLessonSelect, onBack }) => {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
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
            lessons {
              id
              name
              summary
              points
              lessonPoints {
                id
                title
                explanation
                order
              }
            }
          }
        }
      `, { subjectId: subject.id }, token);

      if (result.data?.lessonsForSubject) {
        // Map the response to include chapter info in lessons
        const mappedChapters = result.data.lessonsForSubject.map((chapter: any, idx: number) => ({
          id: chapter.id,
          name: chapter.name,
          order: idx + 1,
          lessons: chapter.lessons.map((lesson: any) => ({
            ...lesson,
            chapter: { id: chapter.id, name: chapter.name, order: idx + 1 }
          }))
        }));
        setChapters(mappedChapters);
      } else {
        setError(result.errors?.[0]?.message || t('study_chapters.error_loading'));
      }
    } catch (err: any) {
      console.error('Fetch lessons error:', err);
      setError(err.message || t('study_chapters.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleLessonPress = (lesson: Lesson) => {
    // Flatten all lessons for navigation
    const allLessons = chapters.flatMap(ch => ch.lessons);
    onLessonSelect(lesson, allLessons);
  };

  const currentStyles = styles(theme, isRTL);

  if (loading) {
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{subject.name}</Text>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>{t('study_chapters.loading')}</Text>
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
          <Text style={currentStyles.headerTitle}>{subject.name}</Text>
        </View>
        <View style={currentStyles.errorContainer}>
          <Text style={currentStyles.errorIcon}>⚠️</Text>
          <Text style={currentStyles.errorTitle}>{t('study_chapters.error_loading')}</Text>
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
        <Text style={currentStyles.headerTitle}>{subject.name}</Text>
        <Text style={currentStyles.headerSubtitle}>{t('study_chapters.select_lesson')}</Text>
      </View>

      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        {chapters.map((chapter, chapterIndex) => (
          <View key={chapter.id} style={currentStyles.chapterCard}>
            <View style={currentStyles.chapterHeader}>
              <View style={currentStyles.chapterNumber}>
                <Text style={currentStyles.chapterNumberText}>{chapterIndex + 1}</Text>
              </View>
              <View style={currentStyles.chapterInfo}>
                <Text style={currentStyles.chapterName}>{chapter.name}</Text>
                <Text style={currentStyles.lessonCount}>
                  {chapter.lessons.length} {t('study_chapters.lessons')}
                </Text>
              </View>
            </View>

            <View style={currentStyles.lessonsContainer}>
              {chapter.lessons.map((lesson, lessonIndex) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={currentStyles.lessonItem}
                  onPress={() => handleLessonPress(lesson)}
                >
                  <View style={currentStyles.lessonNumber}>
                    <Text style={currentStyles.lessonNumberText}>{lessonIndex + 1}</Text>
                  </View>
                  <View style={currentStyles.lessonInfo}>
                    <Text style={currentStyles.lessonName}>{lesson.name}</Text>
                    {lesson.summary && (
                      <Text style={currentStyles.lessonSummary} numberOfLines={2}>
                        {lesson.summary}
                      </Text>
                    )}
                  </View>
                  <View style={currentStyles.lessonArrow}>
                    <Text style={currentStyles.lessonArrowText}>{isRTL ? '←' : '→'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {chapters.length === 0 && (
          <View style={currentStyles.emptyState}>
            <Text style={currentStyles.emptyStateIcon}>📚</Text>
            <Text style={currentStyles.emptyStateTitle}>{t('study_chapters.no_chapters')}</Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {t('study_chapters.no_chapters_for_subject')}
            </Text>
          </View>
        )}
      </ScrollView>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  headerSubtitle: {
    fontSize: 14,
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
    marginBottom: 20,
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
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}15`,
  },
  chapterNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  chapterNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  chapterInfo: {
    flex: 1,
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  chapterName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  lessonCount: {
    fontSize: 12,
    marginTop: 2,
    color: theme.colors.textSecondary,
  },
  lessonsContainer: {
    padding: 12,
    paddingTop: 8,
  },
  lessonItem: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  lessonNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.border,
  },
  lessonNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  lessonInfo: {
    flex: 1,
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  lessonName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  lessonSummary: {
    fontSize: 12,
    marginTop: 4,
    color: theme.colors.textSecondary,
    textAlign: isRTL ? 'right' : 'left',
  },
  lessonArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonArrowText: {
    fontSize: 14,
    color: theme.colors.primary,
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

export default StudyChaptersScreen;
