import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useModal } from '../../context/ModalContext';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import useAndroidBack from '../../hooks/useAndroidBack';
import { useTypography } from '../../hooks/useTypography';
import { layout } from '../../config/layout';
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';
import RetryView from '../../components/RetryView';
import { QuizScreenSkeleton } from '../../components/SkeletonLoader';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';
import { useScreenTracking } from '../../hooks/useScreenTracking';
import analytics from '../../lib/analytics';

const DESCRIPTIVE_TYPES = ['what_happens', 'give_a_reason'];

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
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
    language?: string;
  };
  questions: QuizQuestion[];
  isCompleted: boolean;
  score?: number;
}

const QuizTakingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  useScreenTracking('Quiz Taking');
  const { quizId, isTimed } = route.params || {};

  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimed && !isTimerPaused) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimed, isTimerPaused]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleBackPress = useCallback(() => {
    showConfirm({
      title: t('quiz_taking.leave_quiz_title'),
      message: t('quiz_taking.leave_quiz_message'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.no'),
      confirmVariant: 'danger',
      onConfirm: () => navigation.goBack(),
    });
    // Return true so Android doesn't run its default back action
    return true;
  }, [showConfirm, t, navigation]);

  // Android hardware back → same leave-quiz popup
  useAndroidBack(handleBackPress);

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

      const token = await SecureStore.getItemAsync('auth_token');
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
              language
            }
            questions {
              id
              question
              type
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
        const quizData = result.data.quiz;
        setQuiz(quizData);
        analytics.trackQuizStarted({
          quiz_id: quizData.id,
          quiz_name: quizData.name,
          subject_id: quizData.subject?.id,
          subject_name: quizData.subject?.name,
        });
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

  const handleDescriptiveAnswer = (questionId: string, text: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const isDescriptiveQuestion = (question: QuizQuestion): boolean => {
    return DESCRIPTIVE_TYPES.includes(question.type);
  };

  const handleNextQuestion = () => {
    if (!quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];

    if (!selectedAnswers[currentQuestion.id] || selectedAnswers[currentQuestion.id].trim() === '') {
      showConfirm({
        title: t('quiz_taking.answer_required'),
        message: t('quiz_taking.select_answer_first'),
        showCancel: false,
        onConfirm: () => {},
      });
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

    if (!selectedAnswers[currentQuestion.id] || selectedAnswers[currentQuestion.id].trim() === '') {
      showConfirm({
        title: t('quiz_taking.answer_required'),
        message: t('quiz_taking.select_answer_last'),
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    const unansweredQuestions = quiz.questions.filter(
      (q) => !selectedAnswers[q.id] || selectedAnswers[q.id].trim() === '',
    );
    if (unansweredQuestions.length > 0) {
      showConfirm({
        title: t('quiz_taking.incomplete_quiz'),
        message: t('quiz_taking.unanswered_questions', { count: unansweredQuestions.length }),
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    if (isTimed) {
      setIsTimerPaused(true);
    }

    submitAnswers();
  };

  const submitAnswers = async () => {
    if (!quiz || submitting) return;

    try {
      setSubmitting(true);

      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        showConfirm({
          title: t('common.error'),
          message: t('common.error'),
          showCancel: false,
          onConfirm: () => {},
        });
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
        navigation.navigate('MainTabs', {
          screen: 'Quiz',
          params: { completedQuizId: quiz.id, timeTaken: isTimed ? elapsedSeconds : undefined },
        });
      } else {
        const errorMessage = result.errors?.[0]?.message || t('common.unexpected_error');
        showConfirm({
          title: t('common.error'),
          message: errorMessage,
          showCancel: false,
          onConfirm: () => {},
        });
      }
    } catch (err: any) {
      console.error('Submit quiz error:', err);
      showConfirm({
        title: t('common.error'),
        message: err.message || t('common.unexpected_error'),
        showCancel: false,
        onConfirm: () => {},
      });
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

  const { contentAlign, contentRowDirection } = useSubjectTextAlign(quiz?.subject?.language);
  const currentStyles = styles(
    theme,
    typography,
    fontWeight,
    spacing,
    borderRadius,
    common,
    contentAlign,
    contentRowDirection,
  );

  if (loading) {
    return (
      <View style={common.container}>
        <UnifiedHeader title={t('quiz_taking.loading_quiz')} />
        <View style={{ paddingTop: 16 }}>
          <QuizScreenSkeleton />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={common.container}>
        <UnifiedHeader showBackButton title={t('quiz_taking.quiz_error')} />
        <RetryView message={error} onRetry={fetchQuiz} />
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
          <Text style={currentStyles.errorTitle}>{t('quiz_taking.no_questions_available')}</Text>
          <Text style={currentStyles.errorText}>{t('quiz_taking.no_questions_yet')}</Text>
        </View>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isDescriptive = isDescriptiveQuestion(currentQuestion);

  return (
    <View style={[common.container, currentStyles.screenContainer]}>
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

      {/* Progress Section */}
      <View style={currentStyles.progressSection}>
        <View style={currentStyles.progressRow}>
          <View>
            <Text style={currentStyles.progressLabel}>
              {t('quiz_taking.progress', 'PROGRESS').toUpperCase()}
            </Text>
            <Text style={currentStyles.progressSteps}>
              <Text style={currentStyles.progressCurrentStep}>
                {t('quiz_taking.question', 'Question')}{' '}
                {(currentQuestionIndex + 1).toString().padStart(2, '0')}
              </Text>{' '}
              {t('quiz_taking.of', 'of')} {quiz.questions.length}
            </Text>
          </View>
          {isTimed ? (
            <View
              style={[currentStyles.timerBadge, isTimerPaused && currentStyles.timerBadgePaused]}
            >
              <Ionicons
                name="timer-outline"
                size={16}
                color={isTimerPaused ? '#9CA3AF' : '#284196'}
              />
              <Text
                style={[currentStyles.timerText, isTimerPaused && currentStyles.timerTextPaused]}
              >
                {formatTime(elapsedSeconds)}
              </Text>
            </View>
          ) : (
            <View />
          )}
        </View>
        <View style={currentStyles.progressBarBackground}>
          <View style={[currentStyles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={currentStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.questionWrapper}>
          {isDescriptive && (
            <View style={currentStyles.descriptiveBadge}>
              <Ionicons name="create-outline" size={14} color="#1E40AF" />
              <Text style={currentStyles.descriptiveBadgeText}>
                {currentQuestion.type === 'what_happens'
                  ? t('quiz_taking.what_happens', 'What Happens?')
                  : t('quiz_taking.give_a_reason', 'Give a Reason')}
              </Text>
            </View>
          )}

          <Text style={currentStyles.questionText}>{currentQuestion.question}</Text>

          {isDescriptive ? (
            /* Descriptive answer: multi-line text input */
            <View style={currentStyles.descriptiveContainer}>
              <TextInput
                style={[currentStyles.descriptiveInput, { textAlign: contentAlign }]}
                value={selectedAnswers[currentQuestion.id] || ''}
                onChangeText={(text) => handleDescriptiveAnswer(currentQuestion.id, text)}
                placeholder={t('quiz_taking.write_your_answer', 'Write your answer here...')}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />
              <Text style={currentStyles.charCount}>
                {(selectedAnswers[currentQuestion.id] || '').length} / 2000
              </Text>
            </View>
          ) : (
            /* MCQ / True-False answer buttons */
            <View style={currentStyles.answersContainer}>
              {currentQuestion.answers.map((answer, index) => {
                const isSelected = selectedAnswers[currentQuestion.id] === answer;
                // Basic split strategy if the text clearly has a title and description
                // Using newline if available, else we just use the text as title layout
                const parts = answer.split('\n');
                const hasSubtitle = parts.length > 1;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      currentStyles.answerCard,
                      isSelected && currentStyles.selectedAnswerCard,
                    ]}
                    onPress={() => handleAnswerSelect(currentQuestion.id, answer)}
                    activeOpacity={0.8}
                  >
                    <View style={currentStyles.radioContainer}>
                      <View
                        style={[
                          currentStyles.radioCircle,
                          isSelected && currentStyles.selectedRadioCircle,
                        ]}
                      >
                        {isSelected && <View style={currentStyles.radioDot} />}
                      </View>
                    </View>
                    <View style={currentStyles.answerTextContainer}>
                      <Text
                        style={[
                          currentStyles.answerTitle,
                          isSelected && currentStyles.selectedAnswerTitle,
                        ]}
                      >
                        {parts[0].toLowerCase() === 'true'
                          ? quiz?.subject?.language === 'ar'
                            ? 'صح'
                            : 'True'
                          : parts[0].toLowerCase() === 'false'
                            ? quiz?.subject?.language === 'ar'
                              ? 'خطأ'
                              : 'False'
                            : parts[0]}
                      </Text>
                      {hasSubtitle && (
                        <Text
                          style={[
                            currentStyles.answerSubtitle,
                            isSelected && currentStyles.selectedAnswerSubtitle,
                          ]}
                        >
                          {parts.slice(1).join('\n')}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={[currentStyles.footerContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity
          style={[
            currentStyles.navButton,
            currentStyles.prevButton,
            currentQuestionIndex === 0 && currentStyles.navButtonDisabled,
          ]}
          onPress={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
            size={20}
            color={currentQuestionIndex === 0 ? '#9CA3AF' : '#374151'}
          />
          <Text
            style={[
              currentStyles.navButtonText,
              currentStyles.prevButtonText,
              currentQuestionIndex === 0 && currentStyles.navButtonTextDisabled,
            ]}
          >
            {t('common.previous', 'Previous')}
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <TouchableOpacity
            style={[
              currentStyles.navButton,
              currentStyles.nextButton,
              submitting && currentStyles.navButtonDisabled,
            ]}
            onPress={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={[currentStyles.navButtonText, currentStyles.nextButtonText]}>
                  {t('quiz_taking.finish_quiz', 'Finish Quiz')}
                </Text>
                <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[currentStyles.navButton, currentStyles.nextButton]}
            onPress={handleNextQuestion}
          >
            <Text style={[currentStyles.navButtonText, currentStyles.nextButtonText]}>
              {t('common.next', 'Next')}
            </Text>
            <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = (
  theme: any,
  typography: any,
  fontWeight: any,
  spacing: any,
  borderRadius: any,
  common: any,
  contentAlign: 'left' | 'right',
  contentRowDirection: 'row' | 'row-reverse',
) =>
  StyleSheet.create({
    screenContainer: {
      backgroundColor: '#FFFFFF',
    },
    // Progress Area
    progressSection: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: 14,
      paddingBottom: 14,
      backgroundColor: '#FFFFFF',
    },
    progressRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    progressLabel: {
      ...typography('caption'),
      color: '#6B7280',
      ...fontWeight('700'),
      marginBottom: 4,
      textAlign: contentAlign,
    },
    progressSteps: {
      ...typography('body'),
      color: '#6B7280',
      textAlign: contentAlign,
    },
    progressCurrentStep: {
      color: '#111827',
      ...fontWeight('bold'),
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 16,
      gap: 6,
    },
    timerBadgePaused: {
      backgroundColor: '#F3F4F6',
    },
    timerText: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: '#284196',
    },
    timerTextPaused: {
      color: '#9CA3AF',
    },
    progressBarBackground: {
      height: 6,
      borderRadius: 3,
      backgroundColor: '#F3F4F6',
      width: '100%',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: '#284196',
    },
    // Content Area
    content: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    contentContainer: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: 40,
    },
    questionWrapper: {
      paddingTop: 12,
    },
    questionText: {
      ...typography('h1'),
      color: '#111827',
      ...fontWeight('bold'),
      marginBottom: 24,
      lineHeight: 34,
      textAlign: contentAlign,
    },
    // Options
    answersContainer: {
      gap: 16,
    },
    answerCard: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      padding: 16,
      borderRadius: 24, // High rounding per Calm Design mockup
      borderWidth: 1.5,
      borderColor: '#E5E7EB',
      gap: 7,
    },
    selectedAnswerCard: {
      backgroundColor: '#F8FAFF',
      borderColor: '#284196',
    },
    radioContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      //...common.marginEnd(16),
    },
    radioCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#D1D5DB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedRadioCircle: {
      borderColor: '#284196',
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#284196',
    },
    answerTextContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    answerTitle: {
      ...typography('body'),
      color: '#374151',
      ...fontWeight('bold'),
      textAlign: contentAlign,
    },
    selectedAnswerTitle: {
      color: '#284196',
    },
    answerSubtitle: {
      ...typography('caption'),
      color: '#6B7280',
      marginTop: 4,
      lineHeight: 20,
      textAlign: contentAlign,
    },
    selectedAnswerSubtitle: {
      color: '#4B5563',
    },
    // Descriptive answers styling
    descriptiveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      alignSelf: 'flex-start',
      marginBottom: 16,
      gap: 6,
    },
    descriptiveBadgeText: {
      ...typography('caption'),
      ...fontWeight('700'),
      color: '#1E40AF',
    },
    descriptiveContainer: {
      gap: 8,
    },
    descriptiveInput: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1.5,
      borderColor: '#CBD5E1',
      borderRadius: 16,
      padding: 16,
      minHeight: 180,
      ...typography('body'),
      color: '#1E293B',
      lineHeight: 24,
    },
    charCount: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    // Footer Navigation
    footerContainer: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingTop: 12,
      backgroundColor: '#FFFFFF',
      gap: 16,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    navButton: {
      flex: 1,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 24,
      gap: 8,
    },
    prevButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    nextButton: {
      backgroundColor: '#284196',
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
    navButtonText: {
      ...typography('button'),
      ...fontWeight('bold'),
    },
    prevButtonText: {
      color: '#374151',
    },
    nextButtonText: {
      color: '#FFFFFF',
    },
    navButtonTextDisabled: {
      color: '#9CA3AF',
    },
    postToFeedRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    postToFeedText: {
      ...typography('label'),
      ...fontWeight('600'),
      color: '#6B7280',
    },

    // Legacy placeholders to ensure no crash if common uses them
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
      ...fontWeight('bold'),
      marginBottom: spacing.sm,
      color: theme.colors.text,
    },
    errorText: {
      ...typography('caption'),
      textAlign: 'center',
      marginBottom: 20,
      color: theme.colors.textSecondary,
    },
  });

export default QuizTakingScreen;
