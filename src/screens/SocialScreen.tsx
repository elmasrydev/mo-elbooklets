import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { useFollowToggle } from '../hooks/useFollowToggle';
import { useTheme } from '../context/ThemeContext';
import { useModal } from '../context/ModalContext';
import { useTranslation } from 'react-i18next';
import { logError } from '../utils/logger';
import { loadFailureMessage } from '../utils/queryError';
import { resolveFeedCard } from '../utils/socialFeed';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';
import { useAuth } from '../context/AuthContext';
import { layout } from '../config/layout';
import {
  LikeActivityDocument,
  LikeActivityMutation,
  SearchStudentsDocument,
  SearchStudentsQuery,
  SocialTimelineDocument,
  SocialTimelineQuery,
} from '../generated/graphql';
import { QuizCompletionCard, ConnectionCard, RankChangeCard } from '../components/feed';
import PeopleYouMayKnow from '../components/feed/PeopleYouMayKnow';
import UserListRow from '../components/UserListRow';
import SearchBar from '../components/SearchBar';
import { CardListSkeleton, GenericListSkeleton } from '../components/SkeletonLoader';
import RetryView from '../components/RetryView';
import ProfileCompletionPrompt from '../components/ProfileCompletionPrompt';
import { isRTL } from '../lib/rtl';

/**
 * An item the feed cannot render is dropped from the list, which looks exactly
 * like the backend sending nothing — the ambiguity that made BKLT-317 hard to
 * place. Say so once per unrecognised shape (per session, so a long feed does
 * not repeat it on every re-render).
 */
const reportedFeedShapes = new Set<string>();
const reportUnrenderableItem = (item: { id: string; type: string }) => {
  if (!__DEV__ || reportedFeedShapes.has(item.type)) return;
  reportedFeedShapes.add(item.type);
  console.warn(
    `[SocialScreen] Dropping feed item ${item.id}: no card renders type "${item.type}" ` +
      '(or its payload is missing). The feed will look emptier than the server response.',
  );
};

// Shaped by what the queries select — follow state inside the results is kept
// fresh by the Apollo cache (see useFollowToggle), not by manual list patches.
type Student = SearchStudentsQuery['searchStudents'][number];
type NewsFeedItem = SocialTimelineQuery['socialTimeline'][number];

const SocialScreen: React.FC = () => {
  const { theme, spacing } = useTheme();
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');
  const [followingId, setFollowingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: timelineData,
    loading: timelineLoading,
    error: timelineErrorObj,
    refetch: refetchTimeline,
  } = useQuery(SocialTimelineDocument, { notifyOnNetworkStatusChange: true });
  const feedItems = timelineData?.socialTimeline ?? [];
  const timelineError = loadFailureMessage(
    timelineData?.socialTimeline,
    timelineErrorObj,
    t('social_screen.error_loading_timeline'),
  );

  // useQuery already fetched on mount, so the first focus within the stale
  // window must not refetch.
  const lastFetchRef = React.useRef<number>(Date.now());
  const STALE_MS = 30_000;

  useFocusEffect(
    useCallback(() => {
      if (searchQuery.length > 0) return;
      const now = Date.now();
      if (now - lastFetchRef.current < STALE_MS && feedItems.length > 0) return;
      lastFetchRef.current = now;
      refetchTimeline();
    }, [searchQuery, refetchTimeline, feedItems.length]),
  );

  const [runSearch, { data: searchData, loading: searchLoading }] =
    useLazyQuery(SearchStudentsDocument);
  const searchResults = searchQuery.length >= 2 ? (searchData?.searchStudents ?? []) : [];

  useEffect(() => {
    if (searchQuery.length < 2) return;
    const timeoutId = setTimeout(() => runSearch({ variables: { query: searchQuery } }), 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, runSearch]);

  const { toggleFollow } = useFollowToggle();

  const handleFollowToggle = useCallback(
    async (student: Student) => {
      if (followingId) return;
      setFollowingId(student.id);
      try {
        // The cache write in useFollowToggle flips isFollowing in the search
        // results; the timeline is refetched for a possible new connection card.
        const result = await toggleFollow(student.id);
        if (result?.success && searchQuery.length === 0) refetchTimeline();
      } finally {
        setFollowingId(null);
      }
      // followingId is read as a re-entrancy guard only; including it would rebuild
      // the handler on every toggle and re-render the whole list again.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [toggleFollow, searchQuery.length, refetchTimeline],
  );

  const [likeActivity] = useMutation(LikeActivityDocument);

  const handleLike = useCallback(
    async (feedItem: NewsFeedItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Use quizUserId for quiz_completion posts if available (legacy), newsFeedId for all others
      const isLegacyQuiz = feedItem.type === 'quiz_completion' && feedItem.quizData?.quizUserId;
      const variables = isLegacyQuiz
        ? { quizUserId: feedItem.quizData?.quizUserId }
        : { newsFeedId: feedItem.id };

      try {
        await likeActivity({
          variables,
          // The cast adds __typename, which the runtime cache write expects but
          // the generated operation type does not carry.
          optimisticResponse: {
            likeActivity: {
              __typename: 'LikeResult',
              success: true,
              isLiked: !feedItem.isLiked,
              likeCount: feedItem.isLiked ? feedItem.likes - 1 : feedItem.likes + 1,
              message: '',
            },
          } as LikeActivityMutation,
          // Runs for the optimistic layer and again with the server result; a
          // success:false response writes nothing, so removing the optimistic
          // layer rolls the flip back — no manual revert bookkeeping.
          update: (cache, { data }) => {
            const result = data?.likeActivity;
            if (!result?.success) return;
            cache.modify({
              id: cache.identify({ __typename: 'NewsFeedItem', id: feedItem.id }),
              fields: { isLiked: () => result.isLiked, likes: () => result.likeCount },
            });
          },
        });
      } catch (err) {
        // Optimistic layer is already rolled back by Apollo.
        logError('Like activity failed', err);
      }
    },
    [likeActivity],
  );

  const currentStyles = useMemo(
    () => styles(theme, common, spacing, typography, fontWeight),
    [theme, common, spacing, typography, fontWeight],
  );

  // A fresh object literal here changed the row's props on every render.
  const searchRowSpacing = useMemo(
    () => ({ marginBottom: spacing.sectionGap }),
    [spacing.sectionGap],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lastFetchRef.current = Date.now();
    await refetchTimeline();
    setRefreshing(false);
  }, [refetchTimeline]);

  const renderFeedItem = useCallback(
    ({ item }: { item: NewsFeedItem }) => {
      const kind = resolveFeedCard(item);
      if (!kind) {
        reportUnrenderableItem(item);
        return null;
      }
      // Exhaustive on purpose: adding a card kind without handling it here is
      // a type error rather than a card silently rendering as the wrong one.
      switch (kind) {
        case 'quiz_completion':
          return <QuizCompletionCard item={item as any} onLike={() => handleLike(item)} />;
        case 'new_connection':
          return <ConnectionCard item={item as any} onLike={() => handleLike(item)} />;
        case 'rank_change':
          return <RankChangeCard item={item as any} onLike={() => handleLike(item)} />;
      }
    },
    [handleLike],
  );

  const renderSearchItem = useCallback(
    ({ item: student }: { item: Student }) => (
      <UserListRow
        student={student}
        containerStyle={searchRowSpacing}
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
        <RetryView
          message={t('social_screen.error_loading_timeline')}
          onRetry={() => refetchTimeline()}
        />
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
    refetchTimeline,
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
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('social_screen.search_placeholder')}
          iconColor={theme.colors.primary}
          style={currentStyles.searchBox}
          inputStyle={currentStyles.searchInputText}
          dismissKeyboardOnClear
          // Clearing the query is enough — searchResults derives from it.
          onClear={() => setSearchQuery('')}
          testID="community-search-input"
        />
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
    // Visual overrides for the shared <SearchBar>; the RTL-correct row/input
    // structure lives in the component. Community look: rounded, tinted, shadow.
    searchBox: {
      backgroundColor: theme.mode === 'light' ? theme.colors.surface : theme.colors.card,
      borderRadius: 16,
      // Size to content with vertical padding instead of a fixed height, so the
      // text stays centered with the icons on iOS. ~52px tall.
      paddingVertical: 15,
      ...layout.shadow,
    },
    searchInputText: {
      ...fontWeight('500'),
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
