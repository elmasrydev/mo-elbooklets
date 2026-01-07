import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';

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
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
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
        setError(t('common.error'));
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
        setError(result.errors?.[0]?.message || t('quiz_results.error_loading_results'));
      }
    } catch (err: any) {
      console.error('Fetch quiz results error:', err);
      setError(err.message || t('quiz_results.error_loading_results'));
    } finally {
      setLoading(false);
    }
  };

  const currentStyles = styles(theme, isRTL, fontSizes, spacing, borderRadius);

  if (loading) {
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('quiz_results.loading_results')}</Text>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>{t('quiz_results.loading_quiz_results')}</Text>
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
          <Text style={currentStyles.headerTitle}>{t('quiz_results.results_error')}</Text>
        </View>
        <View style={currentStyles.errorContainer}>
          <Text style={currentStyles.errorIcon}>⚠️</Text>
          <Text style={currentStyles.errorTitle}>{t('quiz_results.error_loading_results')}</Text>
          <Text style={currentStyles.errorText}>{error}</Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchQuizResults}>
            <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!quizResult) {
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('quiz_results.no_results')}</Text>
        </View>
        <View style={currentStyles.errorContainer}>
          <Text style={currentStyles.errorIcon}>📊</Text>
          <Text style={currentStyles.errorTitle}>{t('quiz_results.no_results_available')}</Text>
          <Text style={currentStyles.errorText}>{t('quiz_results.results_not_available')}</Text>
        </View>
      </View>
    );
  }

  const percentage = Math.round((quizResult.score / quizResult.totalQuestions) * 100);
  const correctAnswers = quizResult.userAnswers.filter(answer => answer.is_correct).length;

  return (
    <View style={currentStyles.container}>
      <View style={currentStyles.header}>
        <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
          <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={currentStyles.headerTitle}>{t('quiz_results.header_title')}</Text>
        <Text style={currentStyles.headerSubtitle}>{quizResult.quiz.name}</Text>
      </View>

      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        {/* Score Summary */}
        <View style={currentStyles.scoreContainer}>
          <View style={[
            currentStyles.scoreCircle,
            quizResult.isPassed ? currentStyles.scoreCirclePassed : currentStyles.scoreCircleFailed
          ]}>
            <Text style={[
              currentStyles.scorePercentage,
              quizResult.isPassed ? currentStyles.scorePercentagePassed : currentStyles.scorePercentageFailed
            ]}>
              {percentage}%
            </Text>
            <Text style={currentStyles.scoreLabel}>{t('home_screen.score')}</Text>
          </View>
          
          <View style={currentStyles.scoreDetails}>
            <View style={currentStyles.scoreItem}>
              <Text style={currentStyles.scoreNumber}>{correctAnswers}</Text>
              <Text style={currentStyles.scoreText}>{t('common.correct')}</Text>
            </View>
            <View style={currentStyles.scoreItem}>
              <Text style={currentStyles.scoreNumber}>{quizResult.totalQuestions - correctAnswers}</Text>
              <Text style={currentStyles.scoreText}>{t('common.incorrect')}</Text>
            </View>
            <View style={currentStyles.scoreItem}>
              <Text style={currentStyles.scoreNumber}>{quizResult.totalQuestions}</Text>
              <Text style={currentStyles.scoreText}>{t('common.total')}</Text>
            </View>
          </View>
        </View>

        {/* Pass/Fail Status */}
        <View style={[
          currentStyles.statusContainer,
          quizResult.isPassed ? currentStyles.statusContainerPassed : currentStyles.statusContainerFailed
        ]}>
          <Text style={[
            currentStyles.statusIcon,
            quizResult.isPassed ? currentStyles.statusIconPassed : currentStyles.statusIconFailed
          ]}>
            {quizResult.isPassed ? '✅' : '❌'}
          </Text>
          <Text style={[
            currentStyles.statusText,
            quizResult.isPassed ? currentStyles.statusTextPassed : currentStyles.statusTextFailed
          ]}>
            {quizResult.isPassed ? t('quiz_results.congratulations_passed') : t('quiz_results.need_practice')}
          </Text>
        </View>

        {/* Question Review - Only Wrong Answers */}
        <View style={currentStyles.reviewContainer}>
          <Text style={currentStyles.reviewTitle}>{t('quiz_results.questions_to_review')}</Text>

          {(() => {
            const wrongAnswers = quizResult.userAnswers.filter(answer => !answer.is_correct);

            if (wrongAnswers.length === 0) {
              return (
                <View style={currentStyles.perfectScoreContainer}>
                  <Text style={currentStyles.perfectScoreIcon}>🎉</Text>
                  <Text style={currentStyles.perfectScoreTitle}>{t('quiz_results.perfect_score')}</Text>
                  <Text style={currentStyles.perfectScoreText}>
                    {t('quiz_results.all_correct')}
                  </Text>
                </View>
              );
            }

            return wrongAnswers.map((answer, index) => {
              return (
                <View key={answer.question.id} style={currentStyles.questionReview}>
                  <View style={currentStyles.questionHeader}>
                    <Text style={currentStyles.questionNumber}>
                      {t('quiz_taking.question_number', { number: index + 1 })}
                    </Text>
                    <View style={currentStyles.answerStatus}>
                      <Text style={currentStyles.answerStatusText}>
                        {t('common.incorrect')}
                      </Text>
                    </View>
                  </View>

                  <Text style={currentStyles.questionText}>{answer.question.question}</Text>

                  {/* Your Wrong Answer */}
                  <View style={currentStyles.wrongAnswerContainer}>
                    <Text style={currentStyles.wrongAnswerLabel}>❌ {t('quiz_results.your_answer')}</Text>
                    <Text style={currentStyles.wrongAnswerText}>
                      {answer.selected_answer}
                    </Text>
                  </View>

                  {/* Correct Answer */}
                  <View style={currentStyles.correctAnswerContainer}>
                    <Text style={currentStyles.correctAnswerLabel}>✅ {t('quiz_results.correct_answer')}</Text>
                    <Text style={currentStyles.correctAnswerText}>
                     {answer.question.answer_1}
                    </Text>
                  </View>

                  {answer.question.explanation && (
                    <View style={currentStyles.explanationContainer}>
                      <Text style={currentStyles.explanationLabel}>💡 {t('quiz_results.explanation')}</Text>
                      <Text style={currentStyles.explanationText}>{answer.question.explanation}</Text>
                    </View>
                  )}
                </View>
              );
            });
          })()}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={currentStyles.actionContainer}>
        <TouchableOpacity style={currentStyles.retakeButton} onPress={onRetakeQuiz}>
          <Text style={currentStyles.retakeButtonText}>{t('quiz_results.retake_quiz')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={currentStyles.doneButton} onPress={onBack}>
          <Text style={currentStyles.doneButtonText}>{t('common.done')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = (theme: any, isRTL: boolean, fontSizes: any, spacing: any, borderRadius: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.xl,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    color: theme.colors.headerText,
  },
  headerTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  headerSubtitle: {
    fontSize: fontSizes.base,
    opacity: 0.9,
    marginTop: spacing.xs,
    color: theme.colors.headerSubtitle,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
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
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.xl,
    color: theme.colors.textSecondary,
  },
  retryButton: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: theme.colors.buttonPrimary,
  },
  retryButtonText: {
    color: theme.colors.buttonPrimaryText,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  scoreContainer: {
    padding: spacing['2xl'],
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
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
    marginBottom: spacing.xl,
  },
  scoreCirclePassed: {
    borderColor: theme.colors.success,
  },
  scoreCircleFailed: {
    borderColor: theme.colors.error,
  },
  scorePercentage: {
    fontSize: fontSizes['3xl'],
    fontWeight: 'bold',
  },
  scorePercentagePassed: {
    color: theme.colors.success,
  },
  scorePercentageFailed: {
    color: theme.colors.error,
  },
  scoreLabel: {
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
    color: theme.colors.textSecondary,
  },
  scoreDetails: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: fontSizes['2xl'],
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  scoreText: {
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
    color: theme.colors.textSecondary,
  },
  statusContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  statusContainerPassed: {
    backgroundColor: theme.colors.successBackground,
  },
  statusContainerFailed: {
    backgroundColor: theme.colors.errorBackground,
  },
  statusIcon: {
    fontSize: fontSizes['2xl'],
    marginRight: isRTL ? 0 : spacing.md,
    marginLeft: isRTL ? spacing.md : 0,
  },
  statusIconPassed: {
    color: theme.colors.success,
  },
  statusIconFailed: {
    color: theme.colors.error,
  },
  statusText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    flex: 1,
    textAlign: isRTL ? 'right' : 'left',
  },
  statusTextPassed: {
    color: theme.colors.successText,
  },
  statusTextFailed: {
    color: theme.colors.errorText,
  },
  reviewContainer: {
    marginBottom: spacing.xl,
  },
  reviewTitle: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  questionReview: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    backgroundColor: theme.colors.card,
  },
  questionHeader: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  questionNumber: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  answerStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: theme.colors.errorBackground,
  },
  answerStatusText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: theme.colors.errorText,
  },
  questionText: {
    fontSize: fontSizes.base,
    marginBottom: spacing.md,
    lineHeight: 22,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  explanationContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  explanationLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  explanationText: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    textAlign: isRTL ? 'right' : 'left',
  },
  actionContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.buttonPrimary,
  },
  retakeButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: theme.colors.buttonPrimaryText,
  },
  doneButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  doneButtonText: {
    fontSize: fontSizes.base,
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
    borderLeftWidth: isRTL ? 0 : 4,
    borderRightWidth: isRTL ? 4 : 0,
    borderLeftColor: theme.colors.error,
    borderRightColor: theme.colors.error,
    backgroundColor: theme.colors.errorBackground,
  },
  wrongAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  wrongAnswerText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  correctAnswerContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: isRTL ? 0 : 4,
    borderRightWidth: isRTL ? 4 : 0,
    borderLeftColor: theme.colors.success,
    borderRightColor: theme.colors.success,
    backgroundColor: theme.colors.successBackground,
  },
  correctAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  correctAnswerText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
});

export default QuizResultsScreen;
