import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { tryFetchWithFallback } from '../../config/api';
// import { useQuery } from '@apollo/client';
// import { LESSONS_FOR_SUBJECT_QUERY, Subject, Chapter, Lesson } from '../../lib/graphql';

// Temporary types for testing
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
        setError('Authentication required');
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
        setError(result.errors?.[0]?.message || 'Failed to load lessons');
      }
    } catch (err: any) {
      console.error('Fetch lessons error:', err);
      setError(err.message || 'An error occurred while loading lessons');
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
    
    // Check if all lessons in chapter are selected
    const allSelected = chapterLessonIds.every(id => newSelected.has(id));
    
    if (allSelected) {
      // Deselect all lessons in chapter
      chapterLessonIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all lessons in chapter
      chapterLessonIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedLessons(newSelected);
  };

  const handleStartQuiz = () => {
    if (selectedLessons.size === 0) {
      Alert.alert('No Lessons Selected', 'Please select at least one lesson to start the quiz.');
      return;
    }
    
    onLessonsSelect(Array.from(selectedLessons));
  };

  if (loading) {
    return (
      <View style={styles(theme).container}>
        <View style={styles(theme).header}>
          <TouchableOpacity style={styles(theme).backButton} onPress={onBack}>
            <Text style={styles(theme).backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles(theme).headerTitle}>Choose Lessons</Text>
        </View>
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles(theme).loadingText}>Loading lessons...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles(theme).container}>
        <View style={styles(theme).header}>
          <TouchableOpacity style={styles(theme).backButton} onPress={onBack}>
            <Text style={styles(theme).backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles(theme).headerTitle}>Choose Lessons</Text>
        </View>
        <View style={styles(theme).errorContainer}>
          <Text style={styles(theme).errorIcon}>⚠️</Text>
          <Text style={styles(theme).errorTitle}>Error Loading Lessons</Text>
          <Text style={styles(theme).errorText}>{error}</Text>
          <TouchableOpacity style={styles(theme).retryButton} onPress={fetchLessons}>
            <Text style={styles(theme).retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // chapters state is already defined above

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <TouchableOpacity style={styles(theme).backButton} onPress={onBack}>
          <Text style={styles(theme).backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles(theme).headerTitle}>Choose Lessons</Text>
        <Text style={styles(theme).headerSubtitle}>{subject.name}</Text>
      </View>

      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        {chapters.map((chapter: Chapter) => {
          const chapterLessonIds = chapter.lessons.map(lesson => lesson.id);
          const selectedInChapter = chapterLessonIds.filter(id => selectedLessons.has(id)).length;
          const allSelected = selectedInChapter === chapterLessonIds.length;
          const someSelected = selectedInChapter > 0;

          return (
            <View key={chapter.id} style={styles(theme).chapterCard}>
              <TouchableOpacity
                style={styles(theme).chapterHeader}
                onPress={() => handleChapterToggle(chapter)}
              >
                <View style={styles(theme).chapterLeft}>
                  <View style={[
                    styles(theme).checkbox,
                    allSelected && styles(theme).checkboxSelected,
                    someSelected && !allSelected && styles(theme).checkboxPartial
                  ]}>
                    {allSelected && <Text style={styles(theme).checkmark}>✓</Text>}
                    {someSelected && !allSelected && <Text style={styles(theme).partialMark}>−</Text>}
                  </View>
                  <View style={styles(theme).chapterInfo}>
                    <Text style={styles(theme).chapterName}>{chapter.name}</Text>
                    <Text style={styles(theme).chapterStats}>
                      {selectedInChapter}/{chapterLessonIds.length} lessons selected
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles(theme).lessonsContainer}>
                {chapter.lessons.map((lesson: Lesson) => {
                  const isSelected = selectedLessons.has(lesson.id);
                  
                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      style={styles(theme).lessonItem}
                      onPress={() => handleLessonToggle(lesson.id)}
                    >
                      <View style={[
                        styles(theme).checkbox,
                        isSelected && styles(theme).checkboxSelected
                      ]}>
                        {isSelected && <Text style={styles(theme).checkmark}>✓</Text>}
                      </View>
                      <Text style={styles(theme).lessonName}>{lesson.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {chapters.length === 0 && (
          <View style={styles(theme).emptyState}>
            <Text style={styles(theme).emptyStateIcon}>📚</Text>
            <Text style={styles(theme).emptyStateTitle}>No Lessons Available</Text>
            <Text style={styles(theme).emptyStateSubtitle}>
              No lessons are available for this subject at the moment.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Start Quiz Button */}
      {selectedLessons.size > 0 && (
        <View style={styles(theme).footer}>
          <TouchableOpacity style={styles(theme).startQuizButton} onPress={handleStartQuiz}>
            <Text style={styles(theme).startQuizButtonText}>
              Start Quiz ({selectedLessons.size} lesson{selectedLessons.size !== 1 ? 's' : ''})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterInfo: {
    flex: 1,
    marginLeft: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  lessonName: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    color: theme.colors.text,
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
