import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../config/api';
import QuizSubjectsScreen from './quiz/QuizSubjectsScreen';
import QuizLessonsScreen from './quiz/QuizLessonsScreen';
import QuizTakingScreen from './quiz/QuizTakingScreen';
import QuizResultsScreen from './quiz/QuizResultsScreen';
import RecentActivityCard from '../components/RecentActivityCard';

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
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<QuizFlowStep>('history');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  useFocusEffect(
    useCallback(() => {
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
        setHistoryError(t('common.error'));
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
        setHistoryError(result.errors?.[0]?.message || t('quiz_screen.error_loading_history'));
      }
    } catch (err: any) {
      console.error('Fetch quiz history error:', err);
      setHistoryError(err.message || t('quiz_screen.error_loading_history'));
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

  const handleLessonsSelect = async (lessonIds: string[], quizTypeId?: string) => {
    if (!selectedSubject) return;

    setSelectedLessons(lessonIds);

    try {
      const result = await startQuiz(selectedSubject.id, lessonIds, quizTypeId);
      if (result.success && result.quizId) {
        setCurrentQuizId(result.quizId);
        setCurrentStep('taking');
      } else {
        Alert.alert(t('common.error'), result.error || t('quiz_screen.error_loading_history'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('quiz_screen.error_loading_history'));
    }
  };

  const startQuiz = async (subjectId: string, lessonIds: string[], quizTypeId?: string): Promise<{ success: boolean; quizId?: string; error?: string }> => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return { success: false, error: t('common.error') };
      }

      const result = await tryFetchWithFallback(`
        mutation StartQuiz($subjectId: ID!, $lessonIds: [ID!]!, $quizTypeId: ID) {
          startQuiz(subjectId: $subjectId, lessonIds: $lessonIds, quizTypeId: $quizTypeId) {
            id
            name
            subject {
              id
              name
            }
          }
        }
      `, { subjectId, lessonIds, quizTypeId }, token);

      if (result.data?.startQuiz) {
        return {
          success: true,
          quizId: result.data.startQuiz.id
        };
      } else {
        return {
          success: false,
          error: result.errors?.[0]?.message || t('quiz_screen.error_loading_history')
        };
      }
    } catch (error: any) {
      console.error('Start quiz error:', error);
      return {
        success: false,
        error: error.message || t('common.unexpected_error')
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
    fetchQuizHistory();
  };

  const handleBackToSubjects = () => {
    setCurrentStep('subjects');
  };

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

  const currentStyles = styles(theme, isRTL);

  return (
    <View style={currentStyles.container}>
      {/* Header */}
      <View style={currentStyles.header}>
        <Text style={currentStyles.headerTitle}>{t('quiz_screen.header_title')}</Text>
        <Text style={currentStyles.headerSubtitle}>{t('quiz_screen.header_subtitle')}</Text>
      </View>

      {/* Take Quiz Button */}
      <View style={currentStyles.actionSection}>
        <TouchableOpacity style={currentStyles.takeQuizButton} onPress={handleTakeQuiz}>
          <Text style={currentStyles.takeQuizIcon}>🧠</Text>
          <Text style={currentStyles.takeQuizText}>{t('quiz_screen.take_new_quiz')}</Text>
          <Text style={currentStyles.takeQuizSubtext}>{t('quiz_screen.start_new_challenge')}</Text>
        </TouchableOpacity>
      </View>

      {/* Quiz History */}
      <View style={currentStyles.historySection}>
        <Text style={currentStyles.sectionTitle}>{t('quiz_screen.quiz_history')}</Text>

        {historyLoading ? (
          <View style={currentStyles.loadingState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={currentStyles.loadingText}>{t('quiz_screen.loading_quiz_history')}</Text>
          </View>
        ) : historyError ? (
          <View style={currentStyles.errorState}>
            <Text style={currentStyles.errorStateIcon}>⚠️</Text>
            <Text style={currentStyles.errorStateTitle}>{t('quiz_screen.error_loading_history')}</Text>
            <Text style={currentStyles.errorStateSubtitle}>{historyError}</Text>
            <TouchableOpacity style={currentStyles.retryButton} onPress={fetchQuizHistory}>
              <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
            </TouchableOpacity>
          </View>
        ) : quizHistory.length === 0 ? (
          <View style={currentStyles.emptyState}>
            <Text style={currentStyles.emptyStateIcon}>📝</Text>
            <Text style={currentStyles.emptyStateTitle}>{t('quiz_screen.no_quizzes_yet')}</Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {t('quiz_screen.take_first_quiz')}
            </Text>
          </View>
        ) : (
          <ScrollView style={currentStyles.historyList} showsVerticalScrollIndicator={false}>
            {quizHistory.map((quiz) => (
              <RecentActivityCard 
                key={quiz.id} 
                activity={quiz} 
                onPress={() => handleQuizComplete(quiz.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>
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
  actionSection: {
    padding: 20,
  },
  takeQuizButton: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
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
    marginBottom: 4,
    color: theme.colors.primary,
  },
  takeQuizSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  historySection: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
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
    marginBottom: 8,
    color: theme.colors.text,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  historyList: {
    flex: 1,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  errorStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
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

export default QuizScreen;
