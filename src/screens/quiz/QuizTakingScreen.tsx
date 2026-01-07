import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';

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
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
        setError(t('common.error'));
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
        setError(result.errors?.[0]?.message || t('quiz_taking.error_loading_quiz'));
      }
    } catch (err: any) {
      console.error('Fetch quiz error:', err);
      setError(err.message || t('quiz_taking.error_loading_quiz'));
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
    
    if (!selectedAnswers[currentQuestion.id]) {
      Alert.alert(
        t('quiz_taking.answer_required'),
        t('quiz_taking.select_answer_first'),
        [{ text: t('common.ok') }]
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
    
    if (!selectedAnswers[currentQuestion.id]) {
      Alert.alert(
        t('quiz_taking.answer_required'),
        t('quiz_taking.select_answer_last'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    const unansweredQuestions = quiz.questions.filter(q => !selectedAnswers[q.id]);
    if (unansweredQuestions.length > 0) {
      Alert.alert(
        t('quiz_taking.incomplete_quiz'),
        t('quiz_taking.unanswered_questions', { count: unansweredQuestions.length }),
        [{ text: t('common.ok') }]
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
        setError(t('common.error'));
        return;
      }

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
        setError(result.errors?.[0]?.message || t('common.unexpected_error'));
      }
    } catch (err: any) {
      console.error('Submit quiz error:', err);
      setError(err.message || t('common.unexpected_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const currentStyles = styles(theme, isRTL);

  if (loading) {
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('quiz_taking.loading_quiz')}</Text>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>{t('quiz_taking.loading_quiz_questions')}</Text>
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
          <Text style={currentStyles.headerTitle}>{t('quiz_taking.quiz_error')}</Text>
        </View>
        <View style={currentStyles.errorContainer}>
          <Text style={currentStyles.errorIcon}>⚠️</Text>
          <Text style={currentStyles.errorTitle}>{t('quiz_taking.error_loading_quiz')}</Text>
          <Text style={currentStyles.errorText}>{error}</Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchQuiz}>
            <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('quiz_taking.no_questions')}</Text>
        </View>
        <View style={currentStyles.errorContainer}>
          <Text style={currentStyles.errorIcon}>📝</Text>
          <Text style={currentStyles.errorTitle}>{t('quiz_taking.no_questions_available')}</Text>
          <Text style={currentStyles.errorText}>{t('quiz_taking.no_questions_yet')}</Text>
        </View>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <View style={currentStyles.container}>
      <View style={currentStyles.header}>
        <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
          <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={currentStyles.headerTitle}>{t('quiz_taking.quiz')}</Text>
        <Text style={currentStyles.headerSubtitle}>{quiz.subject.name}</Text>
      </View>

      <View style={currentStyles.progressContainer}>
        <View style={currentStyles.progressBar}>
          <View style={[currentStyles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={currentStyles.progressText}>
          {t('quiz_taking.question_of', { current: currentQuestionIndex + 1, total: quiz.questions.length })}
        </Text>
      </View>

      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        <View style={currentStyles.questionContainer}>
          <Text style={currentStyles.questionNumber}>
            {t('quiz_taking.question_number', { number: currentQuestion.questionNumber })}
          </Text>
          <Text style={currentStyles.questionText}>{currentQuestion.question}</Text>
          
          <View style={currentStyles.answersContainer}>
            {currentQuestion.answers.map((answer, index) => {
              const isSelected = selectedAnswers[currentQuestion.id] === answer;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    currentStyles.answerButton,
                    isSelected && currentStyles.selectedAnswer
                  ]}
                  onPress={() => handleAnswerSelect(currentQuestion.id, answer)}
                >
                  <Text style={[
                    currentStyles.answerText,
                    isSelected && currentStyles.selectedAnswerText
                  ]}>
                    {String.fromCharCode(65 + index)}. {answer}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[currentStyles.navigationContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[
            currentStyles.navButton,
            currentStyles.navButtonSecondary,
            currentQuestionIndex === 0 && currentStyles.disabledButton
          ]}
          onPress={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={[
            currentStyles.navButtonText,
            currentStyles.navButtonTextSecondary,
            currentQuestionIndex === 0 && currentStyles.disabledButtonText
          ]}>
            {t('common.previous')}
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <TouchableOpacity
            style={[
              currentStyles.submitButton,
              submitting && currentStyles.disabledButton
            ]}
            onPress={handleSubmitQuiz}
            disabled={submitting}
          >
            <Text style={currentStyles.submitButtonText}>
              {submitting ? t('quiz_taking.submitting') : t('quiz_taking.submit_quiz')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={currentStyles.navButton}
            onPress={handleNextQuestion}
          >
            <Text style={currentStyles.navButtonText}>{t('common.next')}</Text>
          </TouchableOpacity>
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
    textAlign: isRTL ? 'right' : 'left',
  },
  questionText: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 24,
    textAlign: isRTL ? 'right' : 'left',
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
    textAlign: isRTL ? 'right' : 'left',
  },
  selectedAnswerText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
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
