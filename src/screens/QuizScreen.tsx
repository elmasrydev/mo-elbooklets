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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import { useTranslation } from 'react-i18next';
import QuizSubjectsScreen from './quiz/QuizSubjectsScreen';
import QuizLessonsScreen from './quiz/QuizLessonsScreen';
import QuizResultsScreen from './quiz/QuizResultsScreen';
import QuizStartScreen from './quiz/QuizStartScreen';
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

type QuizFlowStep = 'history' | 'ready';

const QuizScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography } = useTypography();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<QuizFlowStep>('history');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [selectedQuizTypeId, setSelectedQuizTypeId] = useState<string | undefined>(undefined);
  const [selectedQuizTypeName, setSelectedQuizTypeName] = useState<string | undefined>(undefined);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  // Modal visibility
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [lessonsModalVisible, setLessonsModalVisible] = useState(false);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Check if we returned from a completed quiz
      if (route.params?.completedQuizId) {
        const completedId = route.params.completedQuizId;
        // Clear param to avoid loops
        navigation.setParams({ completedQuizId: undefined });

        // Handle completion
        setCurrentStep('history');
        setCurrentQuizId(completedId);
        fetchQuizHistory(); // Refresh history

        // Navigate to QuizResults screen
        navigation.navigate('QuizResults', { quizId: completedId });
      } else {
        if (currentStep === 'history') fetchQuizHistory();
      }
    }, [route.params?.completedQuizId, currentStep]),
  );

  // Handle retake request from Results screen
  useEffect(() => {
    if (route.params?.retakeQuizId) {
      const { subject, lessons } = route.params;

      // Clear params to avoid loops
      navigation.setParams({
        retakeQuizId: undefined,
        subject: undefined,
        lessons: undefined,
      });

      // Reset existing flow state
      resetFlow();

      if (subject && lessons) {
        // Automatically jump to the 'ready' step with the quiz data
        setSelectedSubject(subject);
        setSelectedLessons(lessons.map((l: any) => l.id));
        setCurrentStep('ready');
      } else {
        // Fallback: show subject selection if data is missing
        setSubjectModalVisible(true);
      }
    }
  }, [route.params?.retakeQuizId]);

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
    setLessonsModalVisible(false);
    setSelectedLessons(lessonIds);
    setSelectedQuizTypeId(quizTypeId);
    // Wait for lessons modal close animation before showing start screen
    setTimeout(() => {
      setCurrentStep('ready');
    }, 500);
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

  const handleStartQuiz = async () => {
    if (!selectedSubject) return;
    try {
      const result = await startQuiz(selectedSubject.id, selectedLessons, selectedQuizTypeId);
      if (result.success && result.quizId) {
        setCurrentQuizId(result.quizId);
        // Navigate to QuizTaking
        navigation.navigate('QuizTaking', {
          quizId: result.quizId,
        });
      } else {
        Alert.alert(t('common.error'), result.error || t('quiz_screen.error_loading_history'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('quiz_screen.error_loading_history'));
    }
  };

  const resetFlow = () => {
    setSelectedSubject(null);
    setSelectedLessons([]);
    setSelectedQuizTypeId(undefined);
    setSelectedQuizTypeName(undefined);
    setCurrentQuizId(null);
    setCurrentStep('history');
  };

  // Quiz Start / Ready screen
  if (currentStep === 'ready' && selectedSubject)
    return (
      <QuizStartScreen
        subjectName={selectedSubject.name}
        lessonsCount={selectedLessons.length}
        quizTypeName={selectedQuizTypeName}
        onStart={handleStartQuiz}
        onBack={() => {
          setCurrentStep('history');
          setLessonsModalVisible(true);
        }}
      />
    );

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius, typography);

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
              {t('quiz_screen.start_new_challenge')}
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
              {t('quiz_screen.error_loading_history')}
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
                    navigation.navigate('QuizResults', { quizId: quiz.id });
                  }}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Subject Selection Modal */}
      <Modal
        visible={subjectModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSubjectModalVisible(false)}
      >
        <QuizSubjectsScreen
          onSubjectSelect={(s) => {
            setSubjectModalVisible(false);
            setTimeout(() => {
              setSelectedSubject(s);
              setLessonsModalVisible(true);
            }, 300);
          }}
          onBack={() => setSubjectModalVisible(false)}
        />
      </Modal>

      {/* Lessons Selection Modal */}
      <Modal
        visible={lessonsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLessonsModalVisible(false)}
      >
        {selectedSubject && (
          <QuizLessonsScreen
            subject={selectedSubject}
            onLessonsSelect={handleLessonsSelect}
            onBack={() => setLessonsModalVisible(false)}
          />
        )}
      </Modal>

      {/* Modal logic for QuizResults removed as it is now a screen */}
    </View>
  );
};

const styles = (
  theme: any,
  common: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  typography: any,
) =>
  StyleSheet.create({
    actionSection: {
      padding: spacing.xl,
      marginTop: -30,
    },
    takeQuizButton: {
      padding: 24,
      borderRadius: layout.borderRadius.xl,
      alignItems: 'center',
      backgroundColor: '#6366F1',
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
      ...typography('h3'),
      fontWeight: 'bold',
      marginBottom: 4,
      color: '#FFFFFF',
      textAlign: common.textAlign,
    },
    takeQuizSubtext: {
      ...typography('caption'),
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
    loadingText: { marginTop: 16, ...typography('body'), color: theme.colors.textSecondary },
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
      ...typography('h3'),
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
    retryButtonText: { color: '#fff', ...typography('button') },
    emptyState: {
      padding: 40,
      marginTop: 20,
      alignItems: 'center',
    },
    emptyStateIcon: { fontSize: 48, marginBottom: 16 },
    emptyStateTitle: {
      ...typography('h3'),
      fontWeight: '600',
      marginBottom: 8,
      color: theme.colors.text,
    },
    emptyStateSubtitle: {
      ...typography('caption'),
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
  });

export default QuizScreen;
