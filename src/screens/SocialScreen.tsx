import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { useFollowToggle } from '../hooks/useFollowToggle';
import { useTheme } from '../context/ThemeContext';
import { useModal } from '../context/ModalContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import { QuizCompletionCard, ConnectionCard, RankChangeCard } from '../components/feed';
import AppButton from '../components/AppButton';
import { CardListSkeleton, GenericListSkeleton } from '../components/SkeletonLoader';
import RetryView from '../components/RetryView';
import ProfileCompletionPrompt from '../components/ProfileCompletionPrompt';

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
  const { theme, spacing } = useTheme();
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [feedItems, setFeedItems] = useState<NewsFeedItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTimeline = useCallback(async () => {
    try {
      setTimelineLoading(true);
      setTimelineError(null);
      const token = await SecureStore.getItemAsync('auth_token');
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
      const token = await SecureStore.getItemAsync('auth_token');
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

  const { toggleFollow } = useFollowToggle();

  const handleFollowToggle = async (student: Student) => {
    const result = await toggleFollow(student.id);
    if (result?.success) {
      setSearchResults((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, isFollowing: result.isFollowing } : s)),
      );
      if (searchQuery.length === 0) fetchTimeline();
    }
  };

  const handleLike = async (feedItem: NewsFeedItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const token = await SecureStore.getItemAsync('auth_token');
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
    () => styles(theme, common, spacing, typography, fontWeight),
    [theme, common, spacing, typography, fontWeight],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lastFetchRef.current = 0;
    await fetchTimeline();
    setRefreshing(false);
  }, [fetchTimeline]);

  const renderFeedItem = useCallback(
    ({ item }: { item: NewsFeedItem }) => {
      if (item.type === 'quiz_completion' && item.quizData)
        return <QuizCompletionCard item={item as any} onLike={() => handleLike(item)} />;
      if (item.type === 'new_connection' && item.connectedUser)
        return <ConnectionCard item={item as any} onLike={() => {}} />;
      if (item.type === 'rank_change' && item.rankData)
        return <RankChangeCard item={item as any} onLike={() => {}} />;
      return null;
    },
    [t, handleLike, showConfirm],
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
              <Text style={currentStyles.studentName}>{student.name}</Text>
              <Text style={currentStyles.studentGrade}>{student.grade.name}</Text>
              <View style={currentStyles.studentStats}>
                <View
                  style={[
                    currentStyles.statBadge,
                    { backgroundColor: `${theme.colors.primary}10` },
                  ]}
                >
                  <Ionicons name="book-outline" size={12} color={theme.colors.primary} />
                  <Text style={currentStyles.studentStat}>
                    {student.totalQuizzes} {t('common.quizzes')}
                  </Text>
                </View>
                <View
                  style={[
                    currentStyles.statBadge,
                    { backgroundColor: `${theme.colors.success}10` },
                  ]}
                >
                  <Ionicons name="star-outline" size={12} color={theme.colors.success} />
                  <Text style={[currentStyles.studentStat, { color: theme.colors.success }]}>
                    {student.avgScore}% {t('common.avg')}
                  </Text>
                </View>
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
            accessibilityLabel={`${student.isFollowing ? t('common.following') : t('common.follow')} ${student.name}`}
          />
        </View>
      </View>
    ),
    [common, spacing, currentStyles, t, handleFollowToggle, theme],
  );

  const isSearchMode = searchQuery.length >= 2;

  const ListEmptyComponent = useMemo(() => {
    if (isSearchMode) {
      if (searchLoading)
        return (
          <View style={{ paddingTop: 16 }}>
            <GenericListSkeleton numItems={4} />
          </View>
        );
      return (
        <View style={currentStyles.emptyState}>
          <View style={currentStyles.emptyIconBg}>
            <Ionicons name="search-outline" size={40} color={theme.colors.primary} />
          </View>
          <Text style={currentStyles.emptyStateTitle}>{t('social_screen.no_results')}</Text>
          <Text style={currentStyles.emptyStateSubtitle}>
            {t('social_screen.try_different_search')}
          </Text>
        </View>
      );
    }

    if (timelineLoading && !refreshing)
      return (
        <View style={{ paddingTop: 16 }}>
          <CardListSkeleton numItems={3} />
        </View>
      );

    if (timelineError)
      return (
        <RetryView message={t('social_screen.error_loading_timeline')} onRetry={fetchTimeline} />
      );

    return (
      <View style={currentStyles.emptyState}>
        <View style={currentStyles.emptyIconBg}>
          <Ionicons name="people-outline" size={40} color={theme.colors.primary} />
        </View>
        <Text style={currentStyles.emptyStateTitle}>{t('social_screen.no_activity_yet')}</Text>
        <Text style={currentStyles.emptyStateSubtitle}>
          {t('social_screen.follow_students_hint')}
        </Text>
      </View>
    );
  }, [
    isSearchMode,
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
    if (isSearchMode && searchResults.length > 0) {
      return (
        <Text style={currentStyles.sectionTitle}>
          {t('social_screen.search_results', 'Search Results')}
        </Text>
      );
    }
    return null;
  }, [isSearchMode, searchResults.length, feedItems.length, currentStyles, t]);

  return (
    <View style={common.container}>
      <UnifiedHeader
        title={t('social_screen.header_title')}
        subtitle={t('social_screen.header_subtitle')}
      />

      <View style={currentStyles.searchWrapper}>
        <View style={currentStyles.searchInputBox}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.primary}
            style={currentStyles.searchIcon}
          />
          <TextInput
            style={currentStyles.searchInput}
            placeholder={t('social_screen.search_placeholder')}
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={common.textAlign}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                Keyboard.dismiss();
              }}
              style={currentStyles.clearBtn}
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
          keyExtractor={(item) => item.id}
          style={currentStyles.content}
          contentContainerStyle={currentStyles.contentContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={FeedHeader}
          ListEmptyComponent={ListEmptyComponent}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <FlatList
          data={feedItems}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id}
          style={currentStyles.content}
          contentContainerStyle={currentStyles.contentContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={FeedHeader}
          ListEmptyComponent={ListEmptyComponent}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}
      <ProfileCompletionPrompt context="community" />
    </View>
  );
};

const styles = (theme: any, common: any, spacing: any, typography: any, fontWeight: any) =>
  StyleSheet.create({
    searchWrapper: {
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.md,
      backgroundColor: theme.colors.background,
    },
    searchInputBox: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.mode === 'light' ? theme.colors.surface : theme.colors.card,
      borderRadius: 16,
      paddingHorizontal: 12,
      height: 52,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    searchIcon: {
      marginHorizontal: 4,
    },
    searchInput: {
      flex: 1,
      ...typography('body'),
      color: theme.colors.text,
      ...fontWeight('500'),
      height: '100%',
    },
    clearBtn: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: layout.screenPadding,
      paddingTop: spacing.xs,
      paddingBottom: 40,
    },
    sectionTitle: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    studentCardContent: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    studentInfo: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      flex: 1,
    },
    avatarPlaceholder: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
    },
    avatarText: {
      color: theme.colors.primary,
      ...fontWeight('bold'),
      ...typography('h3'),
    },
    studentDetails: {
      flex: 1,
      ...common.marginStart(12),
      alignItems: common.alignStart,
    },
    studentName: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    studentGrade: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    studentStats: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    statBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    studentStat: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
    },
    followButton: {
      paddingHorizontal: 16,
      minWidth: 100,
    },
    loadingState: {
      paddingVertical: 60,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      ...typography('bodySmall'),
      color: theme.colors.textSecondary,
    },
    emptyState: {
      paddingVertical: 60,
      alignItems: 'center',
    },
    emptyIconBg: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${theme.colors.primary}10`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyStateTitle: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      ...typography('bodySmall'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
  });

export default SocialScreen;
