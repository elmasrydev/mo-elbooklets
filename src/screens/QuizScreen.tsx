import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { tryFetchWithFallback } from '../config/api';
import QuizSubjectsScreen from './quiz/QuizSubjectsScreen';
import QuizLessonsScreen from './quiz/QuizLessonsScreen';
import QuizTakingScreen from './quiz/QuizTakingScreen';
import QuizResultsScreen from './quiz/QuizResultsScreen';
// import { Subject } from '../lib/graphql';

// Temporary type for testing
interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface QuizHistory {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
  };
  score: number;
  totalQuestions: number;
  completedAt: string;
  isPassed: boolean;
}



type QuizFlowStep = 'history' | 'subjects' | 'lessons' | 'taking' | 'results';

const QuizScreen: React.FC = () => {
  const { user } = useAuth();
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<QuizFlowStep>('history');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  // Fetch quiz history on component mount
  useEffect(() => {
    fetchQuizHistory();
  }, []);

  // Auto-refresh quiz history when tab is focused
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we're on the history step
      if (currentStep === 'history') {
        fetchQuizHistory();
      }
    }, [currentStep])
  );



  const fetchQuizHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setHistoryError('Authentication required');
        return;
      }

      const result = await tryFetchWithFallback(`
        query UserQuizHistory {
          userQuizHistory {
            id
            name
            subject {
              id
              name
            }
            score
            totalQuestions
            completedAt
            isPassed
          }
        }
      `, undefined, token);

      if (result.data?.userQuizHistory) {
        setQuizHistory(result.data.userQuizHistory);
      } else {
        setHistoryError(result.errors?.[0]?.message || 'Failed to load quiz history');
      }
    } catch (err: any) {
      console.error('Fetch quiz history error:', err);
      setHistoryError(err.message || 'An error occurred while loading quiz history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTakeQuiz = () => {
    setCurrentStep('subjects');
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setCurrentStep('lessons');
  };

  const handleLessonsSelect = async (lessonIds: string[]) => {
    if (!selectedSubject) return;

    setSelectedLessons(lessonIds);

    try {
      // Start quiz using GraphQL mutation
      const result = await startQuiz(selectedSubject.id, lessonIds);
      if (result.success && result.quizId) {
        setCurrentQuizId(result.quizId);
        setCurrentStep('taking');
      } else {
        Alert.alert('Error', result.error || 'Failed to start quiz');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start quiz. Please try again.');
    }
  };

  const startQuiz = async (subjectId: string, lessonIds: string[]): Promise<{ success: boolean; quizId?: string; error?: string }> => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const result = await tryFetchWithFallback(`
        mutation StartQuiz($subjectId: ID!, $lessonIds: [ID!]!) {
          startQuiz(subjectId: $subjectId, lessonIds: $lessonIds) {
            id
            name
            subject {
              id
              name
            }
          }
        }
      `, { subjectId, lessonIds }, token);

      if (result.data?.startQuiz) {
        return {
          success: true,
          quizId: result.data.startQuiz.id
        };
      } else {
        return {
          success: false,
          error: result.errors?.[0]?.message || 'Failed to start quiz'
        };
      }
    } catch (error: any) {
      console.error('Start quiz error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while starting the quiz'
      };
    }
  };

  const handleQuizComplete = (quizId: string) => {
    setCurrentQuizId(quizId);
    setCurrentStep('results');
  };

  const handleRetakeQuiz = () => {
    setCurrentStep('lessons');
  };

  const handleBackToHistory = () => {
    setCurrentStep('history');
    setSelectedSubject(null);
    // Refresh quiz history when returning to history view
    fetchQuizHistory();
  };

  const handleBackToSubjects = () => {
    setCurrentStep('subjects');
  };

  // Render different screens based on current step
  if (currentStep === 'subjects') {
    return (
      <QuizSubjectsScreen
        onSubjectSelect={handleSubjectSelect}
        onBack={handleBackToHistory}
      />
    );
  }

  if (currentStep === 'lessons' && selectedSubject) {
    return (
      <QuizLessonsScreen
        subject={selectedSubject}
        onLessonsSelect={handleLessonsSelect}
        onBack={handleBackToSubjects}
      />
    );
  }

  if (currentStep === 'taking' && currentQuizId) {
    return (
      <QuizTakingScreen
        quizId={currentQuizId}
        onQuizComplete={handleQuizComplete}
        onBack={handleBackToSubjects}
      />
    );
  }

  if (currentStep === 'results' && currentQuizId) {
    return (
      <QuizResultsScreen
        quizId={currentQuizId}
        onBack={handleBackToHistory}
        onRetakeQuiz={handleRetakeQuiz}
      />
    );
  }

  // Default to history view
  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 70) return '#4CAF50'; // Green
    if (percentage >= 50) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quiz Center</Text>
        <Text style={styles.headerSubtitle}>Test your knowledge and track progress</Text>
      </View>

      {/* Take Quiz Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.takeQuizButton} onPress={handleTakeQuiz}>
          <Text style={styles.takeQuizIcon}>🧠</Text>
          <Text style={styles.takeQuizText}>Take New Quiz</Text>
          <Text style={styles.takeQuizSubtext}>Start a new quiz challenge</Text>
        </TouchableOpacity>
      </View>

      {/* Quiz History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Quiz History</Text>

        {historyLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading quiz history...</Text>
          </View>
        ) : historyError ? (
          <View style={styles.errorState}>
            <Text style={styles.errorStateIcon}>⚠️</Text>
            <Text style={styles.errorStateTitle}>Error Loading History</Text>
            <Text style={styles.errorStateSubtitle}>{historyError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchQuizHistory}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : quizHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateTitle}>No quizzes taken yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Take your first quiz to see your progress here
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {quizHistory.map((quiz) => (
              <View key={quiz.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.quizName}>{quiz.name}</Text>
                  <Text style={styles.quizSubject}>{quiz.subject.name}</Text>
                </View>
                
                <View style={styles.historyDetails}>
                  <View style={styles.scoreContainer}>
                    <Text 
                      style={[
                        styles.scoreText,
                        { color: getScoreColor(quiz.score, quiz.totalQuestions) }
                      ]}
                    >
                      {quiz.score}/{quiz.totalQuestions}
                    </Text>
                    <Text style={styles.scoreLabel}>Score</Text>
                  </View>
                  
                  <View style={styles.statusContainer}>
                    <View 
                      style={[
                        styles.statusBadge,
                        { backgroundColor: quiz.isPassed ? '#E8F5E8' : '#FFEBEE' }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.statusText,
                          { color: quiz.isPassed ? '#4CAF50' : '#F44336' }
                        ]}
                      >
                        {quiz.isPassed ? 'Passed' : 'Failed'}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(quiz.completedAt)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
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
  actionSection: {
    padding: 20,
  },
  takeQuizButton: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  takeQuizIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  takeQuizText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  takeQuizSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  historySection: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  historyList: {
    flex: 1,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    marginBottom: 12,
  },
  quizName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  quizSubject: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#666666',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  errorStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizScreen;
