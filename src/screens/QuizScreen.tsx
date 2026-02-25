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
import QuizStartScreen from './quiz/QuizStartScreen';
import RecentActivityCard from '../components/RecentActivityCard';
import UnifiedHeader from '../components/UnifiedHeader';
import AppButton from '../components/AppButton';

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

  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [lessonsModalVisible, setLessonsModalVisible] = useState(false);

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.completedQuizId) {
        const completedId = route.params.completedQuizId;
        navigation.setParams({ completedQuizId: undefined });
        setCurrentStep('history');
        setCurrentQuizId(completedId);
        fetchQuizHistory();
        navigation.navigate('QuizResults', { quizId: completedId });
      } else {
        if (currentStep === 'history') fetchQuizHistory();
      }
    }, [route.params?.completedQuizId, currentStep]),
  );

  useEffect(() => {
    if (route.params?.retakeQuizId) {
      const { subject, lessons } = route.params;
      navigation.setParams({
        retakeQuizId: undefined,
        subject: undefined,
        lessons: undefined,
      });
      resetFlow();
      if (subject && lessons) {
        setSelectedSubject(subject);
        setSelectedLessons(lessons.map((l: any) => l.id));
        setCurrentStep('ready');
      } else {
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
      <UnifiedHeader title={t('quiz_screen.header_title')} />

      <View style={currentStyles.actionSection}>
        <AppButton
          title={t('quiz_screen.take_new_quiz')}
          subtitle={t('quiz_screen.start_new_challenge')}
          onPress={() => setSubjectModalVisible(true)}
          style={currentStyles.takeQuizButton}
          icon={<Ionicons name="flash" size={spacing.icon.xl} color={theme.colors.textOnDark} />}
          iconPosition="right"
          size="lg"
        />
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
            <Ionicons
              name="alert-circle-outline"
              size={spacing.icon.xl}
              color={theme.colors.error}
            />
            <Text style={currentStyles.errorStateTitle}>
              {t('quiz_screen.error_loading_history')}
            </Text>
            <AppButton
              title={t('home_screen.try_again')}
              onPress={fetchQuizHistory}
              size="sm"
              fullWidth={false}
            />
          </View>
        ) : quizHistory.length === 0 ? (
          <View style={currentStyles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={spacing.icon.xl}
              color={theme.colors.textTertiary}
            />
            <Text style={currentStyles.emptyStateTitle}> {t('quiz_screen.no_quizzes_yet')} </Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {' '}
              {t('quiz_screen.take_first_quiz')}{' '}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={currentStyles.historyList}
            contentContainerStyle={{ paddingBottom: Math.max(common.insets.bottom, spacing.xl) }}
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
      padding: layout.screenPadding,
    },
    takeQuizButton: {
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.primary,
      ...layout.shadow,
      minHeight: 70,
    },
    historySection: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
      marginTop: spacing.md,
    },
    historyList: {
      flex: 1,
      marginTop: spacing.md,
    },
    historyItemWrapper: {
      marginBottom: spacing.xs,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    loadingText: {
      marginTop: spacing.md,
      ...typography('body'),
      color: theme.colors.textSecondary,
    },
    errorState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.card,
      ...layout.shadow,
    },
    errorStateTitle: {
      ...typography('h3'),
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      color: theme.colors.text,
      textAlign: 'center',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    emptyStateTitle: {
      ...typography('h3'),
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      color: theme.colors.text,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      ...typography('caption'),
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
  });

export default QuizScreen;
