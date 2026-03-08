import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import { QuizCompletionCard, ConnectionCard, RankChangeCard } from '../components/feed';
import AppButton from '../components/AppButton';

interface Student {
  id: string;
  name: string;
  mobile: string;
  grade: {
    id: string;
    name: string;
  };
  totalQuizzes: number;
  avgScore: number;
  isFollowing: boolean;
}

interface NewsFeedItem {
  id: string;
  type: 'quiz_completion' | 'new_connection' | 'rank_change';
  user: {
    id: string;
    name: string;
    grade: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  quizData?: {
    quizUserId: string;
    quiz: { id: string; name: string; subject: { id: string; name: string }; type: string };
    score: number;
    totalQuestions: number;
    isPassed: boolean;
  };
  connectedUser?: {
    id: string;
    name: string;
    grade: { id: string; name: string };
  };
  rankData?: {
    previousRank?: number;
    newRank: number;
    subject?: { id: string; name: string };
    isOverall: boolean;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
}

const SocialScreen: React.FC = () => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [feedItems, setFeedItems] = useState<NewsFeedItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    try {
      setTimelineLoading(true);
      setTimelineError(null);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setTimelineError(t('common.error'));
        return;
      }

      const result = await tryFetchWithFallback(
        `
        query SocialTimeline {
          socialTimeline {
            id
            type
            user { id name grade { id name } }
            createdAt
            quizData {
              quizUserId
              quiz { id name subject { id name } type }
              score
              totalQuestions
              isPassed
            }
            connectedUser { id name grade { id name } }
            rankData { previousRank newRank subject { id name } isOverall }
            likes
            comments
            isLiked
          }
        }
      `,
        undefined,
        token,
      );
      if (result.data?.socialTimeline) {
        setFeedItems(result.data.socialTimeline);
      } else {
        setTimelineError(result.errors?.[0]?.message || t('social_screen.error_loading_timeline'));
      }
    } catch (err: any) {
      console.error('Fetch timeline error:', err);
      setTimelineError(err.message || t('social_screen.error_loading_timeline'));
    } finally {
      setTimelineLoading(false);
    }
  }, [t]);

  const lastFetchRef = React.useRef<number>(0);
  const STALE_MS = 30_000;

  useFocusEffect(
    useCallback(() => {
      if (searchQuery.length > 0) return;
      const now = Date.now();
      if (now - lastFetchRef.current < STALE_MS && feedItems.length > 0) return;
      lastFetchRef.current = now;
      fetchTimeline();
    }, [searchQuery, fetchTimeline, feedItems.length]),
  );

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeoutId = setTimeout(() => performSearch(searchQuery), 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      setSearchLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `
        query SearchStudents($query: String!) {
          searchStudents(query: $query) {
            id name mobile grade { id name } totalQuizzes avgScore isFollowing
          }
        }
      `,
        { query },
        token,
      );

      if (result.data?.searchStudents) setSearchResults(result.data.searchStudents);
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollowToggle = async (student: Student) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `
        mutation FollowUser($userId: ID!) {
          followUser(userId: $userId) { success isFollowing message }
        }
      `,
        { userId: student.id },
        token,
      );

      if (result.data?.followUser?.success) {
        setSearchResults((prev) =>
          prev.map((s) =>
            s.id === student.id ? { ...s, isFollowing: result.data.followUser.isFollowing } : s,
          ),
        );
        if (searchQuery.length === 0) fetchTimeline();
      }
    } catch (err: any) {
      console.error('Follow toggle error:', err);
    }
  };

  const handleLike = async (feedItem: NewsFeedItem) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token || feedItem.type !== 'quiz_completion' || !feedItem.quizData) return;

      const result = await tryFetchWithFallback(
        `
        mutation LikeActivity($quizUserId: ID!) {
          likeActivity(quizUserId: $quizUserId) { success isLiked likeCount message }
        }
      `,
        { quizUserId: feedItem.quizData.quizUserId },
        token,
      );

      if (result.data?.likeActivity?.success) {
        setFeedItems((prev) =>
          prev.map((item) =>
            item.id === feedItem.id
              ? {
                  ...item,
                  isLiked: result.data.likeActivity.isLiked,
                  likes: result.data.likeActivity.likeCount,
                }
              : item,
          ),
        );
      }
    } catch (err: any) {
      console.error('Like error:', err);
    }
  };

  const currentStyles = useMemo(
    () => styles(theme, common, fontSizes, spacing, borderRadius, typography, fontWeight),
    [theme, common, fontSizes, spacing, borderRadius, typography, fontWeight],
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lastFetchRef.current = 0;
    await fetchTimeline();
    setRefreshing(false);
  }, [fetchTimeline]);

  const renderFeedItem = useCallback(
    ({ item }: { item: NewsFeedItem }) => {
      if (item.type === 'quiz_completion' && item.quizData)
        return (
          <QuizCompletionCard
            item={item as any}
            onLike={() => handleLike(item)}
            onComment={() => Alert.alert('Comment', t('social_screen.comment_coming_soon'))}
          />
        );
      if (item.type === 'new_connection' && item.connectedUser)
        return <ConnectionCard item={item as any} />;
      if (item.type === 'rank_change' && item.rankData)
        return <RankChangeCard item={item as any} />;
      return null;
    },
    [t, handleLike, currentStyles],
  );

  const renderSearchItem = useCallback(
    ({ item: student }: { item: Student }) => (
      <View style={[common.card, { marginBottom: spacing.sectionGap }]}>
        <View style={currentStyles.studentCardContent}>
          <View style={currentStyles.studentInfo}>
            <View style={currentStyles.avatarPlaceholder}>
              <Text style={currentStyles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={currentStyles.studentDetails}>
              <Text style={currentStyles.studentName}> {student.name} </Text>
              <Text style={currentStyles.studentGrade}> {student.grade.name} </Text>
              <View style={currentStyles.studentStats}>
                <Text style={currentStyles.studentStat}>
                  {student.totalQuizzes} {t('common.quizzes')}
                </Text>
                <Text style={currentStyles.studentStatSeparator}>•</Text>
                <Text style={currentStyles.studentStat}>
                  {student.avgScore} % {t('common.avg')}
                </Text>
              </View>
            </View>
          </View>
          <AppButton
            title={student.isFollowing ? t('common.following') : t('common.follow')}
            onPress={() => handleFollowToggle(student)}
            variant={student.isFollowing ? 'outline' : 'primary'}
            size="sm"
            fullWidth={false}
            style={currentStyles.followButton}
          />
        </View>
      </View>
    ),
    [common, spacing, currentStyles, t, handleFollowToggle],
  );

  const feedKeyExtractor = useCallback((item: NewsFeedItem) => item.id, []);
  const searchKeyExtractor = useCallback((item: Student) => item.id, []);

  const ListEmptyComponent = useMemo(() => {
    if (searchQuery.length >= 2) {
      if (searchLoading)
        return (
          <View style={currentStyles.loadingState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={currentStyles.loadingText}> {t('social_screen.searching')} </Text>
          </View>
        );
      return (
        <View style={currentStyles.emptyState}>
          <Ionicons name="search-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={currentStyles.emptyStateTitle}> {t('social_screen.no_results')} </Text>
          <Text style={currentStyles.emptyStateSubtitle}>
            {t('social_screen.try_different_search')}
          </Text>
        </View>
      );
    }

    if (timelineLoading && !refreshing)
      return (
        <View style={currentStyles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('social_screen.loading_activities')} </Text>
        </View>
      );

    if (timelineError)
      return (
        <View style={currentStyles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={currentStyles.emptyStateTitle}>
            {t('social_screen.error_loading_timeline')}
          </Text>
          <AppButton
            title={t('home_screen.try_again')}
            onPress={fetchTimeline}
            size="sm"
            fullWidth={false}
          />
        </View>
      );

    return (
      <View style={currentStyles.emptyState}>
        <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={currentStyles.emptyStateTitle}> {t('social_screen.no_activity_yet')} </Text>
        <Text style={currentStyles.emptyStateSubtitle}>
          {t('social_screen.follow_students_hint')}
        </Text>
      </View>
    );
  }, [
    searchQuery,
    searchLoading,
    timelineLoading,
    timelineError,
    refreshing,
    currentStyles,
    theme,
    t,
    fetchTimeline,
  ]);

  const FeedHeader = useMemo(() => {
    if (searchQuery.length >= 2 && searchResults.length > 0) {
      return <Text style={common.sectionTitle}> {t('social_screen.search_results')} </Text>;
    }
    if (searchQuery.length < 2 && feedItems.length > 0) {
      return <Text style={common.sectionTitle}> {t('social_screen.recent_activity')} </Text>;
    }
    return null;
  }, [searchQuery, searchResults.length, feedItems.length, common, t]);

  const isSearchMode = searchQuery.length >= 2;

  return (
    <View style={common.container}>
      <UnifiedHeader
        showBackButton
        title={t('social_screen.header_title')}
        subtitle={t('social_screen.header_subtitle')}
      />

      <View style={currentStyles.searchContainer}>
        <View style={currentStyles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={currentStyles.searchInput}
            placeholder={t('social_screen.search_placeholder')}
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={common.textAlign}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={currentStyles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearchMode ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={searchKeyExtractor}
          style={currentStyles.content}
          contentContainerStyle={currentStyles.contentContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={FeedHeader}
          ListEmptyComponent={ListEmptyComponent}
        />
      ) : (
        <FlatList
          data={feedItems}
          renderItem={renderFeedItem}
          keyExtractor={feedKeyExtractor}
          style={currentStyles.content}
          contentContainerStyle={[currentStyles.contentContainer, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={FeedHeader}
          ListEmptyComponent={ListEmptyComponent}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}
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
) =>
  StyleSheet.create({
    searchContainer: {
      padding: layout.screenPadding,
      backgroundColor: theme.colors.background,
    },
    searchInputContainer: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      borderRadius: layout.borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    searchInput: {
      flex: 1,
      ...typography('body'),
      color: theme.colors.text,
      ...fontWeight('500'),
      ...common.marginStart(10),
    },
    clearButton: { padding: 4 },
    content: { flex: 1 },
    contentContainer: { padding: layout.screenPadding, paddingTop: 0, alignItems: 'stretch' },
    searchResultsContainer: { paddingBottom: Math.max(common.insets.bottom, 20) },
    studentCardContent: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    studentInfo: { flexDirection: common.rowDirection, alignItems: 'center', flex: 1 },
    avatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primaryLight || 'rgba(147, 51, 234, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { color: theme.colors.primary, ...fontWeight('bold'), ...typography('h3') },
    studentDetails: { flex: 1, ...common.marginStart(12), alignItems: common.alignStart },
    studentName: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    studentGrade: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: common.textAlign,
    },
    studentStats: { flexDirection: common.rowDirection, alignItems: 'center', marginTop: 4 },
    studentStat: { ...typography('caption'), color: theme.colors.primary, ...fontWeight('600') },
    studentStatSeparator: {
      ...typography('caption'),
      marginHorizontal: 6,
      color: theme.colors.textTertiary,
    },
    followButton: {
      paddingHorizontal: spacing.md,
      minWidth: 90,
    },
    timelineContainer: { paddingBottom: Math.max(common.insets.bottom, 20) },
    loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: {
      marginTop: spacing.md,
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      marginTop: 40,
    },
    emptyStateTitle: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginTop: spacing.lg,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      ...typography('bodySmall'),
      color: theme.colors.textSecondary,
      marginTop: spacing.sm,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default SocialScreen;
