import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { useLanguage } from '../context/LanguageContext';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import { useTranslation } from 'react-i18next';
import RecentActivityCard from '../components/RecentActivityCard';
import UnifiedHeader from '../components/UnifiedHeader';
import AppButton from '../components/AppButton';

interface QuizHistory {
  id: string;
  name: string;
  subject: { id: string; name: string };
  score: number;
  totalQuestions: number;
  completedAt: string;
  isPassed: boolean;
}

const QuizScreen: React.FC = () => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const { isRTL } = useLanguage();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.completedQuizId) {
        const completedId = route.params.completedQuizId;
        navigation.setParams({ completedQuizId: undefined });
        fetchQuizHistory();
        navigation.navigate('QuizResults', { quizId: completedId });
      } else {
        fetchQuizHistory();
      }
    }, [route.params?.completedQuizId]),
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

  const currentStyles = useMemo(
    () => styles(theme, common, fontSizes, spacing, borderRadius, typography, fontWeight, isRTL),
    [theme, common, fontSizes, spacing, borderRadius, typography, fontWeight, isRTL],
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQuizHistory();
    setRefreshing(false);
  }, []);

  const renderHistoryItem = useCallback(
    ({ item: quiz }: { item: QuizHistory }) => (
      <View style={currentStyles.historyItemWrapper}>
        <RecentActivityCard
          activity={quiz}
          onPress={() => navigation.navigate('QuizResults', { quizId: quiz.id })}
        />
      </View>
    ),
    [currentStyles, navigation],
  );

  const historyKeyExtractor = useCallback((item: QuizHistory) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View style={currentStyles.historySectionHeader}>
        <Text style={[common.sectionTitle, { textAlign: 'left' }]}>
          {t('quiz_screen.quiz_history')}
        </Text>
      </View>
    ),
    [currentStyles, common, t, isRTL],
  );

  const ListEmptyComponent = useMemo(() => {
    if (historyLoading && !refreshing)
      return (
        <View style={currentStyles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('quiz_screen.loading_quiz_history')} </Text>
        </View>
      );
    if (historyError)
      return (
        <View style={currentStyles.errorState}>
          <Ionicons name="alert-circle-outline" size={spacing.icon.xl} color={theme.colors.error} />
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
      );
    return (
      <View style={currentStyles.emptyState}>
        <Ionicons
          name="document-text-outline"
          size={spacing.icon.xl}
          color={theme.colors.textTertiary}
        />
        <Text style={currentStyles.emptyStateTitle}> {t('quiz_screen.no_quizzes_yet')} </Text>
        <Text style={currentStyles.emptyStateSubtitle}>{t('quiz_screen.take_first_quiz')}</Text>
      </View>
    );
  }, [
    historyLoading,
    historyError,
    refreshing,
    currentStyles,
    theme,
    spacing,
    t,
    fetchQuizHistory,
  ]);

  return (
    <View style={[common.container, { alignItems: 'stretch' }]}>
      <UnifiedHeader title={t('quiz_screen.header_title')} />

      <View style={currentStyles.actionSection}>
        <View style={currentStyles.quizCTACard}>
          <View style={currentStyles.quizCTAContent}>
            <Text style={currentStyles.quizCTATitle}>{t('quiz_screen.take_new_quiz')}</Text>
            <Text style={currentStyles.quizCTASubtitle}>
              {t('quiz_screen.start_new_challenge')}
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('QuizFlowSubjects')}
              style={currentStyles.quizCTAButton}
            >
              <Ionicons name="play" size={14} color={theme.colors.primary} />
              <Text style={currentStyles.quizCTAButtonText}>{t('home_screen.play_now')}</Text>
            </TouchableOpacity>
          </View>
          <View style={currentStyles.quizCTAIconBg}>
            <Image
              source={require('../../assets/images/quiz-illustration.png')}
              style={[
                currentStyles.quizCTAIllustration,
                { transform: [{ scaleX: isRTL ? -1 : 1 }] },
              ]}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={quizHistory}
        renderItem={renderHistoryItem}
        keyExtractor={historyKeyExtractor}
        style={{ flex: 1 }}
        contentContainerStyle={[
          currentStyles.historyContentContainer,
          {
            paddingBottom: Math.max(common.insets.bottom, spacing.xl),
            flexGrow: 1,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmptyComponent}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
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
  fontWeight: any,
  isRTL: boolean,
) =>
  StyleSheet.create({
    actionSection: {
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.md,
    },
    quizCTACard: {
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      flexDirection: 'row', // Let RN handle the flip automatically
      overflow: 'hidden',
      position: 'relative',
      ...layout.shadow,
    },
    quizCTAContent: {
      zIndex: 1,
      flex: 1,
      alignItems: 'flex-start', // Essential for RTL button positioning
    },
    quizCTATitle: {
      ...typography('h1'),
      color: theme.colors.textOnDark,
      marginBottom: spacing.xxs,
      textAlign: 'left',
    },
    quizCTASubtitle: {
      ...typography('caption'),
      color: 'rgba(255,255,255,0.8)',
      marginBottom: spacing.md,
      textAlign: 'left',
    },
    quizCTAButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      gap: 6,
    },
    quizCTAButtonText: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
    },
    quizCTAIconBg: {
      position: 'absolute',
      right: -8,
      bottom: -8,
    },
    quizCTAIllustration: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
    },
    historySectionHeader: {
      paddingHorizontal: layout.screenPadding,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    historyItemWrapper: {
      paddingHorizontal: layout.screenPadding,
      marginBottom: spacing.sm,
    },
    historyContentContainer: {
      width: '100%',
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
      marginHorizontal: layout.screenPadding,
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
