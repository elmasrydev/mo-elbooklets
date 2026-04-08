import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';
import { layout } from '../../config/layout';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';
import RetryView from '../../components/RetryView';
import { GenericListSkeleton } from '../../components/SkeletonLoader';
import { useScreenTracking } from '../../hooks/useScreenTracking';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';
import { analytics } from '../../lib/analytics';

interface UserQuizAnswer {
  question: {
    id: string;
    question: string;
    explanation?: string;
    answer_1: string;
  };
  selected_answer: string;
  is_correct: boolean;
  score?: number;
  explanation?: string;
  descriptive_feedback?: {
    coverage_percentage: number;
    score_out_of_10: number;
  };
}

interface QuizResult {
  quiz: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
      language?: string;
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
  isPublished?: boolean;
}

interface QuizResultsScreenProps {
  quizId: string;
  timeTaken?: number;
  onBack?: () => void;
  onGoHome?: () => void;
}

const QuizResultsScreen: React.FC<QuizResultsScreenProps> = (props) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  useScreenTracking('Quiz Results');

  // Use either props (if used in Modal) or route params (if navigated to as a screen)
  const quizId = props.quizId || route.params?.quizId;
  const onBack =
    props.onBack ||
    (() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs', { screen: 'QuizTab' });
      }
    });

  const onGoHome =
    props.onGoHome ||
    (() => {
      navigation.navigate('MainTabs', { screen: 'HomeTab' });
    });

  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    fetchQuizResults();
  }, [quizId]);

  const fetchQuizResults = async () => {
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
        query QuizResults($quizId: ID!) {
          quizResults(quizId: $quizId) {
            quiz {
              id
              name
              subject {
                id
                name
                language
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
                type
                answer_1
                explanation
              }
              selected_answer
              is_correct
              score
              explanation
              descriptive_feedback {
                coverage_percentage
                score_out_of_10
              }
            }
            isPassed
            isPublished
          }
        }
      `,
        { quizId },
        token,
      );

      if (result.data?.quizResults) {
        setQuizResult(result.data.quizResults);
        setPublished(!!result.data.quizResults.isPublished);
        analytics.trackQuizCompleted({
          quiz_id: result.data.quizResults.quiz?.id,
          quiz_title: result.data.quizResults.quiz?.name,
          subject_id: result.data.quizResults.quiz?.subject?.id,
          score: result.data.quizResults.score,
          total_questions: result.data.quizResults.totalQuestions,
          passed: result.data.quizResults.isPassed,
        });
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

  const publishToFeed = async () => {
    if (isPublishing) return;

    try {
      setIsPublishing(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const mutation = `
        mutation PublishQuizToFeed($quizId: ID!) {
          publishQuizToFeed(quizId: $quizId) {
            success
            message
          }
        }
      `;

      const response = await tryFetchWithFallback(mutation, { quizId }, token);

      if (response.data?.publishQuizToFeed?.success) {
        setPublished(!published);
      } else {
        const errMsg =
          response.data?.publishQuizToFeed?.message ||
          response.errors?.[0]?.message ||
          t('common.error');
        setError(errMsg);
      }
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsPublishing(false);
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

  const breadcrumbs = quizResult ? getBreadcrumbs() : [];

  const { contentAlign, contentFlexAlign, contentRowDirection, isContentRTL } = useSubjectTextAlign(
    quizResult?.quiz?.subject?.language,
  );

  const currentStyles = createStyles(
    theme,
    fontSizes,
    typography,
    fontWeight,
    spacing,
    borderRadius,
    common,
    insets,
    contentAlign,
    contentFlexAlign,
    contentRowDirection,
    !!isContentRTL,
  );

  if (loading) {
    return (
      <View style={common.container}>
        <UnifiedHeader title={t('quiz_results.loading_results')} />
        <View style={{ paddingTop: 16 }}>
          <GenericListSkeleton numItems={5} />
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
        <RetryView message={error} onRetry={fetchQuizResults} />
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
          <Text style={currentStyles.errorTitle}>{t('quiz_results.no_results_available')}</Text>
          <Text style={currentStyles.errorText}>{t('quiz_results.results_not_available')}</Text>
        </View>
      </View>
    );
  }

  const percentage = Math.round((quizResult.score / quizResult.totalQuestions) * 100);
  const correctAnswers = quizResult.userAnswers.filter((answer) => answer.is_correct).length;
  const timeTaken = props.timeTaken ?? route.params?.timeTaken;

  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formattedTime = formatTime(timeTaken);

  // Determine state based on percentage and determine icon asset
  const celebrationIcon =
    percentage < 60
      ? require('../../../assets/images/quizzLowIcon.png')
      : percentage < 80
        ? require('../../../assets/images/quizzNormalIcon.png')
        : require('../../../assets/images/quizzSucessIcon.png');

  let stateTheme = {
    color: '#10B981', // green
    bg: '#D1FAE5',
    title: t('quiz_results.outstanding', 'Outstanding!'),
    subtitle: t('quiz_results.mastered_perfectly', "You've mastered this topic perfectly."),
  };

  if (percentage < 60) {
    stateTheme = {
      color: '#FF6B6B', // red
      bg: '#FEE2E2',
      title: t('quiz_results.keep_trying', 'Keep Trying!'),
      subtitle: t('quiz_results.dont_give_up', "Don't give up, review the material."),
    };
  } else if (percentage < 80) {
    stateTheme = {
      color: '#F59E0B', // amber
      bg: '#FEF3C7',
      title: t('quiz_results.good_job', 'Good job!'),
      subtitle: t('quiz_results.can_do_better', "You're getting there! Keep practicing."),
    };
  }

  return (
    <View style={common.container}>
      {/* Navbar Area */}
      <UnifiedHeader
        showBackButton
        onBackPress={onBack}
        title={t('quiz_results.header_title', 'Quiz Results')}
      />

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={currentStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Summary */}
        <View style={currentStyles.celebrationContainer}>
          <Image
            source={celebrationIcon}
            style={currentStyles.celebrationIcon}
            resizeMode="contain"
          />
          <Text style={currentStyles.celebrationTitle}>{stateTheme.title}</Text>
          <Text style={currentStyles.celebrationSubtitle}>{stateTheme.subtitle}</Text>
        </View>

        <View style={currentStyles.progressCardContainer}>
          <View style={currentStyles.progressCardHeader}>
            <View style={currentStyles.progressCardLeft}>
              <Text style={currentStyles.yourScoreLabel}>
                {t('quiz_results.your_score', 'YOUR SCORE')}
              </Text>
              <Text style={[currentStyles.yourScoreValue, { color: stateTheme.color }]}>
                {percentage}%
              </Text>
            </View>
            <View style={currentStyles.progressCardRight}>
              <View style={[currentStyles.passStatusBadge, { backgroundColor: stateTheme.bg }]}>
                <Text style={[currentStyles.passStatusBadgeText, { color: stateTheme.color }]}>
                  {t('quiz_results.pass_status', 'Pass Status')}
                </Text>
              </View>
              <Text style={currentStyles.passStatusValue}>
                {percentage >= 60
                  ? t('home_screen.passed', 'Passed')
                  : t('home_screen.failed', 'Failed')}
              </Text>
            </View>
          </View>

          <View style={currentStyles.progressBarBackground}>
            <View
              style={[
                currentStyles.progressBarFill,
                { width: `${percentage}%`, backgroundColor: stateTheme.color },
              ]}
            />
          </View>
        </View>

        <View style={currentStyles.statsGrid}>
          <View style={currentStyles.statCard}>
            <View style={currentStyles.statHeader}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={currentStyles.statLabelText}>{t('common.correct', 'Correct')}</Text>
            </View>
            <Text style={currentStyles.statValueText}>{correctAnswers}</Text>
          </View>

          <View style={currentStyles.statCard}>
            <View style={currentStyles.statHeader}>
              <Ionicons name="locate" size={20} color={theme.colors.primary} />
              <Text style={currentStyles.statLabelText}>
                {t('quiz_results.accuracy_label', 'Accuracy')}
              </Text>
            </View>
            <Text style={currentStyles.statValueText}>{percentage}%</Text>
          </View>

          {formattedTime && (
            <View style={[currentStyles.statCard, currentStyles.statCardFullWidth]}>
              <View style={currentStyles.statHeader}>
                <Ionicons name="timer-outline" size={20} color="#3B82F6" />
                <Text style={currentStyles.statLabelText}>
                  {t('quiz_results.time_taken_label', 'Time Taken')}
                </Text>
              </View>
              <Text style={currentStyles.statValueText}>{formattedTime}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={currentStyles.actionsContainer}>
          <AppButton
            title={t('home_screen.review')}
            onPress={() => navigation.navigate('QuizReview', { quizId, quizResult })}
            icon={<Ionicons name="eye-outline" size={20} color="#fff" />}
            size="lg"
          />

          <AppButton
            title={
              published ? t('quiz_review.published_to_feed') : t('quiz_review.publish_to_feed')
            }
            onPress={publishToFeed}
            loading={isPublishing}
            variant={published ? 'success' : 'primary'}
            icon={
              <Ionicons
                name={published ? 'checkmark-circle' : 'share-social'}
                size={20}
                color={published ? theme.colors.success : '#fff'}
              />
            }
            size="lg"
            style={
              published ? { backgroundColor: theme.colors.success + '1A', opacity: 1 } : undefined
            }
            textStyle={published ? { color: theme.colors.success } : undefined}
          />

          <AppButton
            title={t('quiz_results.back_to_home', 'Home')}
            onPress={onGoHome}
            variant="outline"
            icon={<Ionicons name="home" size={20} color={theme.colors.textSecondary} />}
            textStyle={{ color: theme.colors.textSecondary }}
            style={{ borderColor: theme.colors.border }}
            size="lg"
          />
        </View>

        {/* Subject Card Mirroring Settings Design */}
        {quizResult?.quiz?.subject?.name ? (
          <View style={currentStyles.subjectBadgeCard}>
            <View style={currentStyles.subjectBadgeIconContainer}>
              <Ionicons name="book" size={24} color="#FFFFFF" />
            </View>
            <View style={currentStyles.subjectBadgeInfo}>
              <Text style={currentStyles.subjectBadgeLabel}>
                {t('quiz_lessons.current_topic', 'Current Topic')}
              </Text>
              <Text style={currentStyles.subjectBadgeTitle}>{quizResult.quiz.subject.name}</Text>
            </View>
          </View>
        ) : null}

        {/* Breadcrumb section with dynamic alignment */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <View style={currentStyles.breadcrumbsCard}>
            <Text style={currentStyles.breadcrumbsCardTitle}>
              {t('quiz_results.covered_topics', 'Covered Topics')}
            </Text>
            {breadcrumbs.map((crumb, index) => (
              <View key={`crumb-${index}`} style={currentStyles.unitBreadcrumb}>
                <View style={currentStyles.unitBreadcrumbHeader}>
                  <View style={currentStyles.breadcrumbDot} />
                  <Text style={currentStyles.unitBreadcrumbName}>{crumb.title}</Text>
                </View>
                {crumb.lessons && (
                  <View style={currentStyles.lessonBreadcrumbsList}>
                    {crumb.lessons.map((lesson, lessonIdx) => (
                      <View key={`lesson-${lessonIdx}`} style={currentStyles.lessonBreadcrumbItem}>
                        <View style={currentStyles.lessonBreadcrumbDot} />
                        <Text style={currentStyles.lessonBreadcrumbName}>{lesson}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (
  theme: any,
  fontSizes: any,
  typography: any,
  fontWeight: any,
  spacing: any,
  borderRadius: any,
  common: any,
  insets: any,
  contentAlign: 'left' | 'right',
  contentFlexAlign: 'flex-start' | 'flex-end',
  contentRowDirection: 'row' | 'row-reverse',
  isContentRTL: boolean,
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
    subjectBadgeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '0D',
      borderWidth: 1,
      borderColor: theme.colors.primary + '1A',
      borderRadius: borderRadius.xl || 16,
      padding: spacing.md,
      marginBottom: spacing.xl,
    },
    subjectBadgeIconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg || 12,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    subjectBadgeInfo: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    subjectBadgeLabel: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.primary,
      textTransform: 'uppercase',
      textAlign: 'left',
    },
    subjectBadgeTitle: {
      fontSize: Math.max(16, fontSizes.lg),
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: 'left',
    },
    breadcrumbsCard: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 16,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    breadcrumbsCardTitle: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.md,
      textAlign: 'left',
    },
    unitBreadcrumb: {
      marginBottom: spacing.sm,
    },
    unitBreadcrumbHeader: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      marginBottom: spacing.sm,
      flexShrink: 1,
    },
    breadcrumbDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginHorizontal: spacing.sm,
    },
    unitBreadcrumbName: {
      ...typography('subtitle2'),
      ...fontWeight('700'),
      color: theme.colors.text,
      flexShrink: 1,
      textAlign: contentAlign,
    },
    lessonBreadcrumbsList: {
      paddingHorizontal: 20,
      paddingVertical: spacing.xs,
    },
    lessonBreadcrumbItem: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      marginBottom: spacing.xs,
      flexShrink: 1,
      gap: 5,
    },
    lessonBreadcrumbDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.textTertiary || '#9CA3AF',
      marginEnd: spacing.sm,
    },
    lessonBreadcrumbName: {
      ...typography('caption'),
      fontSize: 13,
      color: theme.colors.textSecondary,
      flexShrink: 1,
      textAlign: contentAlign,
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
      ...fontWeight('bold'),
      marginBottom: spacing.sm,
      color: theme.colors.text,
    },
    errorText: {
      ...typography('caption'),
      textAlign: 'center',
      marginBottom: spacing.xl,
      color: theme.colors.textSecondary,
    },
    celebrationContainer: {
      alignItems: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
    },
    celebrationIcon: {
      width: 100,
      height: 100,
      marginBottom: spacing.lg,
    },
    celebrationTitle: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    celebrationSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    progressCardContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    progressCardHeader: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    progressCardLeft: {
      alignItems: 'flex-start',
      justifyContent: 'center',
      flex: 1,
    },
    progressCardRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      flex: 1,
    },
    yourScoreLabel: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
      textAlign: common.textAlign,
    },
    yourScoreValue: {
      ...typography('h1'),
      fontSize: 40,
      lineHeight: 48,
      paddingTop: 4,
      ...fontWeight('bold'),
      textAlign: common.textAlign,
    },
    passStatusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.md,
      marginBottom: spacing.xs,
    },
    passStatusBadgeText: {
      ...typography('caption'),
      ...fontWeight('600'),
    },
    passStatusValue: {
      ...typography('subtitle1'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    progressBarBackground: {
      height: 12,
      backgroundColor: theme.colors.border,
      borderRadius: 6,
      overflow: 'hidden',
      flexDirection: common.rowDirection,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 6,
    },
    statsGrid: {
      flexDirection: common.rowDirection,
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statCardFullWidth: {
      minWidth: '100%',
    },
    statHeader: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    statValueText: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    statLabelText: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
      marginLeft: common.isRTL ? 0 : 8,
      marginRight: common.isRTL ? 8 : 0,
      textAlign: common.textAlign,
    },
    actionsContainer: {
      width: '100%',
      gap: 12,
      marginBottom: spacing.sectionGap,
    },
  });

export default QuizResultsScreen;
