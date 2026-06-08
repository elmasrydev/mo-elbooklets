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

import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';
import { layout } from '../../config/layout';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import AppButton from '../../components/AppButton';
import { textAlign } from '../../lib/rtl';
import { QuizScreenSkeleton } from '../../components/SkeletonLoader';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';
import RetryView from '../../components/RetryView';
import ReportQuestionModal from '../../components/ReportQuestionModal';
import UnifiedHeader from '../../components/UnifiedHeader';

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
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportQuestionId, setSelectedReportQuestionId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'correct' | 'wrong'>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const query = `
        query QuizReview($quizId: ID!) {
          quizResults(quizId: $quizId) {
            quiz {
              id
              name
              subject {
                id
                name
                language
              }
            }
            isPublished
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
        setPublished(!!response.data.quizResults.isPublished);
        const processed = {
          ...response.data.quizResults,
          userAnswers: response.data.quizResults.userAnswers.map((ua: any) => {
            const q = ua.question;
            const isDescriptive = ['what_happens', 'give_a_reason'].includes(q.type);
            
            // Check if it's a True/False question
            const isTrueFalse = q.type === 'true_false';


            let answers = isDescriptive
              ? [] // No MCQ options for descriptive
              : [q.answer_1, q.answer_2, q.answer_3, q.answer_4].filter(
                  (a) => a !== null && a !== undefined && a !== '' && String(a).toLowerCase() !== 'null',
                );

            if (isTrueFalse) {
              answers = [q.answer_1, q.answer_2].filter(
                (a) => a !== null && a !== undefined && a !== '' && String(a).toLowerCase() !== 'null'
              );
            }

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

  useEffect(() => {
    if (quizId) {
      fetchResults();
    } else {
      setError('No quiz ID');
      setLoading(false);
    }
  }, [quizId]);

  const { contentAlign, contentRowDirection } = useSubjectTextAlign(
    result?.quiz?.subject?.language,
  );

  const currentStyles = styles(
    theme,
    spacing,
    borderRadius,
    common,
    insets,
    typography,
    fontWeight,
    isRTL,
    contentAlign,
    contentRowDirection,
  );

  if (loading) {
    return (
      <View style={{ paddingTop: 16 }}>
        <QuizScreenSkeleton />
      </View>
    );
  }

  if (error || !result) {
    return <RetryView message={error || t('common.error')} onRetry={fetchResults} />;
  }

  const totalQuestions = result.userAnswers?.length || 0;
  const correctAnswersList = result.userAnswers?.filter((a: any) => a.is_correct) || [];
  const wrongAnswersList = result.userAnswers?.filter((a: any) => !a.is_correct) || [];
  const correctCount = correctAnswersList.length;
  const incorrectCount = wrongAnswersList.length;

  const displayedAnswers = (result.userAnswers || []).filter((ua: any) => {
    if (currentFilter === 'correct') return ua.is_correct;
    if (currentFilter === 'wrong') return !ua.is_correct;
    return true;
  });

  const isDescriptiveType = (type: string) => ['what_happens', 'give_a_reason'].includes(type);

  const renderFilterChips = () => (
    <View style={currentStyles.chipsContainer}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setCurrentFilter('all')}
        style={[
          currentStyles.chip,
          currentFilter === 'all' ? currentStyles.chipActiveAll : currentStyles.chipIdle,
        ]}
      >
        <Text
          style={[
            currentStyles.chipText,
            currentFilter === 'all' ? currentStyles.chipTextActive : currentStyles.chipTextIdle,
          ]}
        >
          {t('quiz_review.filter_all', 'All')} {totalQuestions}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setCurrentFilter('correct')}
        style={[
          currentStyles.chip,
          currentFilter === 'correct' ? currentStyles.chipActiveCorrect : currentStyles.chipIdle,
        ]}
      >
        <Ionicons
          name="checkmark-circle"
          size={14}
          color={currentFilter === 'correct' ? '#ffffff' : '#16a34a'}
          style={common.marginEnd(4)}
        />
        <Text
          style={[
            currentStyles.chipText,
            currentFilter === 'correct' ? currentStyles.chipTextActive : currentStyles.chipTextIdle,
          ]}
        >
          {t('quiz_review.filter_correct', 'Correct')} {correctCount}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setCurrentFilter('wrong')}
        style={[
          currentStyles.chip,
          currentFilter === 'wrong' ? currentStyles.chipActiveWrong : currentStyles.chipIdle,
        ]}
      >
        <Ionicons
          name="close-circle"
          size={14}
          color={currentFilter === 'wrong' ? '#ffffff' : '#ef4444'}
          style={common.marginEnd(4)}
        />
        <Text
          style={[
            currentStyles.chipText,
            currentFilter === 'wrong' ? currentStyles.chipTextActive : currentStyles.chipTextIdle,
          ]}
        >
          {t('quiz_review.filter_wrong', 'Wrong')} {incorrectCount}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[common.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        title={
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text
              numberOfLines={1}
              style={{
                ...typography('body'),
                ...fontWeight('900'),
                color: theme.colors.headerText,
                textAlign: 'center',
              }}
            >
              {t('quiz_review.review_answers')}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                ...typography('caption'),
                ...fontWeight('700'),
                color: theme.colors.textSecondary,
                marginTop: 2,
                textAlign: 'center',
              }}
            >
              {result.quiz?.subject?.name} · {correctCount}/{totalQuestions} {t('quiz_review.correct')}
            </Text>
          </View>
        }
        centerAlign={true}
        isModal={true}
      />

      {renderFilterChips()}

      <ScrollView
        contentContainerStyle={currentStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedAnswers.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons
              name={currentFilter === 'wrong' ? 'checkmark-circle' : 'help-circle'}
              size={64}
              color={currentFilter === 'wrong' ? '#10B981' : theme.colors.textSecondary}
              style={{ marginBottom: 16 }}
            />
            <Text
              style={{
                ...typography('h3'),
                ...fontWeight('700'),
                color: currentFilter === 'wrong' ? '#10B981' : theme.colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {currentFilter === 'wrong'
                ? t('quiz_review.all_correct', 'All answers are correct! 🎉')
                : t('common.no_results', 'No items found')}
            </Text>
          </View>
        )}

        {displayedAnswers.map((ua: any) => {
          const isDescriptive = isDescriptiveType(ua.question.type);
          const isTrueFalse = ua.question.type === 'true_false';
          const isCorrect = ua.is_correct;

          // Find the original index in the full result list
          const originalIndex = result.userAnswers.findIndex(
            (ans: any) => ans.question.id === ua.question.id,
          );

          const isExpanded = expandedQuestions[ua.question.id] !== undefined
            ? expandedQuestions[ua.question.id]
            : !isCorrect; // wrong expanded by default, correct collapsed by default

          const toggleExpand = () => {
            setExpandedQuestions(prev => ({
              ...prev,
              [ua.question.id]: !isExpanded
            }));
          };

          return (
            <View
              key={ua.question.id}
              style={[
                currentStyles.questionCard,
                {
                  borderStartWidth: 4,
                  borderStartColor: isCorrect ? '#16a34a' : '#ef4444',
                }
              ]}
            >
              {/* Card Header Row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggleExpand}
                style={currentStyles.cardHeaderRow}
              >
                <View style={currentStyles.cardHeaderLeft}>
                  <Text style={currentStyles.questionNumberText}>
                    {t('quiz_taking.question_number', { number: originalIndex + 1 })}
                  </Text>

                  {isCorrect ? (
                    <View style={currentStyles.correctBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    </View>
                  ) : (
                    <View style={currentStyles.wrongBadge}>
                      <Ionicons name="close-circle" size={12} color="#b91c1c" />
                      <Text style={currentStyles.wrongBadgeText}>
                        {t('quiz_review.wrong', 'Wrong')}
                      </Text>
                    </View>
                  )}

                  {isDescriptive && (
                    <View style={currentStyles.descriptiveTypeBadge}>
                      <Text style={currentStyles.descriptiveTypeBadgeText}>
                        {ua.question.type === 'what_happens'
                          ? t('quiz_taking.what_happens', 'What Happens?')
                          : t('quiz_taking.give_a_reason', 'Give a Reason')}
                      </Text>
                    </View>
                  )}
                  
                  {isDescriptive && ua.score !== undefined && (
                    <View
                      style={[
                        currentStyles.descriptiveScoreBadge,
                        { backgroundColor: isCorrect ? '#ECFDF5' : '#FEF2F2' }
                      ]}
                    >
                      <Text
                        style={[
                          currentStyles.descriptiveScoreText,
                          { color: isCorrect ? '#10B981' : '#FF6B6B' }
                        ]}
                      >
                        {ua.descriptive_feedback?.coverage_percentage !== undefined
                          ? Math.round(ua.descriptive_feedback.coverage_percentage)
                          : Math.round((ua.score || 0) * 100)}
                        %
                      </Text>
                    </View>
                  )}
                </View>

                <View style={currentStyles.cardHeaderRight}>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#94a3b8"
                  />
                </View>
              </TouchableOpacity>

              {/* Collapsed State Summary */}
              {!isExpanded && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={toggleExpand}
                  style={currentStyles.collapsedContent}
                >
                  <Text numberOfLines={1} style={currentStyles.collapsedQuestionText}>
                    {ua.question.question}
                  </Text>
                  {isCorrect ? (
                    <Text style={currentStyles.collapsedCorrectAnswer}>
                      ✓ {ua.question.answer_1}
                    </Text>
                  ) : (
                    <View style={currentStyles.collapsedAnswerRow}>
                      <Text style={currentStyles.collapsedWrongAnswer}>
                        ✗ {ua.selected_answer || t('quiz_review.no_answer', 'No answer')}
                      </Text>
                      <Text style={currentStyles.collapsedCorrectAnswer}>
                        ✓ {ua.question.answer_1}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Expanded State Content */}
              {isExpanded && (
                <View style={currentStyles.expandedContent}>
                  <Text style={[currentStyles.questionText, { textAlign: contentAlign }]}>
                    {ua.question.question}
                  </Text>

                  {/* Report button */}
                  <TouchableOpacity
                    style={[currentStyles.reportBtn, { borderColor: theme.colors.border }]}
                    onPress={() => {
                      setSelectedReportQuestionId(ua.question.id);
                      setShowReportModal(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="flag" size={14} color={theme.colors.error} />
                    <Text style={[currentStyles.reportBtnText, { color: theme.colors.textSecondary }]}>
                      {t('report_question.report_btn', 'Report')}
                    </Text>
                  </TouchableOpacity>

                  {isDescriptive ? (
                    /* Descriptive review comparison */
                    <View style={{ gap: 16 }}>
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
                              <Ionicons name="person-outline" size={14} color="#FF6B6B" />
                              <Text
                                style={{
                                  ...typography('label'),
                                  ...fontWeight('700'),
                                  color: '#FF6B6B',
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
                                textAlign: contentAlign,
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
                                textAlign: contentAlign,
                              }}
                            >
                              {ua.question.answer_1}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Concept Analysis */}
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
                                          textAlign: contentAlign,
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
                                          textAlign: contentAlign,
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
                                      color="#FF6B6B"
                                      style={{ marginTop: 1 }}
                                    />
                                    <View style={{ flex: 1 }}>
                                      <Text
                                        style={{
                                          ...typography('label'),
                                          ...fontWeight('700'),
                                          color: '#FF6B6B',
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
                                          textAlign: contentAlign,
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
                                        textAlign: contentAlign,
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

                      {/* Feedback */}
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
                                color: theme.colors.primary,
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
                              textAlign: contentAlign,
                            }}
                          >
                            {ua.descriptive_feedback.feedback}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    /* MCQ options rendering */
                    <View style={currentStyles.optionsContainer}>
                      {ua.question.answers?.map((opt: string, optIndex: number) => {
                        const isSelected = ua.selected_answer === opt;
                        const isAnswerCorrect = ua.question.answer_1 === opt;
                        let optStyle = currentStyles.optionDefault;
                        let letterCircleStyle = currentStyles.optionLetterCircleDefault;
                        let letterTextStyle = currentStyles.optionLetterDefault;
                        let textStyle: any = null;

                        if (isAnswerCorrect) {
                          optStyle = currentStyles.optionCorrect;
                          letterCircleStyle = currentStyles.optionLetterCircleCorrect;
                          letterTextStyle = currentStyles.optionLetterCorrect;
                          textStyle = currentStyles.optionTextCorrect;
                        } else if (isSelected && !isCorrect) {
                          optStyle = currentStyles.optionIncorrect;
                          letterCircleStyle = currentStyles.optionLetterCircleIncorrect;
                          letterTextStyle = currentStyles.optionLetterIncorrect;
                          textStyle = currentStyles.optionTextIncorrect;
                        }

                        return (
                          <View key={optIndex} style={[currentStyles.optionItem, optStyle]}>
                            <View style={[currentStyles.optionLetterCircle, letterCircleStyle]}>
                              <Text style={[currentStyles.optionLetter, letterTextStyle]}>
                                {String.fromCharCode(65 + optIndex)}
                              </Text>
                            </View>
                            <Text style={[currentStyles.optionText, textStyle]}>
                              {isTrueFalse && opt.toLowerCase() === 'true'
                                ? t('common.true')
                                : isTrueFalse && opt.toLowerCase() === 'false'
                                  ? t('common.false')
                                  : opt}
                            </Text>
                            <View style={currentStyles.dotIconContainer}>
                              {isAnswerCorrect ? (
                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                              ) : isSelected && !isCorrect ? (
                                <Ionicons name="close" size={24} color="#FF6B6B" />
                              ) : null}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Explanation box */}
                  {!!(ua.question.explanation || ua.explanation) && (
                    <View style={currentStyles.explanationBox}>
                      <View
                        style={{
                          flexDirection: common.rowDirection,
                          alignItems: 'center',
                          marginBottom: 8,
                          gap: 8,
                        }}
                      >
                        <Ionicons name="bulb" size={20} color="#004A9A" />
                        <Text style={currentStyles.explanationTitle}>
                          {t('quiz_results.explanation')}
                        </Text>
                      </View>
                      <Text style={currentStyles.explanationText}>
                        {ua.question.explanation || ua.explanation}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ gap: 12, marginBottom: 12, marginTop: 12 }}>
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
                color="#fff"
              />
            }
            size="lg"
          />

          <View style={currentStyles.rowButtons}>
            <AppButton
              title={t('quiz_review.back_to_results', 'Back to Results')}
              onPress={() => navigation.goBack()}
              variant="outline"
              size="lg"
              style={{ flex: 1 }}
              textStyle={{ fontSize: isRTL ? 15 : 13.5 }}
            />
            <AppButton
              title={t('quiz_review.new_quiz', 'New Quiz')}
              onPress={() => {
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'MainTabs', params: { screen: 'Quiz' } },
                    { name: 'QuizFlowSubjects' },
                  ],
                });
              }}
              variant="primary"
              size="lg"
              style={{ flex: 1 }}
              textStyle={{ fontSize: isRTL ? 15 : 13.5 }}
            />
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Report Question Modal */}
      {selectedReportQuestionId && (
        <ReportQuestionModal
          visible={showReportModal}
          questionId={selectedReportQuestionId}
          onClose={() => {
            setShowReportModal(false);
            setSelectedReportQuestionId(null);
          }}
        />
      )}
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
  contentAlign: 'left' | 'right',
  contentRowDirection: 'row' | 'row-reverse',
) =>
  StyleSheet.create({
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: Math.max(insets.bottom, 20),
    },
    chipsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1.5,
    },
    chipIdle: {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
    },
    chipActiveAll: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipActiveCorrect: {
      backgroundColor: '#16a34a',
      borderColor: '#16a34a',
    },
    chipActiveWrong: {
      backgroundColor: '#ef4444',
      borderColor: '#ef4444',
    },
    chipText: {
      ...typography('caption'),
      ...fontWeight('800'),
      fontSize: 11,
    },
    chipTextIdle: {
      color: theme.colors.textSecondary,
    },
    chipTextActive: {
      color: '#ffffff',
    },
    questionCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    cardHeaderRight: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    questionNumberText: {
      ...typography('caption'),
      ...fontWeight('900'),
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    correctBadge: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    wrongBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fef2f2',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      gap: 4,
    },
    wrongBadgeText: {
      ...typography('caption'),
      ...fontWeight('800'),
      color: '#b91c1c',
      fontSize: 10,
    },
    descriptiveTypeBadge: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    descriptiveTypeBadgeText: {
      ...typography('caption'),
      ...fontWeight('800'),
      color: theme.colors.primary,
      fontSize: 10,
    },
    descriptiveScoreBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    descriptiveScoreText: {
      ...typography('caption'),
      ...fontWeight('800'),
      fontSize: 10,
    },
    collapsedContent: {
      marginTop: 8,
      gap: 4,
    },
    collapsedQuestionText: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.text,
      textAlign: contentAlign,
    },
    collapsedCorrectAnswer: {
      ...typography('caption'),
      ...fontWeight('500'),
      color: '#16a34a',
      textAlign: contentAlign,
    },
    collapsedAnswerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    collapsedWrongAnswer: {
      ...typography('caption'),
      ...fontWeight('500'),
      color: '#ef4444',
    },
    expandedContent: {
      marginTop: 12,
    },
    questionText: {
      ...typography('h3'),
      fontSize: 16,
      lineHeight: 24,
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: contentAlign,
    },
    optionsContainer: {
      gap: 12,
    },
    optionItem: {
      flexDirection: contentRowDirection,
      gap: 8,
      alignItems: 'center',
      padding: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    optionDefault: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      opacity: 0.7,
      borderWidth: 1,
    },
    optionCorrect: {
      backgroundColor: '#F0FDF4',
      borderColor: '#10B981',
      opacity: 1,
      borderWidth: 1.5,
    },
    optionIncorrect: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FF6B6B',
      opacity: 1,
      borderWidth: 1.5,
    },
    optionLetterCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionLetterCircleDefault: {
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
    optionLetterCircleCorrect: {
      backgroundColor: '#10B981',
    },
    optionLetterCircleIncorrect: {
      backgroundColor: '#FF6B6B',
    },
    optionLetter: {
      ...fontWeight('900'),
      fontSize: 12,
    },
    optionLetterDefault: {
      color: theme.colors.textSecondary,
    },
    optionLetterCorrect: {
      color: '#FFFFFF',
    },
    optionLetterIncorrect: {
      color: '#FFFFFF',
    },
    optionText: {
      flex: 1,
      ...typography('bodySmall'),
      ...fontWeight('500'),
      color: theme.colors.text,
      textAlign: contentAlign,
      marginStart: 4,
    },
    optionTextCorrect: {
      color: '#065F46', // Dark green that pairs well with #F0FDF4
    },
    optionTextIncorrect: {
      color: '#991B1B', // Dark red that pairs well with #FEF2F2
    },
    dotIconContainer: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    explanationBox: {
      backgroundColor: '#F0F9FF',
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
      borderWidth: 1,
      borderColor: '#E0F2FE',
    },
    explanationTitle: {
      color: '#004A9A',
      ...fontWeight('bold'),
      fontSize: 15,
      textAlign: contentAlign,
    },
    explanationText: {
      ...typography('bodySmall'),
      color: '#334155',
      textAlign: contentAlign,
      ...fontWeight('400'),
      lineHeight: 20,
    },
    reportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 20,
      paddingVertical: 5,
      paddingHorizontal: 10,
      gap: 5,
      marginBottom: 16,
    },
    reportBtnText: {
      ...typography('caption'),
      ...fontWeight('600'),
    },
    rowButtons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
  });

export default QuizReviewScreen;
