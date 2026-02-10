import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';
import { layout } from '../../config/layout';
import { useCommonStyles } from '../../hooks/useCommonStyles';

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
  const common = useCommonStyles();
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

      const result = await tryFetchWithFallback(
        `
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
      `,
        { quizId },
        token,
      );

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

  const currentStyles = styles(theme, fontSizes, spacing, borderRadius, common);

  if (loading) {
    return (
      <View style={common.container}>
        <View style={common.header}>
          <View style={common.headerTextWrapper}>
            <Text style={common.headerTitle}> {t('quiz_results.loading_results')} </Text>
          </View>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('quiz_results.loading_quiz_results')} </Text>
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
            <Text style={common.headerTitle}> {t('quiz_results.results_error')} </Text>
          </View>
        </View>
        <View style={currentStyles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={theme.colors.error}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={currentStyles.errorTitle}> {t('quiz_results.error_loading_results')} </Text>
          <Text style={currentStyles.errorText}> {error} </Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchQuizResults}>
            <Text style={currentStyles.retryButtonText}> {t('home_screen.try_again')} </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!quizResult) {
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
            <Text style={common.headerTitle}> {t('quiz_results.no_results')} </Text>
          </View>
        </View>
        <View style={currentStyles.errorContainer}>
          <Ionicons
            name="stats-chart"
            size={48}
            color={theme.colors.textSecondary}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={currentStyles.errorTitle}> {t('quiz_results.no_results_available')} </Text>
          <Text style={currentStyles.errorText}> {t('quiz_results.results_not_available')} </Text>
        </View>
      </View>
    );
  }

  const percentage = Math.round((quizResult.score / quizResult.totalQuestions) * 100);
  const correctAnswers = quizResult.userAnswers.filter((answer) => answer.is_correct).length;

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
          <Text style={common.headerTitle}> {t('quiz_results.header_title')} </Text>
          <Text style={common.headerSubtitle}> {quizResult.quiz.name} </Text>
        </View>
      </View>

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={currentStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Summary */}
        <View style={currentStyles.scoreContainer}>
          <View
            style={[
              currentStyles.scoreCircle,
              quizResult.isPassed
                ? currentStyles.scoreCirclePassed
                : currentStyles.scoreCircleFailed,
            ]}
          >
            <Text
              style={[
                currentStyles.scorePercentage,
                quizResult.isPassed
                  ? currentStyles.scorePercentagePassed
                  : currentStyles.scorePercentageFailed,
              ]}
            >
              {percentage} %
            </Text>
            <Text style={currentStyles.scoreLabel}> {t('home_screen.score')} </Text>
          </View>

          <View style={currentStyles.scoreStats}>
            <View style={currentStyles.scoreItem}>
              <Text style={currentStyles.scoreNumber}> {quizResult.totalQuestions} </Text>
              <Text style={currentStyles.scoreText}> {t('common.total')} </Text>
            </View>
            <View style={currentStyles.scoreItem}>
              <Text style={currentStyles.scoreNumber}>
                {quizResult.totalQuestions - correctAnswers}
              </Text>
              <Text style={currentStyles.scoreText}> {t('common.incorrect')} </Text>
            </View>
            <View style={currentStyles.scoreItem}>
              <Text style={currentStyles.scoreNumber}> {correctAnswers} </Text>
              <Text style={currentStyles.scoreText}> {t('common.correct')} </Text>
            </View>
          </View>
        </View>

        {/* Pass/Fail Status Banner */}
        <View
          style={[
            currentStyles.statusBanner,
            quizResult.isPassed
              ? currentStyles.statusBannerPassed
              : currentStyles.statusBannerFailed,
          ]}
        >
          <View style={currentStyles.statusContent}>
            <Ionicons
              name={quizResult.isPassed ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={quizResult.isPassed ? theme.colors.success : theme.colors.error}
              style={currentStyles.statusIcon}
            />
            <Text
              style={[
                currentStyles.statusText,
                quizResult.isPassed
                  ? currentStyles.statusTextPassed
                  : currentStyles.statusTextFailed,
              ]}
            >
              {quizResult.isPassed
                ? t('quiz_results.congratulations_passed')
                : t('quiz_results.need_practice')}
            </Text>
          </View>
        </View>

        {/* Question Review Section */}
        <View style={currentStyles.reviewSection}>
          <Text style={currentStyles.reviewTitle}> {t('quiz_results.questions_to_review')} </Text>

          {(() => {
            const wrongAnswers = quizResult.userAnswers.filter((answer) => !answer.is_correct);

            if (wrongAnswers.length === 0) {
              return (
                <View style={currentStyles.perfectScoreCard}>
                  <Ionicons
                    name="trophy"
                    size={60}
                    color="#F59E0B"
                    style={{ marginBottom: spacing.xl }}
                  />
                  <Text style={currentStyles.perfectScoreTitle}>
                    {t('quiz_results.perfect_score')}
                  </Text>
                  <Text style={currentStyles.perfectScoreText}>
                    {' '}
                    {t('quiz_results.all_correct')}{' '}
                  </Text>
                </View>
              );
            }

            return wrongAnswers.map((answer, index) => (
              <View key={answer.question.id} style={currentStyles.questionCard}>
                <View style={currentStyles.questionHeader}>
                  <Text style={currentStyles.questionNumber}>
                    {t('quiz_taking.question_number', { number: index + 1 })}
                  </Text>
                  <View style={currentStyles.badgeError}>
                    <Text style={currentStyles.badgeErrorText}> {t('common.incorrect')} </Text>
                  </View>
                </View>

                <Text style={currentStyles.questionText}> {answer.question.question} </Text>

                <View style={currentStyles.answerBoxWrong}>
                  <Text style={currentStyles.answerLabel}>
                    <Ionicons name="close" size={12} color={theme.colors.error} />{' '}
                    {t('quiz_results.your_answer')}
                  </Text>
                  <Text style={currentStyles.answerText}> {answer.selected_answer} </Text>
                </View>

                <View style={currentStyles.answerBoxCorrect}>
                  <Text style={currentStyles.answerLabel}>
                    <Ionicons name="checkmark" size={12} color={theme.colors.success} />{' '}
                    {t('quiz_results.correct_answer')}
                  </Text>
                  <Text style={currentStyles.answerText}> {answer.question.answer_1} </Text>
                </View>

                {answer.question.explanation && (
                  <View style={currentStyles.explanationBox}>
                    <Text style={currentStyles.explanationLabel}>
                      <Ionicons name="bulb-outline" size={14} color={theme.colors.primary} />{' '}
                      {t('quiz_results.explanation')}
                    </Text>
                    <Text style={currentStyles.explanationText}>
                      {' '}
                      {answer.question.explanation}{' '}
                    </Text>
                  </View>
                )}
              </View>
            ));
          })()}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={currentStyles.footer}>
        <TouchableOpacity style={currentStyles.retakeButton} onPress={onRetakeQuiz}>
          <Text style={currentStyles.retakeButtonText}> {t('quiz_results.retake_quiz')} </Text>
        </TouchableOpacity>
        <TouchableOpacity style={currentStyles.doneButton} onPress={onBack}>
          <Text style={currentStyles.doneButtonText}> {t('common.done')} </Text>
        </TouchableOpacity>
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
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: layout.screenPadding,
      alignItems: 'stretch',
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
      marginBottom: spacing.xl,
      color: theme.colors.textSecondary,
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.primary,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: fontSizes.base,
      fontWeight: '600',
    },
    scoreContainer: {
      padding: spacing['2xl'],
      borderRadius: borderRadius.xl,
      marginBottom: spacing.xl,
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      ...layout.shadow,
    },
    scoreCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
      backgroundColor: theme.colors.background,
    },
    scoreCirclePassed: {
      borderColor: theme.colors.success,
    },
    scoreCircleFailed: {
      borderColor: theme.colors.error,
    },
    scorePercentage: {
      fontSize: 36,
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
      color: theme.colors.textSecondary,
    },
    scoreStats: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-around',
      width: '100%',
    },
    scoreItem: {
      alignItems: 'center',
    },
    scoreNumber: {
      fontSize: fontSizes.xl,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    scoreText: {
      fontSize: fontSizes.xs,
      marginTop: spacing.xs,
      color: theme.colors.textSecondary,
    },
    statusBanner: {
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.xl,
    },
    statusBannerPassed: {
      backgroundColor: theme.colors.successBackground || 'rgba(16, 185, 129, 0.1)',
    },
    statusBannerFailed: {
      backgroundColor: theme.colors.errorBackground || 'rgba(239, 68, 68, 0.1)',
    },
    statusContent: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
    },
    statusIcon: {
      ...common.marginEnd(spacing.md),
    },
    statusText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      flex: 1,
      textAlign: common.textAlign,
    },
    statusTextPassed: {
      color: theme.colors.success,
    },
    statusTextFailed: {
      color: theme.colors.error,
    },
    reviewSection: {
      marginBottom: spacing.xl,
    },
    reviewTitle: {
      fontSize: fontSizes.xl,
      fontWeight: 'bold',
      marginBottom: spacing.lg,
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    questionCard: {
      padding: spacing.xl,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      backgroundColor: theme.colors.card,
      ...layout.shadow,
    },
    questionHeader: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    questionNumber: {
      fontSize: fontSizes.sm,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    badgeError: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: theme.colors.errorBackground,
    },
    badgeErrorText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.colors.error,
    },
    questionText: {
      fontSize: fontSizes.base,
      marginBottom: spacing.lg,
      lineHeight: 24,
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    answerBoxWrong: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      ...common.borderStartWidth(4),
      ...common.borderStartColor(theme.colors.error),
      backgroundColor: theme.colors.errorBackground,
    },
    answerBoxCorrect: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      ...common.borderStartWidth(4),
      ...common.borderStartColor(theme.colors.success),
      backgroundColor: theme.colors.successBackground,
    },
    answerLabel: {
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 4,
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    answerText: {
      fontSize: fontSizes.base,
      fontWeight: '500',
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    explanationBox: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginTop: spacing.sm,
      backgroundColor: theme.colors.background,
    },
    explanationLabel: {
      fontSize: fontSizes.sm,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    explanationText: {
      fontSize: fontSizes.sm,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    perfectScoreCard: {
      alignItems: 'center',
      padding: 40,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.card,
      ...layout.shadow,
    },
    perfectScoreTitle: {
      fontSize: fontSizes.xl,
      fontWeight: 'bold',
      marginBottom: spacing.sm,
      color: theme.colors.text,
    },
    perfectScoreText: {
      fontSize: fontSizes.base,
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
    footer: {
      flexDirection: common.rowDirection,
      padding: spacing.xl,
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: spacing.md,
    },
    retakeButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    retakeButtonText: {
      fontSize: fontSizes.base,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    doneButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    doneButtonText: {
      fontSize: fontSizes.base,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
  });

export default QuizResultsScreen;
