import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
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
import AppButton from '../../components/AppButton';

const QuizReviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { quizId } = route.params || {};

  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const query = `
        query QuizReview($quizId: ID!) {
          quizResults(quizId: $quizId) {
            quiz {
              id
              name
            }
            userAnswers {
              question {
                id
                question
                type
                answer_1
                answer_2
                answer_3
                answer_4
                explanation
              }
              selected_answer
              is_correct
              score
              explanation
              descriptive_feedback {
                coverage_percentage
                score_out_of_10
                covered_concepts
                partially_covered
                missing_concepts
                contradictions
                feedback
              }
            }
          }
        }
      `;

      const response = await tryFetchWithFallback(query, { quizId }, token);
      if (response.data?.quizResults) {
        const processed = {
          ...response.data.quizResults,
          userAnswers: response.data.quizResults.userAnswers.map((ua: any) => {
            const q = ua.question;
            const isDescriptive = ['what_happens', 'give_a_reason'].includes(q.type);
            const answers = isDescriptive
              ? [] // No MCQ options for descriptive
              : [q.answer_1, q.answer_2, q.answer_3, q.answer_4].filter(
                  (a) => a !== null && a !== undefined && a !== '',
                );
            return { ...ua, question: { ...q, answers } };
          }),
        };
        setResult(processed);
      } else {
        setError(response.errors?.[0]?.message || t('common.error'));
      }
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      fetchResults();
    } else {
      setError('No quiz ID');
      setLoading(false);
    }
  }, [quizId]);

  const currentStyles = styles(
    theme,
    spacing,
    borderRadius,
    common,
    insets,
    typography,
    fontWeight,
    isRTL,
  );

  if (loading) {
    return (
      <View style={[common.container, currentStyles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={[common.container, currentStyles.center, { padding: 20 }]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.error}
          style={{ marginBottom: 16 }}
        />
        <Text style={{ ...common.text, textAlign: 'center', marginBottom: 20 }}>
          {error || t('common.error')}
        </Text>
        <AppButton
          title={t('home_screen.try_again')}
          onPress={fetchResults}
          size="sm"
          fullWidth={false}
        />
      </View>
    );
  }

  const wrongAnswers = result.userAnswers.filter((a: any) => !a.is_correct);
  const incorrectCount = wrongAnswers.length;
  const headerTop = Platform.OS === 'ios' ? 0 : insets.top;

  const isDescriptiveType = (type: string) => ['what_happens', 'give_a_reason'].includes(type);

  return (
    <View style={[common.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[currentStyles.header, { paddingTop: Math.max(headerTop, 18) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={currentStyles.closeButton}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={currentStyles.headerTextContainer}>
          <Text style={currentStyles.headerTitle}> {t('home_screen.review')} </Text>
          <Text style={currentStyles.headerSubtitle}>
            {incorrectCount} {t('quiz_results.incorrect_questions')} / {result.userAnswers.length}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={currentStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {wrongAnswers.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color="#10B981"
              style={{ marginBottom: 16 }}
            />
            <Text
              style={{
                ...typography('h3'),
                ...fontWeight('700'),
                color: '#10B981',
                textAlign: 'center',
              }}
            >
              {t('quiz_review.all_correct', 'All answers are correct! 🎉')}
            </Text>
          </View>
        )}
        {wrongAnswers.map((ua: any) => {
          const isDescriptive = isDescriptiveType(ua.question.type);
          // Find the original index in the full result list
          const originalIndex = result.userAnswers.findIndex(
            (ans: any) => ans.question.id === ua.question.id,
          );

          return (
            <View key={ua.question.id} style={currentStyles.questionCard}>
              <View style={currentStyles.badgeRow}>
                <View
                  style={[
                    currentStyles.questionBadge,
                    { backgroundColor: ua.is_correct ? '#10B981' : '#EF4444' },
                  ]}
                >
                  <Text style={currentStyles.badgeText}>
                    {t('quiz_taking.question_number', { number: originalIndex + 1 })}
                  </Text>
                </View>
                {isDescriptive && (
                  <View
                    style={[
                      currentStyles.questionBadge,
                      { backgroundColor: '#EFF6FF', marginHorizontal: 8 },
                    ]}
                  >
                    <Text style={[currentStyles.badgeText, { color: '#1E40AF' }]}>
                      {ua.question.type === 'what_happens'
                        ? t('quiz_taking.what_happens', 'What Happens?')
                        : t('quiz_taking.give_a_reason', 'Give a Reason')}
                    </Text>
                  </View>
                )}
                {!ua.is_correct && !isDescriptive && (
                  <View
                    style={[
                      currentStyles.questionBadge,
                      { backgroundColor: 'rgba(239, 68, 68, 0.1)', marginHorizontal: 8 },
                    ]}
                  >
                    <Text style={[currentStyles.badgeText, { color: '#EF4444' }]}>
                      {t('common.incorrect')}
                    </Text>
                  </View>
                )}
                {isDescriptive && ua.score !== undefined && (
                  <View
                    style={[
                      currentStyles.questionBadge,
                      {
                        backgroundColor: ua.is_correct ? '#ECFDF5' : '#FEF2F2',
                        marginHorizontal: 8,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        currentStyles.badgeText,
                        { color: ua.is_correct ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {isDescriptive && ua.descriptive_feedback?.coverage_percentage !== undefined
                        ? Math.round(ua.descriptive_feedback.coverage_percentage)
                        : Math.round((ua.score || 0) * 100)}
                      %
                    </Text>
                  </View>
                )}
              </View>

              <Text style={currentStyles.questionText}> {ua.question.question} </Text>

              {isDescriptive ? (
                /* Descriptive review: clean comparison layout */
                <View style={{ gap: 16 }}>
                  {/* Side-by-side Answer Comparison */}
                  <View
                    style={{
                      backgroundColor: theme.colors.background,
                      borderRadius: 16,
                      overflow: 'hidden',
                    }}
                  >
                    <View style={{ flexDirection: common.rowDirection }}>
                      {/* Your Answer */}
                      <View style={{ flex: 1, padding: 14 }}>
                        <View
                          style={{
                            flexDirection: common.rowDirection,
                            alignItems: 'center',
                            marginBottom: 10,
                            gap: 6,
                          }}
                        >
                          <Ionicons name="person-outline" size={14} color="#EF4444" />
                          <Text
                            style={{
                              ...typography('label'),
                              ...fontWeight('700'),
                              color: '#EF4444',
                              textTransform: 'uppercase' as any,
                            }}
                          >
                            {t('quiz_review.your_answer', 'Your Answer')}
                          </Text>
                        </View>
                        <Text
                          style={{
                            ...typography('bodySmall'),
                            color: theme.colors.text,
                            lineHeight: 20,
                            textAlign: common.textAlign as any,
                          }}
                        >
                          {ua.selected_answer || t('quiz_review.no_answer', 'No answer provided')}
                        </Text>
                      </View>

                      {/* Divider */}
                      <View
                        style={{
                          width: 1,
                          backgroundColor: theme.colors.border,
                          marginVertical: 12,
                        }}
                      />

                      {/* Model Answer */}
                      <View style={{ flex: 1, padding: 14 }}>
                        <View
                          style={{
                            flexDirection: common.rowDirection,
                            alignItems: 'center',
                            marginBottom: 10,
                            gap: 6,
                          }}
                        >
                          <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                          <Text
                            style={{
                              ...typography('label'),
                              ...fontWeight('700'),
                              color: '#10B981',
                              textTransform: 'uppercase' as any,
                            }}
                          >
                            {t('quiz_review.model_answer', 'Model Answer')}
                          </Text>
                        </View>
                        <Text
                          style={{
                            ...typography('bodySmall'),
                            color: theme.colors.text,
                            lineHeight: 20,
                            textAlign: common.textAlign as any,
                          }}
                        >
                          {ua.question.answer_1}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Unified Concept Analysis Card */}
                  {ua.descriptive_feedback &&
                    (ua.descriptive_feedback.covered_concepts?.length > 0 ||
                      ua.descriptive_feedback.partially_covered?.length > 0 ||
                      ua.descriptive_feedback.missing_concepts?.length > 0 ||
                      ua.descriptive_feedback.contradictions?.length > 0) && (
                      <View
                        style={{
                          backgroundColor: theme.colors.background,
                          borderRadius: 16,
                          padding: 16,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: common.rowDirection,
                            alignItems: 'center',
                            marginBottom: 14,
                            gap: 8,
                          }}
                        >
                          <Ionicons
                            name="analytics-outline"
                            size={18}
                            color={theme.colors.textSecondary}
                          />
                          <Text
                            style={{
                              ...typography('bodySmall'),
                              ...fontWeight('700'),
                              color: theme.colors.text,
                            }}
                          >
                            {t('quiz_review.concept_analysis', 'Concept Analysis')}
                          </Text>
                        </View>

                        <View style={{ gap: 8 }}>
                          {/* Covered */}
                          {ua.descriptive_feedback.covered_concepts?.map(
                            (concept: string, i: number) => (
                              <View
                                key={`c-${i}`}
                                style={{
                                  flexDirection: common.rowDirection,
                                  alignItems: 'flex-start',
                                  gap: 10,
                                }}
                              >
                                <Ionicons
                                  name="checkmark-circle"
                                  size={18}
                                  color="#10B981"
                                  style={{ marginTop: 1 }}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      ...typography('label'),
                                      ...fontWeight('700'),
                                      color: '#10B981',
                                      marginBottom: 2,
                                      textAlign: common.textAlign as any,
                                    }}
                                  >
                                    {t('quiz_review.covered_concepts', 'Covered')}
                                  </Text>
                                  <Text
                                    style={{
                                      ...typography('bodySmall'),
                                      color: '#065F46',
                                      lineHeight: 20,
                                      textAlign: common.textAlign as any,
                                    }}
                                  >
                                    {concept}
                                  </Text>
                                </View>
                              </View>
                            ),
                          )}

                          {/* Partially Covered */}
                          {ua.descriptive_feedback.partially_covered?.map(
                            (concept: string, i: number) => (
                              <View
                                key={`p-${i}`}
                                style={{
                                  flexDirection: common.rowDirection,
                                  alignItems: 'flex-start',
                                  gap: 10,
                                }}
                              >
                                <Ionicons
                                  name="alert-circle"
                                  size={18}
                                  color="#F59E0B"
                                  style={{ marginTop: 1 }}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      ...typography('label'),
                                      ...fontWeight('700'),
                                      color: '#D97706',
                                      marginBottom: 2,
                                      textAlign: common.textAlign as any,
                                    }}
                                  >
                                    {t('quiz_review.partially_covered', 'Partially Covered')}
                                  </Text>
                                  <Text
                                    style={{
                                      ...typography('bodySmall'),
                                      color: '#92400E',
                                      lineHeight: 20,
                                      textAlign: common.textAlign as any,
                                    }}
                                  >
                                    {concept}
                                  </Text>
                                </View>
                              </View>
                            ),
                          )}

                          {/* Missing */}
                          {ua.descriptive_feedback.missing_concepts?.map(
                            (concept: string, i: number) => (
                              <View
                                key={`m-${i}`}
                                style={{
                                  flexDirection: common.rowDirection,
                                  alignItems: 'flex-start',
                                  gap: 10,
                                }}
                              >
                                <Ionicons
                                  name="close-circle"
                                  size={18}
                                  color="#EF4444"
                                  style={{ marginTop: 1 }}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      ...typography('label'),
                                      ...fontWeight('700'),
                                      color: '#EF4444',
                                      marginBottom: 2,
                                      textAlign: common.textAlign as any,
                                    }}
                                  >
                                    {t('quiz_review.missing_concepts', 'Missing')}
                                  </Text>
                                  <Text
                                    style={{
                                      ...typography('bodySmall'),
                                      color: '#991B1B',
                                      lineHeight: 20,
                                      textAlign: common.textAlign as any,
                                    }}
                                  >
                                    {concept}
                                  </Text>
                                </View>
                              </View>
                            ),
                          )}

                          {/* Contradictions */}
                          {ua.descriptive_feedback.contradictions?.map(
                            (item: string, i: number) => (
                              <View
                                key={`x-${i}`}
                                style={{
                                  flexDirection: common.rowDirection,
                                  alignItems: 'flex-start',
                                  gap: 10,
                                }}
                              >
                                <Ionicons
                                  name="warning"
                                  size={18}
                                  color="#DC2626"
                                  style={{ marginTop: 1 }}
                                />
                                <Text
                                  style={{
                                    ...typography('bodySmall'),
                                    color: '#7F1D1D',
                                    lineHeight: 20,
                                    flex: 1,
                                    textAlign: common.textAlign as any,
                                  }}
                                >
                                  {item}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      </View>
                    )}

                  {/* Feedback Card */}
                  {ua.descriptive_feedback?.feedback && (
                    <View
                      style={{
                        backgroundColor: '#F0F9FF',
                        borderRadius: 16,
                        padding: 16,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: common.rowDirection,
                          alignItems: 'center',
                          marginBottom: 10,
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: '#DBEAFE',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons name="bulb-outline" size={16} color="#2563EB" />
                        </View>
                        <Text
                          style={{
                            ...typography('bodySmall'),
                            ...fontWeight('700'),
                            color: '#1E40AF',
                            textAlign: common.textAlign as any,
                          }}
                        >
                          {t('quiz_review.feedback', 'Feedback')}
                        </Text>
                      </View>
                      <Text
                        style={{
                          ...typography('bodySmall'),
                          color: '#1E3A5F',
                          lineHeight: 21,
                          textAlign: common.textAlign as any,
                        }}
                      >
                        {ua.descriptive_feedback.feedback}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                /* MCQ review: show options */
                <View style={currentStyles.optionsContainer}>
                  {ua.question.answers?.map((opt: string, optIndex: number) => {
                    const isSelected = ua.selected_answer === opt;
                    const isAnswerCorrect = ua.question.answer_1 === opt;
                    let optStyle = currentStyles.optionDefault;

                    if (isAnswerCorrect) {
                      optStyle = currentStyles.optionCorrect;
                    } else if (isSelected && !ua.is_correct) {
                      optStyle = currentStyles.optionIncorrect;
                    }

                    return (
                      <View key={optIndex} style={[currentStyles.optionItem, optStyle]}>
                        <View style={currentStyles.optionLetterCircle}>
                          <Text style={currentStyles.optionLetter}>
                            {String.fromCharCode(65 + optIndex)}
                          </Text>
                        </View>
                        <Text style={currentStyles.optionText}> {opt} </Text>
                        <View style={currentStyles.dotIconContainer}>
                          {isAnswerCorrect ? (
                            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                          ) : isSelected && !ua.is_correct ? (
                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {!!(ua.question.explanation || ua.explanation) && (
                <View style={currentStyles.explanationBox}>
                  <Text style={currentStyles.explanationTitle}>
                    {' '}
                    {t('quiz_results.explanation')}{' '}
                  </Text>
                  <Text style={currentStyles.explanationText}>
                    {' '}
                    {ua.question.explanation || ua.explanation}{' '}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <AppButton
          title={t('quiz_results.back_to_results', { defaultValue: 'Back to Results' })}
          onPress={() => navigation.goBack()}
          size="lg"
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = (
  theme: any,
  spacing: any,
  borderRadius: any,
  common: any,
  insets: any,
  typography: any,
  fontWeight: any,
  isRTL: boolean,
) =>
  StyleSheet.create({
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTextContainer: {
      flex: 1,
      alignItems: common.alignStart,
      marginHorizontal: 15,
    },
    headerTitle: {
      ...typography('h2'),
      ...fontWeight('900'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    headerSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      ...fontWeight('600'),
      textAlign: common.textAlign,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: Math.max(insets.bottom, 20),
    },
    questionCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    badgeRow: {
      flexDirection: common.rowDirection,
      marginBottom: 16,
    },
    questionBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    badgeText: {
      color: '#fff',
      fontSize: 11,
      ...fontWeight('800'),
      textTransform: 'uppercase',
    },
    questionText: {
      ...typography('h3'),
      fontSize: 18,
      lineHeight: 26,
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: 24,
      textAlign: common.textAlign,
    },
    optionsContainer: {
      gap: 12,
    },
    optionItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: 10,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    optionDefault: {
      backgroundColor: theme.colors.background,
    },
    optionCorrect: {
      backgroundColor: '#F0FDF4',
      borderColor: '#10B981',
    },
    optionIncorrect: {
      backgroundColor: '#FEF2F2',
      borderColor: '#EF4444',
    },
    optionLetterCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    optionLetter: {
      ...fontWeight('900'),
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    optionText: {
      flex: 1,
      ...typography('body'),
      color: theme.colors.text,
      textAlign: common.textAlign,
      marginStart: 10,
    },
    dotIconContainer: {
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    explanationBox: {
      backgroundColor: '#EFF6FF',
      padding: 16,
      borderRadius: 16,
      marginTop: 24,
      borderWidth: 1,
      borderColor: '#BFDBFE',
    },
    explanationTitle: {
      color: '#1E40AF',
      ...fontWeight('bold'),
      marginBottom: 4,
      textAlign: common.textAlign,
    },
    explanationText: {
      ...typography('bodySmall'),
      color: '#3B82F6',
      textAlign: common.textAlign,
      ...fontWeight('500'),
    },
  });

export default QuizReviewScreen;
