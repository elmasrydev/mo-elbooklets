import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import QuizSubjectsScreen from './quiz/QuizSubjectsScreen';
import QuizLessonsScreen from './quiz/QuizLessonsScreen';
import QuizTakingScreen from './quiz/QuizTakingScreen';
import QuizResultsScreen from './quiz/QuizResultsScreen';
import RecentActivityCard from '../components/RecentActivityCard';

interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface QuizHistory {
  id: string;
  name: string;
  subject: { id: string; name: string };
  score: number;
  totalQuestions: number;
  completedAt: string;
  isPassed: boolean;
}

type QuizFlowStep = 'history' | 'subjects' | 'lessons' | 'taking' | 'results';

const QuizScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();

  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<QuizFlowStep>('history');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentStep === 'history') fetchQuizHistory();
    }, [currentStep]),
  );

  const fetchQuizHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      const result = await tryFetchWithFallback(
        `query UserQuizHistory { userQuizHistory { id name subject { id name } score totalQuestions completedAt isPassed } }`,
        undefined,
        token,
      );
      if (result.data?.userQuizHistory) setQuizHistory(result.data.userQuizHistory);
      else setHistoryError(t('quiz_screen.error_loading_history'));
    } catch (err: any) {
      setHistoryError(t('quiz_screen.error_loading_history'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLessonsSelect = async (lessonIds: string[], quizTypeId?: string) => {
    if (!selectedSubject) return;
    try {
      const result = await startQuiz(selectedSubject.id, lessonIds, quizTypeId);
      if (result.success && result.quizId) {
        setCurrentQuizId(result.quizId);
        setCurrentStep('taking');
      } else Alert.alert(t('common.error'), result.error || t('quiz_screen.error_loading_history'));
    } catch (error) {
      Alert.alert(t('common.error'), t('quiz_screen.error_loading_history'));
    }
  };

  const startQuiz = async (
    subjectId: string,
    lessonIds: string[],
    quizTypeId?: string,
  ): Promise<{ success: boolean; quizId?: string; error?: string }> => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return { success: false, error: t('common.error') };
      const result = await tryFetchWithFallback(
        `mutation StartQuiz($subjectId: ID!, $lessonIds: [ID!]!, $quizTypeId: ID) { startQuiz(subjectId: $subjectId, lessonIds: $lessonIds, quizTypeId: $quizTypeId) { id } }`,
        { subjectId, lessonIds, quizTypeId },
        token,
      );
      return result.data?.startQuiz
        ? { success: true, quizId: result.data.startQuiz.id }
        : { success: false, error: t('quiz_screen.error_loading_history') };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  if (currentStep === 'results' && currentQuizId)
    return (
      <QuizResultsScreen
        quizId={currentQuizId}
        onBack={() => {
          setCurrentStep('history');
          setSelectedSubject(null);
          // fetchQuizHistory will trigger via useFocusEffect
        }}
        onRetakeQuiz={() => setCurrentStep('lessons')}
      />
    );

  if (currentStep === 'taking' && currentQuizId)
    return (
      <QuizTakingScreen
        quizId={currentQuizId}
        onQuizComplete={(id) => {
          setCurrentQuizId(id);
          setCurrentStep('results');
        }}
        onBack={() => setCurrentStep('lessons')}
      />
    );

  // Note: 'subjects' step is now handled via Modal, but we keep the step 'lessons' for the flow after modal.
  if (currentStep === 'lessons' && selectedSubject)
    return (
      <QuizLessonsScreen
        subject={selectedSubject}
        onLessonsSelect={handleLessonsSelect}
        onBack={() => setCurrentStep('history')}
      />
    );

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius);

  return (
    <View style={common.container}>
      <View style={common.header}>
        <View style={common.headerTextWrapper}>
          <Text style={common.headerTitle}> {t('quiz_screen.header_title')} </Text>
          <Text style={common.headerSubtitle}> {t('quiz_screen.header_subtitle')} </Text>
        </View>
      </View>

      <View style={currentStyles.actionSection}>
        <TouchableOpacity
          style={currentStyles.takeQuizButton}
          onPress={() => setSubjectModalVisible(true)}
          activeOpacity={0.9}
        >
          <View style={currentStyles.takeQuizContent}>
            <Text style={currentStyles.takeQuizText}> {t('quiz_screen.take_new_quiz')} </Text>
            <Text style={currentStyles.takeQuizSubtext}>
              {' '}
              {t('quiz_screen.start_new_challenge')}{' '}
            </Text>
          </View>
          <View style={currentStyles.takeQuizIconContainer}>
            <Ionicons name="flash" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={currentStyles.historySection}>
        <Text style={common.sectionTitle}> {t('quiz_screen.quiz_history')} </Text>
        {historyLoading ? (
          <View style={currentStyles.loadingState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={currentStyles.loadingText}> {t('quiz_screen.loading_quiz_history')} </Text>
          </View>
        ) : historyError ? (
          <View style={currentStyles.errorState}>
            <Text style={currentStyles.errorStateIcon}>⚠️</Text>
            <Text style={currentStyles.errorStateTitle}>
              {' '}
              {t('quiz_screen.error_loading_history')}{' '}
            </Text>
            <TouchableOpacity style={currentStyles.retryButton} onPress={fetchQuizHistory}>
              <Text style={currentStyles.retryButtonText}> {t('home_screen.try_again')} </Text>
            </TouchableOpacity>
          </View>
        ) : quizHistory.length === 0 ? (
          <View style={currentStyles.emptyState}>
            <Text style={currentStyles.emptyStateIcon}>📝</Text>
            <Text style={currentStyles.emptyStateTitle}> {t('quiz_screen.no_quizzes_yet')} </Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {' '}
              {t('quiz_screen.take_first_quiz')}{' '}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={currentStyles.historyList}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {quizHistory.map((quiz) => (
              <View key={quiz.id} style={currentStyles.historyItemWrapper}>
                <RecentActivityCard
                  activity={quiz}
                  onPress={() => {
                    setCurrentQuizId(quiz.id);
                    setCurrentStep('results');
                  }}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Modal
        visible={subjectModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSubjectModalVisible(false)}
      >
        <QuizSubjectsScreen
          onSubjectSelect={(s) => {
            setSubjectModalVisible(false);
            // Small delay to allow modal to close smoothly before navigating
            setTimeout(() => {
              setSelectedSubject(s);
              setCurrentStep('lessons');
            }, 300);
          }}
          onBack={() => setSubjectModalVisible(false)}
        />
      </Modal>
    </View>
  );
};

const styles = (theme: any, common: any, fontSizes: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    actionSection: {
      padding: spacing.xl,
      marginTop: -30, // Negative margin overlap
    },
    takeQuizButton: {
      padding: 24,
      borderRadius: layout.borderRadius.xl,
      alignItems: 'center',
      backgroundColor: '#6366F1', // Vibrant purple/indigo matching design
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
    },
    takeQuizContent: {
      flex: 1,
      alignItems: common.alignStart,
    },
    takeQuizIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginStart(spacing.lg),
    },
    takeQuizText: {
      fontSize: fontSizes.xl,
      fontWeight: 'bold',
      marginBottom: 4,
      color: '#FFFFFF',
      textAlign: common.textAlign,
    },
    takeQuizSubtext: {
      fontSize: fontSizes.xs,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: common.textAlign,
    },
    historySection: {
      flex: 1,
      paddingHorizontal: spacing.xl,
    },
    historyList: {
      flex: 1,
      marginTop: spacing.md,
    },
    historyItemWrapper: {
      marginBottom: spacing.md,
      borderRadius: layout.borderRadius.xl,
      overflow: 'hidden',
    },
    loadingState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      marginTop: 20,
    },
    loadingText: { marginTop: 16, fontSize: fontSizes.base, color: theme.colors.textSecondary },
    errorState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.card,
      ...layout.shadow,
    },
    errorStateIcon: { fontSize: 48, marginBottom: 16 },
    errorStateTitle: {
      fontSize: fontSizes.lg,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    retryButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.primary,
    },
    retryButtonText: { color: '#fff', fontSize: fontSizes.base, fontWeight: '600' },
    emptyState: {
      padding: 40,
      marginTop: 20,
      alignItems: 'center',
    },
    emptyStateIcon: { fontSize: 48, marginBottom: 16 },
    emptyStateTitle: {
      fontSize: fontSizes.lg,
      fontWeight: '600',
      marginBottom: 8,
      color: theme.colors.text,
    },
    emptyStateSubtitle: {
      fontSize: fontSizes.sm,
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
  });

export default QuizScreen;
