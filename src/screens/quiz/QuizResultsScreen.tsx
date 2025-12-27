import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { tryFetchWithFallback } from '../../config/api';

// Types
interface UserQuizAnswer {
  question: {
    id: string;
    question: string;
    explanation?: string;
    answer_1: string;
  };
  selected_answer: string;
  is_correct: boolean;
  explanation?: string;
}

interface QuizResult {
  quiz: {
    id: string;
    name: string;
    subject: {
      name: string;
    };
  };
  score: number;
  totalQuestions: number;
  userAnswers: UserQuizAnswer[];
  isPassed: boolean;
}

interface QuizResultsScreenProps {
  quizId: string;
  onBack: () => void;
  onRetakeQuiz: () => void;
}

const QuizResultsScreen: React.FC<QuizResultsScreenProps> = ({ quizId, onBack, onRetakeQuiz }) => {
  const { theme } = useTheme();
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    fetchQuizResults();
  }, [quizId]);

  const fetchQuizResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const result = await tryFetchWithFallback(`
        query QuizResults($quizId: ID!) {
          quizResults(quizId: $quizId) {
            quiz {
              id
              name
              subject {
                name
              }
            }
            score
            totalQuestions
            userAnswers {
              question {
                id
                question
                answer_1
                explanation
              }
              selected_answer
              is_correct
              explanation
            }
            isPassed
          }
        }
      `, { quizId }, token);

      if (result.data?.quizResults) {
        setQuizResult(result.data.quizResults);
      } else {
        setError(result.errors?.[0]?.message || 'Failed to load quiz results');
      }
    } catch (err: any) {
      console.error('Fetch quiz results error:', err);
      setError(err.message || 'An error occurred while loading quiz results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={[styles.backButtonText, { color: theme.colors.headerText }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>Loading Results...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading quiz results...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={[styles.backButtonText, { color: theme.colors.headerText }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>Results Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Error Loading Results</Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={fetchQuizResults}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!quizResult) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={[styles.backButtonText, { color: theme.colors.headerText }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>No Results</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📊</Text>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>No Results Available</Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Quiz results are not available yet.</Text>
        </View>
      </View>
    );
  }

  const percentage = Math.round((quizResult.score / quizResult.totalQuestions) * 100);
  const correctAnswers = quizResult.userAnswers.filter(answer => answer.is_correct).length;

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <TouchableOpacity style={styles(theme).backButton} onPress={onBack}>
          <Text style={styles(theme).backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles(theme).headerTitle}>Quiz Results</Text>
        <Text style={styles(theme).headerSubtitle}>{quizResult.quiz.name}</Text>
      </View>

      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        {/* Score Summary */}
        <View style={styles(theme).scoreContainer}>
          <View style={[
            styles(theme).scoreCircle,
            quizResult.isPassed ? styles(theme).scoreCirclePassed : styles(theme).scoreCircleFailed
          ]}>
            <Text style={[
              styles(theme).scorePercentage,
              quizResult.isPassed ? styles(theme).scorePercentagePassed : styles(theme).scorePercentageFailed
            ]}>
              {percentage}%
            </Text>
            <Text style={styles(theme).scoreLabel}>Score</Text>
          </View>
          
          <View style={styles(theme).scoreDetails}>
            <View style={styles(theme).scoreItem}>
              <Text style={styles(theme).scoreNumber}>{correctAnswers}</Text>
              <Text style={styles(theme).scoreText}>Correct</Text>
            </View>
            <View style={styles(theme).scoreItem}>
              <Text style={styles(theme).scoreNumber}>{quizResult.totalQuestions - correctAnswers}</Text>
              <Text style={styles(theme).scoreText}>Incorrect</Text>
            </View>
            <View style={styles(theme).scoreItem}>
              <Text style={styles(theme).scoreNumber}>{quizResult.totalQuestions}</Text>
              <Text style={styles(theme).scoreText}>Total</Text>
            </View>
          </View>
        </View>

        {/* Pass/Fail Status */}
        <View style={[
          styles(theme).statusContainer,
          quizResult.isPassed ? styles(theme).statusContainerPassed : styles(theme).statusContainerFailed
        ]}>
          <Text style={[
            styles(theme).statusIcon,
            quizResult.isPassed ? styles(theme).statusIconPassed : styles(theme).statusIconFailed
          ]}>
            {quizResult.isPassed ? '✅' : '❌'}
          </Text>
          <Text style={[
            styles(theme).statusText,
            quizResult.isPassed ? styles(theme).statusTextPassed : styles(theme).statusTextFailed
          ]}>
            {quizResult.isPassed ? 'Congratulations! You passed!' : 'You need more practice. Try again!'}
          </Text>
        </View>

        {/* Question Review - Only Wrong Answers */}
        <View style={styles(theme).reviewContainer}>
          <Text style={styles(theme).reviewTitle}>Questions to Review</Text>

          {(() => {
            const wrongAnswers = quizResult.userAnswers.filter(answer => !answer.is_correct);

            if (wrongAnswers.length === 0) {
              return (
                <View style={styles(theme).perfectScoreContainer}>
                  <Text style={styles(theme).perfectScoreIcon}>🎉</Text>
                  <Text style={styles(theme).perfectScoreTitle}>Perfect Score!</Text>
                  <Text style={styles(theme).perfectScoreText}>
                    You answered all questions correctly. Great job!
                  </Text>
                </View>
              );
            }

            return wrongAnswers.map((answer, index) => {
              // Get the correct answer from the question data
              const correctAnswer = answer.question.answer_1;

              return (
                <View key={answer.question.id} style={styles(theme).questionReview}>
                  <View style={styles(theme).questionHeader}>
                    <Text style={styles(theme).questionNumber}>Question {index + 1}</Text>
                    <View style={styles(theme).answerStatus}>
                      <Text style={styles(theme).answerStatusText}>
                        Incorrect
                      </Text>
                    </View>
                  </View>

                  <Text style={styles(theme).questionText}>{answer.question.question}</Text>

                  {/* Your Wrong Answer */}
                  <View style={styles(theme).wrongAnswerContainer}>
                    <Text style={styles(theme).wrongAnswerLabel}>❌ Your Answer:</Text>
                    <Text style={styles(theme).wrongAnswerText}>
                      {answer.selected_answer}
                    </Text>
                  </View>

                  {/* Correct Answer */}
                  <View style={styles(theme).correctAnswerContainer}>
                    <Text style={styles(theme).correctAnswerLabel}>✅ Correct Answer:</Text>
                    <Text style={styles(theme).correctAnswerText}>
                     {answer.question.answer_1}
                    </Text>
                  </View>

                  {answer.question.explanation && (
                    <View style={styles(theme).explanationContainer}>
                      <Text style={styles(theme).explanationLabel}>💡 Explanation:</Text>
                      <Text style={styles(theme).explanationText}>{answer.question.explanation}</Text>
                    </View>
                  )}
                </View>
              );
            });
          })()}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles(theme).actionContainer}>
        <TouchableOpacity style={styles(theme).retakeButton} onPress={onRetakeQuiz}>
          <Text style={styles(theme).retakeButtonText}>Retake Quiz</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles(theme).doneButton} onPress={onBack}>
          <Text style={styles(theme).doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 24,
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
  scoreContainer: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreCirclePassed: {
    borderColor: theme.colors.success,
  },
  scoreCircleFailed: {
    borderColor: theme.colors.error,
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scorePercentagePassed: {
    color: theme.colors.success,
  },
  scorePercentageFailed: {
    color: theme.colors.error,
  },
  scoreLabel: {
    fontSize: 14,
    marginTop: 4,
    color: theme.colors.textSecondary,
  },
  scoreDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  scoreText: {
    fontSize: 14,
    marginTop: 4,
    color: theme.colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusContainerPassed: {
    backgroundColor: theme.colors.successBackground,
  },
  statusContainerFailed: {
    backgroundColor: theme.colors.errorBackground,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusIconPassed: {
    color: theme.colors.success,
  },
  statusIconFailed: {
    color: theme.colors.error,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusTextPassed: {
    color: theme.colors.successText,
  },
  statusTextFailed: {
    color: theme.colors.errorText,
  },
  reviewContainer: {
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
  },
  questionReview: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: theme.colors.card,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  answerStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.colors.errorBackground,
  },
  answerStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.errorText,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
    color: theme.colors.text,
  },
  answerContainer: {
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: theme.colors.text,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  explanationContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: theme.colors.surface,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
    backgroundColor: theme.colors.surface,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.buttonPrimary,
  },
  retakeButtonText: {
    color: theme.colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  perfectScoreContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
  },
  perfectScoreIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  perfectScoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  perfectScoreText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  wrongAnswerContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    backgroundColor: theme.colors.errorBackground,
  },
  wrongAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
  },
  wrongAnswerText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  correctAnswerContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    backgroundColor: theme.colors.successBackground,
  },
  correctAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
  },
  correctAnswerText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
});

export default QuizResultsScreen;
