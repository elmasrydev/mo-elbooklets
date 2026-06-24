import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import UnifiedHeader from '../../components/UnifiedHeader';
import RetryView from '../../components/RetryView';
import { GenericListSkeleton } from '../../components/SkeletonLoader';
import { fetchConversations } from '../../services/bokiApi';
import { analytics } from '../../lib/analytics';
import { spacing, borderRadius } from '../../config/spacing';
import { layout } from '../../config/layout';
import { Conversation } from '../../types/boki';

const PER_PAGE = 15;

/**
 * Boki conversation history (BKLT-221, Phase 2).
 *
 * Paginated, newest-first list of the student's past conversations. Tapping one
 * pushes the chat thread for that conversation; pull-to-refresh and infinite
 * scroll mirror the project's notifications pattern.
 */
const BokiConversationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { typography } = useTypography();
  const common = useCommonStyles();
  const navigation = useNavigation<any>();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const load = useCallback(async (page: number, mode: 'initial' | 'refresh' | 'more') => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (mode === 'initial') setLoading(true);
    else if (mode === 'refresh') setRefreshing(true);
    else setLoadingMore(true);

    try {
      const result = await fetchConversations(page, PER_PAGE);
      setConversations((prev) => (page === 1 ? result.data : [...prev, ...result.data]));
      setHasMore(result.hasMore);
      setError(false);
      pageRef.current = page;
    } catch {
      if (page === 1) setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void load(1, 'initial');
  }, [load]);

  const handleRefresh = useCallback(() => load(1, 'refresh'), [load]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading && !refreshing) {
      void load(pageRef.current + 1, 'more');
    }
  }, [hasMore, loadingMore, loading, refreshing, load]);

  const handleOpen = useCallback(
    (conversation: Conversation) => {
      analytics.trackBokiConversationOpened({ conversation_id: conversation.id });
      // Navigate back to the single chat screen and load the selected
      // conversation there (rather than stacking a new chat instance).
      navigation.navigate('BokiChat', { conversationId: conversation.id });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Conversation>) => {
      const title = item.title || item.latestMessage?.message || t('boki.title');
      const preview = item.latestMessage?.message;
      return (
        <TouchableOpacity
          testID={`boki-conversation-${item.id}`}
          activeOpacity={0.7}
          onPress={() => handleOpen(item)}
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons
              name="chatbubbles-outline"
              size={spacing.icon.md}
              color={theme.colors.primary}
            />
            <Text
              numberOfLines={1}
              style={[typography('body', '600'), styles.cardTitle, { color: theme.colors.text }]}
            >
              {title}
            </Text>
          </View>
          {preview ? (
            <Text
              numberOfLines={1}
              style={[typography('caption'), styles.preview, { color: theme.colors.textSecondary }]}
            >
              {preview}
            </Text>
          ) : null}
          <Text style={[typography('label'), styles.count, { color: theme.colors.textTertiary }]}>
            {t('boki.message_count', { count: item.messagesCount })}
          </Text>
        </TouchableOpacity>
      );
    },
    [handleOpen, t, theme, typography],
  );

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  if (error && conversations.length === 0) {
    return (
      <View style={[common.container, { backgroundColor: theme.colors.background }]}>
        <UnifiedHeader title={t('boki.history_title')} showBackButton />
        <RetryView onRetry={handleRefresh} message={t('boki.history_error')} />
      </View>
    );
  }

  return (
    <View style={[common.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader title={t('boki.history_title')} showBackButton />
      <FlatList
        testID="boki-conversation-list"
        data={conversations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.listContent, conversations.length === 0 && styles.flexFill]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        ListEmptyComponent={
          loading ? (
            <GenericListSkeleton numItems={6} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={[typography('h3'), styles.emptyTitle, { color: theme.colors.text }]}>
                {t('boki.history_empty_title')}
              </Text>
              <Text
                style={[
                  typography('bodySmall'),
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t('boki.history_empty_subtitle')}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footer} color={theme.colors.primary} />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: layout.screenPadding,
  },
  flexFill: {
    flexGrow: 1,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: layout.cardPadding,
    marginBottom: spacing.ssm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    marginStart: spacing.sm,
    textAlign: 'left',
  },
  preview: {
    marginTop: spacing.xs,
    textAlign: 'left',
  },
  count: {
    marginTop: spacing.sm,
    textAlign: 'left',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  footer: {
    marginVertical: spacing.md,
  },
});

export default BokiConversationsScreen;
