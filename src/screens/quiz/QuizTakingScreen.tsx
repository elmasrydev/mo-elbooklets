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
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { layout } from '../../config/layout';
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';

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

const QuizTakingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { quizId } = route.params || {};

  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleBackPress = () => {
    Alert.alert(t('quiz_taking.leave_quiz_title'), t('quiz_taking.leave_quiz_message'), [
      { text: t('quiz_taking.continue_quiz'), style: 'cancel' },
      {
        text: t('quiz_taking.leave_quiz'),
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    } else {
      setError(t('common.error'));
      setLoading(false);
    }
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
    if (!quiz || submitting) return;

    try {
      setSubmitting(true);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert(t('common.error'), t('common.error'));
        setSubmitting(false);
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
        // Navigate back to the main tabs with completion param
        // This ensures checking MainTabs > Quiz > route.params.completedQuizId
        navigation.navigate('MainTabs', {
          screen: 'Quiz',
          params: { completedQuizId: quiz.id },
        });
      } else {
        // Show alert for submission error instead of replacing screen with error view
        const errorMessage = result.errors?.[0]?.message || t('common.unexpected_error');
        Alert.alert(t('common.error'), errorMessage);
      }
    } catch (err: any) {
      console.error('Submit quiz error:', err);
      Alert.alert(t('common.error'), err.message || t('common.unexpected_error'));
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  // Ref to track mount status for async state updates
  const mountedRef = React.useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const currentStyles = styles(theme, typography, spacing, borderRadius, common);

  if (loading) {
    return (
      <View style={common.container}>
        <UnifiedHeader title={t('quiz_taking.loading_quiz')} />
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
        <UnifiedHeader showBackButton title={t('quiz_taking.quiz_error')} />
        <View style={currentStyles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={theme.colors.error}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={currentStyles.errorTitle}> {t('quiz_taking.error_loading_quiz')} </Text>
          <Text style={currentStyles.errorText}> {error} </Text>
          <AppButton
            title={t('home_screen.try_again')}
            onPress={fetchQuiz}
            size="sm"
            fullWidth={false}
          />
        </View>
      </View>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <View style={common.container}>
        <UnifiedHeader showBackButton title={t('quiz_taking.no_questions')} />
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
      <UnifiedHeader
        showBackButton
        onBackPress={handleBackPress}
        title={
          <Text style={common.headerTitle} numberOfLines={1}>
            {t('quiz_taking.quiz')} - {quiz.subject.name}
          </Text>
        }
      />

      {/* Progress Bar */}
      <View style={currentStyles.progressContainer}>
        <View style={currentStyles.progressBar}>
          <View style={(currentStyles.progressFill, { width: `${progress}%` })} />
          <View style={currentStyles.progressTextContainer}>
            <View style={currentStyles.progressTextWrapper}>
              <Text style={currentStyles.progressTextCenter}> {Math.round(progress)} % </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={currentStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.questionContainer}>
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
                    <View style={currentStyles.checkIconContainer}>
                      <Ionicons name="checkmark" size={16} color="#20A66E" />
                    </View>
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
        <AppButton
          title={t('common.previous')}
          onPress={handlePreviousQuestion}
          variant="secondary"
          size="md"
          disabled={currentQuestionIndex === 0}
          icon={
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={20}
              color={currentQuestionIndex === 0 ? theme.colors.textTertiary : theme.colors.text}
            />
          }
          iconPosition="left"
          style={{ flex: 1, marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}
        />

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <AppButton
            title={submitting ? t('quiz_taking.submitting') : t('quiz_taking.submit_quiz')}
            onPress={handleSubmitQuiz}
            loading={submitting}
            icon={!submitting && <Ionicons name="checkmark-done" size={20} color="#fff" />}
            iconPosition="left"
            style={{ flex: 1.5, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }}
          />
        ) : (
          <AppButton
            title={t('common.next')}
            onPress={handleNextQuestion}
            icon={<Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="#fff" />}
            iconPosition="right"
            style={{ flex: 1.5, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }}
          />
        )}
      </View>
    </View>
  );
};

const styles = (theme: any, typography: any, spacing: any, borderRadius: any, common: any) =>
  StyleSheet.create({
    backButton: {
      padding: 4,
      marginRight: common.isRTL ? 0 : 16,
      marginLeft: common.isRTL ? 16 : 0,
    },
    progressContainer: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    progressBar: {
      height: 24,
      borderRadius: 12,
      backgroundColor: '#E5E9F2',
      overflow: 'hidden',
      position: 'relative',
    },
    progressFill: {
      height: '100%',
      borderRadius: 12,
      backgroundColor: '#284196',
    },
    progressTextContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    progressTextWrapper: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    progressTextCenter: {
      color: '#FFFFFF',
      ...typography('buttonSmall'),
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: layout.screenPadding,
      paddingBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.lg,
      ...typography('body'),
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorTitle: {
      ...typography('h2'),
      fontWeight: 'bold',
      marginBottom: spacing.sm,
      color: theme.colors.text,
    },
    errorText: {
      ...typography('caption'),
      textAlign: 'center',
      marginBottom: 20,
      color: theme.colors.textSecondary,
    },
    questionContainer: {
      backgroundColor: theme.colors.card,
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.md,
      ...layout.shadow,
    },
    questionHeader: {
      marginBottom: spacing.sm,
    },
    questionNumber: {
      ...typography('label'),
      color: theme.colors.primary,
      fontWeight: '700',
      textAlign: common.textAlign,
    },
    questionText: {
      ...typography('h2'),
      color: '#111827',
      fontWeight: 'bold',
      marginBottom: spacing.lg,
      lineHeight: 30,
      textAlign: common.textAlign,
    },
    answersContainer: {
      gap: spacing.sm,
    },
    answerButton: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    selectedAnswer: {
      backgroundColor: '#20A66E',
      borderColor: '#20A66E',
    },
    answerLetter: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#284196',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
    },
    selectedAnswerLetter: {
      backgroundColor: '#FFFFFF',
    },
    answerLetterText: {
      ...typography('button'),
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    selectedAnswerLetterText: {
      color: '#20A66E',
    },
    answerText: {
      flex: 1,
      ...typography('body'),
      color: '#374151',
      textAlign: common.textAlign,
      fontWeight: '500',
    },
    selectedAnswerText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    checkIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
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
  });

export default QuizTakingScreen;
