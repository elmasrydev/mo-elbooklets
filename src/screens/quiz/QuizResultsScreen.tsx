import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading Results...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading quiz results...</Text>
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
          <Text style={styles.headerTitle}>Results Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Results</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuizResults}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!quizResult) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>No Results</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📊</Text>
          <Text style={styles.errorTitle}>No Results Available</Text>
          <Text style={styles.errorText}>Quiz results are not available yet.</Text>
        </View>
      </View>
    );
  }

  const percentage = Math.round((quizResult.score / quizResult.totalQuestions) * 100);
  const correctAnswers = quizResult.userAnswers.filter(answer => answer.is_correct).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Results</Text>
        <Text style={styles.headerSubtitle}>{quizResult.quiz.name}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score Summary */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: quizResult.isPassed ? '#28a745' : '#dc3545' }]}>
            <Text style={[styles.scorePercentage, { color: quizResult.isPassed ? '#28a745' : '#dc3545' }]}>
              {percentage}%
            </Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
          
          <View style={styles.scoreDetails}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreNumber}>{correctAnswers}</Text>
              <Text style={styles.scoreText}>Correct</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreNumber}>{quizResult.totalQuestions - correctAnswers}</Text>
              <Text style={styles.scoreText}>Incorrect</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreNumber}>{quizResult.totalQuestions}</Text>
              <Text style={styles.scoreText}>Total</Text>
            </View>
          </View>
        </View>

        {/* Pass/Fail Status */}
        <View style={[styles.statusContainer, { backgroundColor: quizResult.isPassed ? '#d4edda' : '#f8d7da' }]}>
          <Text style={[styles.statusIcon, { color: quizResult.isPassed ? '#28a745' : '#dc3545' }]}>
            {quizResult.isPassed ? '✅' : '❌'}
          </Text>
          <Text style={[styles.statusText, { color: quizResult.isPassed ? '#155724' : '#721c24' }]}>
            {quizResult.isPassed ? 'Congratulations! You passed!' : 'You need more practice. Try again!'}
          </Text>
        </View>

        {/* Question Review - Only Wrong Answers */}
        <View style={styles.reviewContainer}>
          <Text style={styles.reviewTitle}>Questions to Review</Text>

          {(() => {
            const wrongAnswers = quizResult.userAnswers.filter(answer => !answer.is_correct);

            if (wrongAnswers.length === 0) {
              return (
                <View style={styles.perfectScoreContainer}>
                  <Text style={styles.perfectScoreIcon}>🎉</Text>
                  <Text style={styles.perfectScoreTitle}>Perfect Score!</Text>
                  <Text style={styles.perfectScoreText}>
                    You answered all questions correctly. Great job!
                  </Text>
                </View>
              );
            }

            return wrongAnswers.map((answer, index) => {
              // Get the correct answer from the question data
              const correctAnswer = answer.question.answer_1;

              return (
                <View key={answer.question.id} style={styles.questionReview}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>Question {index + 1}</Text>
                    <View style={[styles.answerStatus, { backgroundColor: '#f8d7da' }]}>
                      <Text style={[styles.answerStatusText, { color: '#721c24' }]}>
                        Incorrect
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.questionText}>{answer.question.question}</Text>

                  {/* Your Wrong Answer */}
                  <View style={styles.wrongAnswerContainer}>
                    <Text style={styles.wrongAnswerLabel}>❌ Your Answer:</Text>
                    <Text style={styles.wrongAnswerText}>
                      {answer.selected_answer}
                    </Text>
                  </View>

                  {/* Correct Answer */}
                  <View style={styles.correctAnswerContainer}>
                    <Text style={styles.correctAnswerLabel}>✅ Correct Answer:</Text>
                    <Text style={styles.correctAnswerText}>
                     {answer.question.answer_1}
                    </Text>
                  </View>

                  {answer.question.explanation && (
                    <View style={styles.explanationContainer}>
                      <Text style={styles.explanationLabel}>💡 Explanation:</Text>
                      <Text style={styles.explanationText}>{answer.question.explanation}</Text>
                    </View>
                  )}
                </View>
              );
            });
          })()}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.retakeButton} onPress={onRetakeQuiz}>
          <Text style={styles.retakeButtonText}>Retake Quiz</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.doneButton} onPress={onBack}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
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
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
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
  scoreContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
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
  scorePercentage: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
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
    color: '#333333',
  },
  scoreText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  reviewContainer: {
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  questionReview: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    color: '#007AFF',
  },
  answerStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  answerStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
    lineHeight: 22,
  },
  answerContainer: {
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  explanationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  perfectScoreContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  perfectScoreIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  perfectScoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  perfectScoreText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  wrongAnswerContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  wrongAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#721c24',
    marginBottom: 4,
  },
  wrongAnswerText: {
    fontSize: 16,
    color: '#721c24',
    fontWeight: '500',
  },
  correctAnswerContainer: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  correctAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 4,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#155724',
    fontWeight: '500',
  },
});

export default QuizResultsScreen;
