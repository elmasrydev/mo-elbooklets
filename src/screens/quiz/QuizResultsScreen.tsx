import React, { useEffect, useState, useCallback } from 'react';
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
import { layout } from '../../config/layout';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';

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
    lessons: {
      id: string;
      name: string;
      chapter: {
        name: string;
      };
    }[];
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
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();
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
              lessons {
                id
                name
                chapter {
                  name
                }
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

  const getBreadcrumbs = (): { title: string; subtitle?: string; type: 'chapter' | 'quiz' }[] => {
    if (!quizResult?.quiz?.lessons || quizResult.quiz.lessons.length === 0) {
      // Fallback for old quizzes or if lessons not available
      return [{ title: quizResult?.quiz?.name || '', type: 'quiz' as const }];
    }

    const chapters = new Map<string, string[]>();
    quizResult.quiz.lessons.forEach((lesson) => {
      const chapterName = lesson.chapter?.name || t('common.unknown_unit');
      if (!chapters.has(chapterName)) {
        chapters.set(chapterName, []);
      }
      chapters.get(chapterName)?.push(lesson.name);
    });

    const crumbs: { title: string; subtitle?: string; type: 'chapter' | 'quiz' }[] = [];
    chapters.forEach((lessons, chapterName) => {
      crumbs.push({
        title: chapterName,
        subtitle: lessons.join(' + '),
        type: 'chapter',
      });
    });
    return crumbs;
  };

  const currentStyles = styles(theme, fontSizes, typography, spacing, borderRadius, common, insets);
  const breadcrumbs = quizResult ? getBreadcrumbs() : [];

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
      {/* Navbar Area */}
      <View style={[currentStyles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
          <Ionicons
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
        <View style={common.headerTextWrapper}>
          <Text style={currentStyles.headerTitle}> {t('quiz_results.header_title')} </Text>
        </View>
      </View>

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={currentStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Refined Breadcrumb: Vertical Stack */}
        <View style={currentStyles.breadcrumbContainer}>
          {/* Always show Subject first */}
          <View style={currentStyles.breadcrumbRow}>
            <View style={currentStyles.iconContainer}>
              <Ionicons name="library" size={16} color={theme.colors.primary} />
            </View>
            <Text style={currentStyles.breadcrumbSubjectText}>
              {quizResult?.quiz?.subject?.name}
            </Text>
          </View>

          {/* Show Chapters and Lessons */}
          {breadcrumbs.map((crumb, index) => (
            <View key={index} style={currentStyles.breadcrumbRow}>
              <View style={currentStyles.iconContainer}>
                <Ionicons name="folder-open" size={16} color={theme.colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    currentStyles.breadcrumbQuizText,
                    { color: theme.colors.textSecondary, fontSize: fontSizes.xs, marginBottom: 2 },
                  ]}
                >
                  {crumb.title}
                </Text>
                <Text style={currentStyles.breadcrumbQuizText}>
                  {
                    crumb.subtitle ||
                      crumb.title /* Handle fallback case, usually subtitle has content */
                  }
                </Text>
              </View>
            </View>
          ))}
        </View>

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

const styles = (
  theme: any,
  fontSizes: any,
  typography: any,
  spacing: any,
  borderRadius: any,
  common: any,
  insets: any,
) =>
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
    breadcrumbContainer: {
      flexDirection: 'column',
      backgroundColor: theme.colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      width: '100%',
    },
    breadcrumbRow: {
      flexDirection: common.rowDirection,
      alignItems: 'flex-start', // Top align icon with multiline text
      marginBottom: 8,
    },
    iconContainer: {
      marginTop: 2, // Fine tune alignment with text
      marginRight: common.isRTL ? 0 : 8,
      marginLeft: common.isRTL ? 8 : 0,
    },
    breadcrumbSubjectText: {
      ...typography('caption'),
      fontWeight: '600',
      color: theme.colors.primary,
      flex: 1,
      textAlign: common.textAlign,
    },
    breadcrumbQuizText: {
      ...typography('bodySmall'), // Slightly larger for emphasis
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
      lineHeight: 20,
      textAlign: common.textAlign,
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
      ...typography('button'),
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
      ...typography('caption'),
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
      ...typography('h2'),
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    scoreText: {
      ...typography('caption'),
      fontSize: 12,
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
      ...typography('body'),
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
      ...typography('h2'),
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
      ...typography('caption'),
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
      ...typography('caption'),
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.colors.error,
    },
    questionText: {
      ...typography('body'),
      marginBottom: spacing.lg,
      lineHeight: 24,
      color: theme.colors.text,
    },
    answerBoxWrong: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.errorBackground,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    answerBoxCorrect: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.successBackground,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.success,
    },
    answerLabel: {
      ...typography('caption'),
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.colors.textSecondary,
    },
    answerText: {
      ...typography('body'),
      fontWeight: '600',
      color: theme.colors.text,
    },
    explanationBox: {
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: theme.colors.background,
      borderRadius: borderRadius.md,
    },
    explanationLabel: {
      ...typography('caption'),
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.colors.primary,
    },
    explanationText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    perfectScoreCard: {
      alignItems: 'center',
      padding: spacing['2xl'],
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      ...layout.shadow,
    },
    perfectScoreTitle: {
      ...typography('h2'),
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: spacing.sm,
    },
    perfectScoreText: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    footer: {
      padding: spacing.md,
      // Ensure we always have at least some padding, plus safe area
      paddingBottom: Math.max(spacing.md, insets.bottom + spacing.xs),
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: common.rowDirection,
      gap: spacing.md,
    },
    retakeButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    retakeButtonText: {
      ...typography('buttonSmall'),
      color: theme.colors.text,
    },
    doneButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    doneButtonText: {
      ...typography('buttonSmall'),
      color: '#FFFFFF',
    },
    // Custom Header
    header: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing.md,
      backgroundColor: theme.colors.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border, // subtle separator for sleekness
    },
    headerTitle: {
      fontSize: fontSizes.lg, // Smaller than 2xl
      fontWeight: 'bold',
      color: theme.colors.headerText,
      textAlign: common.textAlign,
    },
  });

export default QuizResultsScreen;
