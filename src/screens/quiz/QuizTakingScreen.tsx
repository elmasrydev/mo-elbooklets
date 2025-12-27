import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { tryFetchWithFallback } from '../../config/api';

// Types
interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  questionNumber: number;
  explanation?: string;
  difficulty: number;
}

interface Quiz {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
  };
  questions: QuizQuestion[];
  isCompleted: boolean;
  score?: number;
}

interface QuizTakingScreenProps {
  quizId: string;
  onQuizComplete: (quizId: string) => void;
  onBack: () => void;
}

const QuizTakingScreen: React.FC<QuizTakingScreenProps> = ({ quizId, onQuizComplete, onBack }) => {
  const { theme } = useTheme();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);



  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const result = await tryFetchWithFallback(`
        query Quiz($quizId: ID!) {
          quiz(quizId: $quizId) {
            id
            name
            subject {
              id
              name
            }
            questions {
              id
              question
              answers
              questionNumber
              explanation
              difficulty
            }
            isCompleted
            score
          }
        }
      `, { quizId }, token);

      if (result.data?.quiz) {
        setQuiz(result.data.quiz);
      } else {
        setError(result.errors?.[0]?.message || 'Failed to load quiz');
      }
    } catch (err: any) {
      console.error('Fetch quiz error:', err);
      setError(err.message || 'An error occurred while loading the quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (!quiz) return;
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    
    // Check if current question is answered
    if (!selectedAnswers[currentQuestion.id]) {
      Alert.alert(
        'Answer Required',
        'Please select an answer before proceeding to the next question.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    
    // Check if current (last) question is answered
    if (!selectedAnswers[currentQuestion.id]) {
      Alert.alert(
        'Answer Required',
        'Please select an answer for this question before submitting the quiz.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if all questions are answered
    const unansweredQuestions = quiz.questions.filter(q => !selectedAnswers[q.id]);
    if (unansweredQuestions.length > 0) {
      Alert.alert(
        'Incomplete Quiz',
        `You have ${unansweredQuestions.length} unanswered question${unansweredQuestions.length > 1 ? 's' : ''}. Please answer all questions before submitting.`,
        [{ text: 'OK' }]
      );
      return;
    }

    submitAnswers();
  };

  const submitAnswers = async () => {
    if (!quiz) return;

    try {
      setSubmitting(true);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Create answers for ALL questions, using null for unanswered ones
      const answers = quiz.questions.map(question => ({
        questionId: question.id,
        selectedAnswer: selectedAnswers[question.id] || null
      }));

      const result = await tryFetchWithFallback(`
        mutation SubmitQuizAnswers($quizId: ID!, $answers: [QuestionAnswerInput!]!) {
          submitQuizAnswers(quizId: $quizId, answers: $answers) {
            score
            totalQuestions
            isPassed
          }
        }
      `, { quizId: quiz.id, answers }, token);

      if (result.data?.submitQuizAnswers) {
        onQuizComplete(quiz.id);
      } else {
        setError(result.errors?.[0]?.message || 'Failed to submit quiz');
      }
    } catch (err: any) {
      console.error('Submit quiz error:', err);
      setError(err.message || 'An error occurred while submitting the quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles(theme).container}>
        <View style={styles(theme).header}>
          <TouchableOpacity style={styles(theme).backButton} onPress={onBack}>
            <Text style={styles(theme).backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles(theme).headerTitle}>Loading Quiz...</Text>
        </View>
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles(theme).loadingText}>Loading quiz questions...</Text>
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
          <Text style={styles(theme).headerTitle}>Quiz Error</Text>
        </View>
        <View style={styles(theme).errorContainer}>
          <Text style={styles(theme).errorIcon}>⚠️</Text>
          <Text style={styles(theme).errorTitle}>Error Loading Quiz</Text>
          <Text style={styles(theme).errorText}>{error}</Text>
          <TouchableOpacity style={styles(theme).retryButton} onPress={fetchQuiz}>
            <Text style={styles(theme).retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <View style={styles(theme).container}>
        <View style={styles(theme).header}>
          <TouchableOpacity style={styles(theme).backButton} onPress={onBack}>
            <Text style={styles(theme).backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles(theme).headerTitle}>No Questions</Text>
        </View>
        <View style={styles(theme).errorContainer}>
          <Text style={styles(theme).errorIcon}>📝</Text>
          <Text style={styles(theme).errorTitle}>No Questions Available</Text>
          <Text style={styles(theme).errorText}>This quiz doesn't have any questions yet.</Text>
        </View>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <TouchableOpacity style={styles(theme).backButton} onPress={onBack}>
          <Text style={styles(theme).backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles(theme).headerTitle}>{quiz.name}</Text>
        <Text style={styles(theme).headerSubtitle}>{quiz.subject.name}</Text>
      </View>

      <View style={styles(theme).progressContainer}>
        <View style={styles(theme).progressBar}>
          <View style={[styles(theme).progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles(theme).progressText}>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Text>
      </View>

      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        <View style={styles(theme).questionContainer}>
          <Text style={styles(theme).questionNumber}>Question {currentQuestion.questionNumber}</Text>
          <Text style={styles(theme).questionText}>{currentQuestion.question}</Text>
          
          <View style={styles(theme).answersContainer}>
            {currentQuestion.answers.map((answer, index) => {
              const isSelected = selectedAnswers[currentQuestion.id] === answer;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles(theme).answerButton,
                    isSelected && styles(theme).selectedAnswer
                  ]}
                  onPress={() => handleAnswerSelect(currentQuestion.id, answer)}
                >
                  <Text style={[
                    styles(theme).answerText,
                    isSelected && styles(theme).selectedAnswerText
                  ]}>
                    {String.fromCharCode(65 + index)}. {answer}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles(theme).navigationContainer}>
        <TouchableOpacity
          style={[
            styles(theme).navButton,
            styles(theme).navButtonSecondary,
            currentQuestionIndex === 0 && styles(theme).disabledButton
          ]}
          onPress={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={[
            styles(theme).navButtonText,
            styles(theme).navButtonTextSecondary,
            currentQuestionIndex === 0 && styles(theme).disabledButtonText
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <TouchableOpacity
            style={[
              styles(theme).submitButton,
              submitting && styles(theme).disabledButton
            ]}
            onPress={handleSubmitQuiz}
            disabled={submitting}
          >
            <Text style={styles(theme).submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles(theme).navButton}
            onPress={handleNextQuestion}
          >
            <Text style={styles(theme).navButtonText}>Next</Text>
          </TouchableOpacity>
        )}
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
  progressContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: theme.colors.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.buttonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  questionContainer: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 24,
  },
  answersContainer: {
    gap: 12,
  },
  answerButton: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  selectedAnswer: {
    backgroundColor: theme.colors.answerSelectedBackground,
    borderColor: theme.colors.primary,
  },
  answerText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedAnswerText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navButton: {
    backgroundColor: theme.colors.buttonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navButtonSecondary: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navButtonText: {
    fontSize: 16,
    color: theme.colors.buttonPrimaryText,
    fontWeight: '500',
  },
  navButtonTextSecondary: {
    color: theme.colors.text,
  },
  submitButton: {
    backgroundColor: theme.colors.buttonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: theme.colors.buttonPrimaryText,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: theme.colors.buttonDisabled,
    opacity: 0.5,
  },
  disabledButtonText: {
    color: theme.colors.buttonDisabledText,
  },
});

export default QuizTakingScreen;
