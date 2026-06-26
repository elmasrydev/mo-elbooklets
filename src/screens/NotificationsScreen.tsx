import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../hooks/useNotifications';
import { useCommonStyles } from '../hooks/useCommonStyles';
import UnifiedHeader from '../components/UnifiedHeader';
import NotificationItem from '../components/NotificationItem';
import { AppNotification } from '../types/notification';
import { handleNotificationRoute } from '../utils/notificationRouter';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { GenericListSkeleton } from '../components/SkeletonLoader';
import { parseISO, isToday, isYesterday, subDays, isAfter } from 'date-fns';

const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const navigation = useNavigation<any>();
  const { userRole } = useAuth();
  const {
    notifications,
    loading,
    loadingMore,
    refreshing,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    markingAllRead,
    unreadCount,
  } = useNotifications();

  const handlePress = useCallback(
    (notification: AppNotification) => {
      if (!notification.is_read) {
        markAsRead(notification.id);
      }
      handleNotificationRoute(
        navigation,
        notification.event_slug,
        notification.action_url,
        userRole,
      );
    },
    [markAsRead, navigation, userRole],
  );

  // Group notifications by time
  const groupedNotifications = useMemo(() => {
    if (notifications.length === 0) return [];

    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const thisWeek: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    const now = new Date();
    const lastWeekDate = subDays(now, 7);

    notifications.forEach((item) => {
      const date = parseISO(item.created_at);
      if (isToday(date)) {
        today.push(item);
      } else if (isYesterday(date)) {
        yesterday.push(item);
      } else if (isAfter(date, lastWeekDate)) {
        thisWeek.push(item);
      } else {
        earlier.push(item);
      }
    });

    const sections = [];
    if (today.length > 0) sections.push({ title: t('notifications_center.today'), data: today });
    if (yesterday.length > 0)
      sections.push({ title: t('notifications_center.yesterday'), data: yesterday });
    if (thisWeek.length > 0)
      sections.push({ title: t('notifications_center.this_week'), data: thisWeek });
    if (earlier.length > 0)
      sections.push({ title: t('notifications_center.earlier'), data: earlier });

    return sections;
  }, [notifications, t]);

  const renderSection = ({
    item: section,
  }: {
    item: { title: string; data: AppNotification[] };
  }) => (
    <View style={styles.section}>
      <Text
        style={[
          typography('label'),
          fontWeight('800'),
          styles.glabel,
          {
            color: theme.colors.textTertiary,
            textAlign: common.textAlign,
            // letterSpacing/uppercase break Arabic's cursive joins.
            ...(common.isRTL ? { letterSpacing: 0, textTransform: 'none' as const } : null),
          },
        ]}
      >
        {section.title}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        {section.data.map((n, i) => (
          <View key={n.id}>
            {i > 0 && <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />}
            <NotificationItem notification={n} onPress={handlePress} />
          </View>
        ))}
      </View>
    </View>
  );

  const ListEmptyComponent = useMemo(() => {
    if (loading && !refreshing) {
      return (
        <View style={styles.skeletonContainer}>
          <GenericListSkeleton numItems={6} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: `${theme.colors.primary}10` }]}>
          <Ionicons name="notifications-off-outline" size={48} color={theme.colors.primary} />
        </View>
        <Text
          style={[typography('h3'), fontWeight('700'), { color: theme.colors.text, marginTop: 24 }]}
        >
          {t('notifications_center.empty_title')}
        </Text>
        <Text
          style={[
            typography('body'),
            {
              color: theme.colors.textSecondary,
              marginTop: 8,
              textAlign: 'center',
              paddingHorizontal: 40,
            },
          ]}
        >
          {t('notifications_center.empty_subtitle')}
        </Text>
      </View>
    );
  }, [loading, refreshing, theme, typography, fontWeight, t]);

  if (loading && notifications.length === 0) {
    return (
      <View style={common.container}>
        <UnifiedHeader title={t('notifications_center.title')} showBackButton />
        <View style={styles.skeletonContainer}>
          <GenericListSkeleton numItems={6} />
        </View>
      </View>
    );
  }

  return (
    <View style={common.container}>
      <UnifiedHeader title={t('notifications_center.title')} showBackButton />

      {notifications.length > 0 && (
        <View
          style={[
            styles.ubar,
            { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border },
          ]}
        >
          <Text style={[typography('caption'), { color: theme.colors.textSecondary }]}>
            {unreadCount > 0
              ? `${unreadCount} ${t('notifications_center.unread_count')}`
              : t('notifications_center.empty_title')}
          </Text>
          <TouchableOpacity
            onPress={markAllAsRead}
            style={[
              styles.markPill,
              {
                backgroundColor: `${theme.colors.primary}15`,
                opacity: unreadCount === 0 ? 0.45 : 1,
              },
            ]}
            activeOpacity={0.7}
            disabled={markingAllRead || unreadCount === 0}
          >
            {markingAllRead ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="checkmark-done" size={16} color={theme.colors.primary} />
            )}
            <Text
              style={[
                typography('caption'),
                fontWeight('bold'),
                { color: theme.colors.primary, marginStart: 4 },
              ]}
            >
              {t('notifications_center.mark_all_read')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={groupedNotifications}
        renderItem={renderSection}
        keyExtractor={(item) => item.title}
        contentContainerStyle={[
          styles.listContent,
          groupedNotifications.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={ListEmptyComponent}
        onRefresh={refresh}
        refreshing={refreshing}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  ubar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  markPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 999,
  },
  section: {
    marginTop: 6,
  },
  glabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 6,
    paddingTop: 14,
    paddingBottom: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#004A9A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  separator: {
    height: 1,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonContainer: {
    padding: 16,
  },
});

export default NotificationsScreen;
