import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Lessons</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading lessons...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Lessons</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Lessons</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLessons}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // chapters state is already defined above

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Lessons</Text>
        <Text style={styles.headerSubtitle}>{subject.name}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {chapters.map((chapter: Chapter) => {
          const chapterLessonIds = chapter.lessons.map(lesson => lesson.id);
          const selectedInChapter = chapterLessonIds.filter(id => selectedLessons.has(id)).length;
          const allSelected = selectedInChapter === chapterLessonIds.length;
          const someSelected = selectedInChapter > 0;

          return (
            <View key={chapter.id} style={styles.chapterCard}>
              <TouchableOpacity
                style={styles.chapterHeader}
                onPress={() => handleChapterToggle(chapter)}
              >
                <View style={styles.chapterLeft}>
                  <View style={[
                    styles.checkbox,
                    allSelected && styles.checkboxSelected,
                    someSelected && !allSelected && styles.checkboxPartial
                  ]}>
                    {allSelected && <Text style={styles.checkmark}>✓</Text>}
                    {someSelected && !allSelected && <Text style={styles.partialMark}>−</Text>}
                  </View>
                  <View style={styles.chapterInfo}>
                    <Text style={styles.chapterName}>{chapter.name}</Text>
                    <Text style={styles.chapterStats}>
                      {selectedInChapter}/{chapterLessonIds.length} lessons selected
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.lessonsContainer}>
                {chapter.lessons.map((lesson: Lesson) => {
                  const isSelected = selectedLessons.has(lesson.id);
                  
                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      style={styles.lessonItem}
                      onPress={() => handleLessonToggle(lesson.id)}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.lessonName}>{lesson.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {chapters.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📚</Text>
            <Text style={styles.emptyStateTitle}>No Lessons Available</Text>
            <Text style={styles.emptyStateSubtitle}>
              No lessons are available for this subject at the moment.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Start Quiz Button */}
      {selectedLessons.size > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.startQuizButton} onPress={handleStartQuiz}>
            <Text style={styles.startQuizButtonText}>
              Start Quiz ({selectedLessons.size} lesson{selectedLessons.size !== 1 ? 's' : ''})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
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
    color: '#666666',
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
    color: '#333333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  chapterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chapterHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#333333',
    marginBottom: 4,
  },
  chapterStats: {
    fontSize: 12,
    color: '#666666',
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
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#cccccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxPartial: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  partialMark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  startQuizButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startQuizButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default QuizLessonsScreen;
