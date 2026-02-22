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
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';
import { layout } from '../../config/layout';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import CircularProgress from '../../components/CircularProgress';
import UnifiedHeader from '../../components/UnifiedHeader';

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

const QuizResultsScreen: React.FC<QuizResultsScreenProps> = (props) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Use either props (if used in Modal) or route params (if navigated to as a screen)
  const quizId = props.quizId || route.params?.quizId;
  const onBack =
    props.onBack ||
    (() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs', { screen: 'Quiz' });
      }
    });

  const onRetakeQuiz =
    props.onRetakeQuiz ||
    (() => {
      // First go back
      navigation.goBack();
      // Wait 1 second (per user request) then open the quiz start logic
      setTimeout(() => {
        navigation.navigate('MainTabs', {
          screen: 'Quiz',
          params: {
            retakeQuizId: quizId,
            // Pass extra info if available to skip selection steps
            subject: quizResult?.quiz?.subject,
            lessons: quizResult?.quiz?.lessons,
          },
        });
      }, 1000);
    });

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
                id
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

  const getBreadcrumbs = (): { title: string; lessons?: string[]; type: 'chapter' | 'quiz' }[] => {
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

    const crumbs: { title: string; lessons?: string[]; type: 'chapter' | 'quiz' }[] = [];
    chapters.forEach((lessons, chapterName) => {
      crumbs.push({
        title: chapterName,
        lessons: lessons,
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
        <UnifiedHeader title={t('quiz_results.loading_results')} />
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
        <UnifiedHeader
          showBackButton
          onBackPress={onBack}
          title={t('quiz_results.results_error')}
        />
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
        <UnifiedHeader showBackButton onBackPress={onBack} title={t('quiz_results.no_results')} />
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
      <UnifiedHeader showBackButton onBackPress={onBack} title={t('quiz_results.header_title')} />

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={currentStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Summary based on n1.png */}
        <View style={currentStyles.scoreGridContainer}>
          <View style={currentStyles.mainScoreWrapper}>
            <CircularProgress
              size={180}
              strokeWidth={15}
              percentage={percentage}
              color={quizResult.isPassed ? theme.colors.success : theme.colors.error}
              showText={false}
            />
            <View style={currentStyles.innerScoreText}>
              <Text style={currentStyles.scoreFraction}>
                {quizResult.score} / {quizResult.totalQuestions}
              </Text>
              <Text
                style={[
                  currentStyles.scorePercentText,
                  { color: quizResult.isPassed ? theme.colors.success : theme.colors.error },
                ]}
              >
                {percentage} %
              </Text>
            </View>
          </View>

          <View style={currentStyles.statusTextWrapper}>
            <Text
              style={[
                currentStyles.congratsText,
                { color: quizResult.isPassed ? theme.colors.success : theme.colors.error },
              ]}
            >
              {quizResult.isPassed
                ? t('quiz_results.congratulations_passed')
                : t('quiz_results.need_practice')}
            </Text>
          </View>

          <View style={currentStyles.statsGrid}>
            <View style={[currentStyles.statCard, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[currentStyles.statValueText, { color: '#10B981' }]}>
                {correctAnswers}
              </Text>
              <Text style={[currentStyles.statLabelText, { color: '#047857' }]}>
                {t('common.correct')}
              </Text>
            </View>
            <View style={[currentStyles.statCard, { backgroundColor: '#FEF2F2' }]}>
              <Text style={[currentStyles.statValueText, { color: '#EF4444' }]}>
                {quizResult.totalQuestions - correctAnswers}
              </Text>
              <Text style={[currentStyles.statLabelText, { color: '#B91C1C' }]}>
                {t('common.incorrect')}
              </Text>
            </View>
            <View style={[currentStyles.statCard, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[currentStyles.statValueText, { color: '#3B82F6' }]}>
                {quizResult.totalQuestions}
              </Text>
              <Text style={[currentStyles.statLabelText, { color: '#1D4ED8' }]}>
                {t('common.total')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons based on n1.png */}
        <View style={currentStyles.actionsContainer}>
          <TouchableOpacity
            style={currentStyles.primaryAction}
            onPress={() => navigation.navigate('QuizReview', { quizId, quizResult })}
          >
            <Ionicons
              name="eye-outline"
              size={20}
              color="#fff"
              style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}
            />
            <Text style={currentStyles.primaryActionText}> {t('home_screen.review')} </Text>
          </TouchableOpacity>

          <TouchableOpacity style={currentStyles.secondaryAction} onPress={onRetakeQuiz}>
            <Ionicons
              name="refresh-outline"
              size={20}
              color={theme.colors.primary}
              style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}
            />
            <Text style={currentStyles.secondaryActionText}> {t('quiz_results.retake_quiz')} </Text>
          </TouchableOpacity>
        </View>

        {/* Refined Breadcrumb: Vertical Stack - moved to bottom */}
        <View style={[currentStyles.breadcrumbContainer]}>
          {/* Always show Subject first */}
          <View style={[currentStyles.breadcrumbRow]}>
            <View style={currentStyles.iconContainer}>
              <Ionicons name="library" size={16} color={theme.colors.primary} />
            </View>
            <Text style={currentStyles.breadcrumbSubjectText}>
              {quizResult?.quiz?.subject?.name}
            </Text>
          </View>

          {/* Show Chapters and Lessons */}
          {breadcrumbs.map((crumb, index) => (
            <View key={index} style={[currentStyles.breadcrumbRow]}>
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
                  {crumb.lessons
                    ? crumb.lessons.map((lesson, lessonIdx) => (
                        <React.Fragment key={lessonIdx}>
                          {lessonIdx > 0 && (
                            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                              {' '}
                              +{' '}
                            </Text>
                          )}
                          <Text>{lesson} </Text>
                        </React.Fragment>
                      ))
                    : crumb.title}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer is now integrated into main scroll for n1 layout */}
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
      flexDirection: 'row',
      alignItems: 'flex-start', // Top align icon with multiline text
      marginBottom: 8,
    },
    iconContainer: {
      marginTop: 2, // Fine tune alignment with text
      marginRight: 12,
      marginLeft: 12,
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
    scoreGridContainer: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    mainScoreWrapper: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    innerScoreText: {
      position: 'absolute',
      alignItems: 'center',
    },
    scoreFraction: {
      ...typography('h2'),
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      lineHeight: 34, // Explicit line height to prevent cutoff
    },
    scorePercentText: {
      ...typography('h3'),
      fontSize: 20,
      fontWeight: '600',
    },
    statusTextWrapper: {
      marginBottom: spacing.xl,
    },
    congratsText: {
      ...typography('h2'),
      fontWeight: '900',
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      width: '100%',
      gap: 12,
    },
    statCard: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 80,
    },
    statValueText: {
      ...typography('h2'),
      fontWeight: '800',
      marginBottom: 2,
    },
    statLabelText: {
      ...typography('caption'),
      fontWeight: 'bold',
      fontSize: 12,
    },
    actionsContainer: {
      width: '100%',
      gap: 12,
      marginBottom: spacing.xl,
    },
    primaryAction: {
      backgroundColor: theme.colors.primary,
      flexDirection: common.rowDirection,
      paddingVertical: 16,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      ...layout.shadow,
    },
    primaryActionText: {
      ...typography('button'),
      color: '#fff',
      fontWeight: 'bold',
    },
    secondaryAction: {
      backgroundColor: theme.colors.card,
      flexDirection: common.rowDirection,
      paddingVertical: 16,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryActionText: {
      ...typography('button'),
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    textAction: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    textActionLabel: {
      ...typography('button'),
      color: theme.colors.textSecondary,
      textDecorationLine: 'underline',
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
