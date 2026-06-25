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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useFollowToggle } from '../hooks/useFollowToggle';
import { useTheme } from '../context/ThemeContext';
import { useModal } from '../context/ModalContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';
import { useAuth } from '../context/AuthContext';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import { QuizCompletionCard, ConnectionCard, RankChangeCard } from '../components/feed';
import PeopleYouMayKnow from '../components/feed/PeopleYouMayKnow';
import UserListRow from '../components/UserListRow';
import { CardListSkeleton, GenericListSkeleton } from '../components/SkeletonLoader';
import RetryView from '../components/RetryView';
import ProfileCompletionPrompt from '../components/ProfileCompletionPrompt';
import { isRTL } from '../lib/rtl';
import { subscribeFollowChange } from '../utils/followBus';

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
  selectedAvatar?: { url?: string } | null;
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
    selectedAvatar?: { url?: string } | null;
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
    selectedAvatar?: { url?: string } | null;
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
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [followingId, setFollowingId] = useState<string | null>(null);
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
            user { id name grade { id name } selectedAvatar { url } }
            createdAt
            quizData {
              quizUserId
              quiz { id name subject { id name } type }
              score
              totalQuestions
              isPassed
            }
            connectedUser { id name grade { id name } selectedAvatar { url } }
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

  // Reflect follow/unfollow done from the profile screen back into the list.
  useEffect(
    () =>
      subscribeFollowChange((userId, isFollowing) => {
        setSearchResults((prev) => prev.map((s) => (s.id === userId ? { ...s, isFollowing } : s)));
      }),
    [],
  );

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
            selectedAvatar { url }
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
    if (followingId) return;
    setFollowingId(student.id);
    try {
      const result = await toggleFollow(student.id);
      if (result?.success) {
        setSearchResults((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, isFollowing: result.isFollowing } : s)),
        );
        if (searchQuery.length === 0) fetchTimeline();
      }
    } finally {
      setFollowingId(null);
    }
  };

  const handleLike = async (feedItem: NewsFeedItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      // Optimistic update
      setFeedItems((prev) =>
        prev.map((item) =>
          item.id === feedItem.id
            ? {
                ...item,
                isLiked: !item.isLiked,
                likes: item.isLiked ? item.likes - 1 : item.likes + 1,
              }
            : item,
        ),
      );

      // Use quizUserId for quiz_completion posts if available (legacy), newsFeedId for all others
      const isLegacyQuiz = feedItem.type === 'quiz_completion' && feedItem.quizData?.quizUserId;
      const variables = isLegacyQuiz
        ? { quizUserId: feedItem.quizData!.quizUserId }
        : { newsFeedId: feedItem.id };

      const result = await tryFetchWithFallback(
        `mutation LikeActivity($quizUserId: ID, $newsFeedId: ID) {
          likeActivity(quizUserId: $quizUserId, newsFeedId: $newsFeedId) {
            success isLiked likeCount message
          }
        }`,
        variables,
        token,
      );

      if (result.data?.likeActivity?.success) {
        // Confirm with server values
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
      } else {
        // Rollback optimistic update on failure
        setFeedItems((prev) =>
          prev.map((item) =>
            item.id === feedItem.id
              ? { ...item, isLiked: feedItem.isLiked, likes: feedItem.likes }
              : item,
          ),
        );
      }
    } catch (err: any) {
      console.error('Like error:', err);
      // Rollback on error
      setFeedItems((prev) =>
        prev.map((item) =>
          item.id === feedItem.id
            ? { ...item, isLiked: feedItem.isLiked, likes: feedItem.likes }
            : item,
        ),
      );
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
        return <ConnectionCard item={item as any} onLike={() => handleLike(item)} />;
      if (item.type === 'rank_change' && item.rankData)
        return <RankChangeCard item={item as any} onLike={() => handleLike(item)} />;
      return null;
    },
    [t, handleLike, showConfirm],
  );

  const renderSearchItem = useCallback(
    ({ item: student }: { item: Student }) => (
      <UserListRow
        student={student}
        containerStyle={{ marginBottom: spacing.sectionGap }}
        followLoading={followingId === student.id}
        onPress={() =>
          navigation.navigate('StudentProfile', {
            userId: student.id,
            name: student.name,
            avatarUrl: student.selectedAvatar?.url,
            gradeName: student.grade?.name,
            isFollowing: student.isFollowing,
          })
        }
        onFollowToggle={() => handleFollowToggle(student)}
      />
    ),
    [spacing, handleFollowToggle, navigation, followingId],
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

    if (!isSearchMode) {
      const isProfileComplete = !!(user?.school_name && user?.governorate_id && user?.city_id);
      return (
        <View>
          {isProfileComplete && (
            <PeopleYouMayKnow
              onFollowSuccess={() => {
                // Optionally refresh timeline if needed
              }}
            />
          )}
          {feedItems.length > 0 && (
            <Text style={currentStyles.sectionTitle}>{t('social_screen.recent_activity')}</Text>
          )}
        </View>
      );
    }
    return null;
  }, [isSearchMode, searchResults.length, feedItems.length, currentStyles, t, user]);

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
            textAlign={isRTL() ? 'right' : 'left'}
            returnKeyType="search"
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
      // Vertically center the text against the search icon + clear button.
      paddingVertical: 0,
      textAlignVertical: 'center',
      includeFontPadding: false,
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
      textAlign: common.textAlign,
      // Arabic is cursive: uppercase is a no-op and letterSpacing breaks the
      // letter joins, so only apply them in LTR.
      textTransform: isRTL() ? 'none' : 'uppercase',
      letterSpacing: isRTL() ? 0 : 1,
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
