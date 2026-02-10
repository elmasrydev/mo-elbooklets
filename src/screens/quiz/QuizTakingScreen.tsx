import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { layout } from '../../config/layout';

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
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
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

      const result = await tryFetchWithFallback(
        `
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
      `,
        { quizId },
        token,
      );

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
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (!quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];

    if (!selectedAnswers[currentQuestion.id]) {
      Alert.alert(t('quiz_taking.answer_required'), t('quiz_taking.select_answer_first'), [
        { text: t('common.ok') },
      ]);
      return;
    }

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];

    if (!selectedAnswers[currentQuestion.id]) {
      Alert.alert(t('quiz_taking.answer_required'), t('quiz_taking.select_answer_last'), [
        { text: t('common.ok') },
      ]);
      return;
    }

    const unansweredQuestions = quiz.questions.filter((q) => !selectedAnswers[q.id]);
    if (unansweredQuestions.length > 0) {
      Alert.alert(
        t('quiz_taking.incomplete_quiz'),
        t('quiz_taking.unanswered_questions', { count: unansweredQuestions.length }),
        [{ text: t('common.ok') }],
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

      const answers = quiz.questions.map((question) => ({
        questionId: question.id,
        selectedAnswer: selectedAnswers[question.id] || null,
      }));

      const result = await tryFetchWithFallback(
        `
        mutation SubmitQuizAnswers($quizId: ID!, $answers: [QuestionAnswerInput!]!) {
          submitQuizAnswers(quizId: $quizId, answers: $answers) {
            score
            totalQuestions
            isPassed
          }
        }
      `,
        { quizId: quiz.id, answers },
        token,
      );

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

  const currentStyles = styles(theme, fontSizes, spacing, borderRadius, common);

  if (loading) {
    return (
      <View style={common.container}>
        <View style={common.header}>
          <View style={common.headerTextWrapper}>
            <Text style={common.headerTitle}> {t('quiz_taking.loading_quiz')} </Text>
          </View>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('quiz_taking.loading_quiz_questions')} </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={common.container}>
        <View style={common.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={24}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
          <View style={common.headerTextWrapper}>
            <Text style={common.headerTitle}> {t('quiz_taking.quiz_error')} </Text>
          </View>
        </View>
        <View style={currentStyles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={theme.colors.error}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={currentStyles.errorTitle}> {t('quiz_taking.error_loading_quiz')} </Text>
          <Text style={currentStyles.errorText}> {error} </Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchQuiz}>
            <Text style={currentStyles.retryButtonText}> {t('home_screen.try_again')} </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <View style={common.container}>
        <View style={common.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={24}
              color={theme.colors.headerText}
            />
          </TouchableOpacity>
          <View style={common.headerTextWrapper}>
            <Text style={common.headerTitle}> {t('quiz_taking.no_questions')} </Text>
          </View>
        </View>
        <View style={currentStyles.errorContainer}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={theme.colors.textSecondary}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={currentStyles.errorTitle}> {t('quiz_taking.no_questions_available')} </Text>
          <Text style={currentStyles.errorText}> {t('quiz_taking.no_questions_yet')} </Text>
        </View>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <View style={common.container}>
      {/* Header */}
      <View style={common.header}>
        <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
          <Ionicons
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
        <View style={common.headerTextWrapper}>
          <Text style={common.headerTitle} numberOfLines={1}>
            {t('quiz_taking.quiz')} - {quiz.subject.name}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={currentStyles.progressContainer}>
        <View style={currentStyles.progressBar}>
          <View style={[currentStyles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={currentStyles.progressText}>
          {t('quiz_taking.question_of', {
            current: currentQuestionIndex + 1,
            total: quiz.questions.length,
          })}
        </Text>
      </View>

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={currentStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.questionContainer}>
          <View style={currentStyles.questionHeader}>
            <Text style={currentStyles.questionNumber}>
              {t('quiz_taking.question_number', { number: currentQuestion.questionNumber })}
            </Text>
            {/* Show difficulty badge if possible, but schema doesn't seem to use it fully visually yet, keeping simple */}
          </View>

          <Text style={currentStyles.questionText}> {currentQuestion.question} </Text>

          <View style={currentStyles.answersContainer}>
            {currentQuestion.answers.map((answer, index) => {
              const isSelected = selectedAnswers[currentQuestion.id] === answer;
              return (
                <TouchableOpacity
                  key={index}
                  style={[currentStyles.answerButton, isSelected && currentStyles.selectedAnswer]}
                  onPress={() => handleAnswerSelect(currentQuestion.id, answer)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      currentStyles.answerLetter,
                      isSelected && currentStyles.selectedAnswerLetter,
                    ]}
                  >
                    <Text
                      style={[
                        currentStyles.answerLetterText,
                        isSelected && currentStyles.selectedAnswerLetterText,
                      ]}
                    >
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      currentStyles.answerText,
                      isSelected && currentStyles.selectedAnswerText,
                    ]}
                  >
                    {answer}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.primary}
                      style={currentStyles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Navigation Footer */}
      <View
        style={[currentStyles.navigationContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        <TouchableOpacity
          style={[
            currentStyles.navButton,
            currentStyles.navButtonSecondary,
            currentQuestionIndex === 0 && currentStyles.disabledButton,
          ]}
          onPress={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
            size={20}
            color={currentQuestionIndex === 0 ? theme.colors.textTertiary : theme.colors.text}
            style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}
          />
          <Text
            style={[
              currentStyles.navButtonText,
              currentStyles.navButtonTextSecondary,
              currentQuestionIndex === 0 && currentStyles.disabledButtonText,
            ]}
          >
            {t('common.previous')}
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <TouchableOpacity
            style={[currentStyles.submitButton, submitting && currentStyles.disabledButton]}
            onPress={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="checkmark-done" size={20} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={currentStyles.submitButtonText}>
              {submitting ? t('quiz_taking.submitting') : t('quiz_taking.submit_quiz')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={currentStyles.navButton} onPress={handleNextQuestion}>
            <Text style={currentStyles.navButtonText}> {t('common.next')} </Text>
            <Ionicons
              name={isRTL ? 'arrow-back' : 'arrow-forward'}
              size={20}
              color="#fff"
              style={{ marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = (theme: any, fontSizes: any, spacing: any, borderRadius: any, common: any) =>
  StyleSheet.create({
    backButton: {
      padding: 4,
      marginRight: common.isRTL ? 0 : 16,
      marginLeft: common.isRTL ? 16 : 0,
    },
    progressContainer: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      marginBottom: 8,
      backgroundColor: theme.colors.borderLight || '#E5E7EB',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    progressText: {
      fontSize: fontSizes.xs,
      textAlign: 'center',
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: layout.screenPadding,
      paddingBottom: 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.lg,
      fontSize: fontSizes.base,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorTitle: {
      fontSize: fontSizes.xl,
      fontWeight: 'bold',
      marginBottom: spacing.sm,
      color: theme.colors.text,
    },
    errorText: {
      fontSize: fontSizes.sm,
      textAlign: 'center',
      marginBottom: 20,
      color: theme.colors.textSecondary,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: borderRadius.md,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: fontSizes.base,
      fontWeight: '600',
    },
    questionContainer: {
      backgroundColor: theme.colors.card,
      padding: spacing.xl,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.lg,
      ...layout.shadow,
    },
    questionHeader: {
      marginBottom: spacing.md,
    },
    questionNumber: {
      fontSize: fontSizes.sm,
      color: theme.colors.primary,
      fontWeight: '700',
      textAlign: common.textAlign,
    },
    questionText: {
      fontSize: fontSizes.lg,
      color: theme.colors.text,
      fontWeight: '600',
      marginBottom: spacing['2xl'],
      lineHeight: 28,
      textAlign: common.textAlign,
    },
    answersContainer: {
      gap: spacing.md,
    },
    answerButton: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    selectedAnswer: {
      backgroundColor: theme.colors.primaryLight || 'rgba(59, 130, 246, 0.05)',
      borderColor: theme.colors.primary,
    },
    answerLetter: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
    },
    selectedAnswerLetter: {
      backgroundColor: theme.colors.primary,
    },
    answerLetterText: {
      fontSize: fontSizes.sm,
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
    },
    selectedAnswerLetterText: {
      color: '#FFFFFF',
    },
    answerText: {
      flex: 1,
      fontSize: fontSizes.base,
      color: theme.colors.text,
      textAlign: common.textAlign,
      fontWeight: '500',
    },
    selectedAnswerText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    checkIcon: {
      ...common.marginStart(spacing.sm),
    },
    navigationContainer: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    navButton: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: 12,
      borderRadius: borderRadius.lg,
    },
    navButtonSecondary: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    navButtonText: {
      fontSize: fontSizes.base,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    navButtonTextSecondary: {
      color: theme.colors.text,
    },
    submitButton: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.success || '#10B981',
      paddingHorizontal: spacing.xl,
      paddingVertical: 12,
      borderRadius: borderRadius.lg,
    },
    submitButtonText: {
      fontSize: fontSizes.base,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    disabledButton: {
      backgroundColor: theme.colors.disabled || '#E5E7EB',
      borderColor: theme.colors.disabled || '#E5E7EB',
      opacity: 0.7,
    },
    disabledButtonText: {
      color: theme.colors.textTertiary,
    },
  });

export default QuizTakingScreen;
