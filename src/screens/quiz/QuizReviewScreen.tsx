import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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
  const { typography } = useTypography();
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
                answer_1
                answer_2
                answer_3
                answer_4
                explanation
              }
              selected_answer
              is_correct
              explanation
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
            const answers = [q.answer_1, q.answer_2, q.answer_3, q.answer_4].filter(
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

  const currentStyles = styles(theme, spacing, borderRadius, common, insets, typography, isRTL);

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

  const incorrectCount = result.userAnswers.filter((a: any) => !a.is_correct).length;

  return (
    <View style={[common.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[currentStyles.header, { paddingTop: 18 }]}>
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
        {result.userAnswers.map((ua: any, index: number) => (
          <View key={ua.question.id} style={currentStyles.questionCard}>
            <View style={currentStyles.badgeRow}>
              <View
                style={[
                  currentStyles.questionBadge,
                  { backgroundColor: ua.is_correct ? '#10B981' : '#EF4444' },
                ]}
              >
                <Text style={currentStyles.badgeText}>
                  {t('quiz_taking.question_number', { number: index + 1 })}
                </Text>
              </View>
              {!ua.is_correct && (
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
            </View>

            <Text style={currentStyles.questionText}> {ua.question.question} </Text>

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

            {(ua.question.explanation || ua.explanation) && (
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
        ))}

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
      fontWeight: '900',
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    headerSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      fontWeight: '600',
      textAlign: common.textAlign,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: Math.max(insets.bottom, 16) + 40,
    },
    questionCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
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
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    questionText: {
      ...typography('h3'),
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '700',
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
      padding: 14,
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
      fontWeight: '900',
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
      fontWeight: 'bold',
      marginBottom: 4,
      textAlign: common.textAlign,
    },
    explanationText: {
      ...typography('bodySmall'),
      color: '#3B82F6',
      textAlign: common.textAlign,
      fontWeight: '500',
    },
  });

export default QuizReviewScreen;
