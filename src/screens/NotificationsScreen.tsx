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
  const { theme, spacing } = useTheme();
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
      handleNotificationRoute(navigation, notification.event_slug, notification.action_url, userRole);
    },
    [markAsRead, navigation, userRole]
  );

  // Group notifications by time
  const groupedNotifications = useMemo(() => {
    if (notifications.length === 0) return [];

    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const thisWeek: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    const now = new Date();
    const yesterdayDate = subDays(now, 1);
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
    if (yesterday.length > 0) sections.push({ title: t('notifications_center.yesterday'), data: yesterday });
    if (thisWeek.length > 0) sections.push({ title: t('notifications_center.this_week'), data: thisWeek });
    if (earlier.length > 0) sections.push({ title: t('notifications_center.earlier'), data: earlier });

    return sections;
  }, [notifications, t]);

  const renderSectionHeader = (title: string) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text style={[typography('label'), fontWeight('700'), { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: AppNotification }) => (
    <NotificationItem notification={item} onPress={handlePress} />
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
        <Text style={[typography('h3'), fontWeight('700'), { color: theme.colors.text, marginTop: 24 }]}>
          {t('notifications_center.empty_title')}
        </Text>
        <Text style={[typography('body'), { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }]}>
          {t('notifications_center.empty_subtitle')}
        </Text>
      </View>
    );
  }, [loading, refreshing, theme, typography, fontWeight, t]);

  // Flatten for FlatList but we want headers. 
  // FlatList doesn't support section headers as well as SectionList, 
  // but let's use a trick or just use SectionList.
  // Actually, project usually uses FlatList. I'll use a flattened array with headers as items.

  const flattenedData = useMemo(() => {
    const result: any[] = [];
    groupedNotifications.forEach((section) => {
      result.push({ isHeader: true, title: section.title });
      section.data.forEach((item) => {
        result.push(item);
      });
    });
    return result;
  }, [groupedNotifications]);

  const renderFlattenedItem = ({ item }: { item: any }) => {
    if (item.isHeader) {
      return renderSectionHeader(item.title);
    }
    return renderItem({ item });
  };

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
      <UnifiedHeader
        title={t('notifications_center.title')}
        showBackButton
      />

      {notifications.length > 0 && (
        <View style={styles.actionHeader}>
          <Text style={[typography('caption'), { color: theme.colors.textSecondary }]}>
            {unreadCount} {t('notifications_center.unread_count')}
          </Text>
          <TouchableOpacity 
            onPress={markAllAsRead} 
            style={[styles.markAllPill, { backgroundColor: `${theme.colors.primary}10` }]}
            activeOpacity={0.7}
            disabled={markingAllRead}
          >
            {markingAllRead ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 4 }} />
            ) : (
              <Ionicons name="checkmark-done" size={14} color={theme.colors.primary} />
            )}
            <Text style={[typography('caption'), fontWeight('600'), { color: theme.colors.primary, marginStart: 4 }]}>
              {t('notifications_center.mark_all_read')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={flattenedData}
        renderItem={renderFlattenedItem}
        keyExtractor={(item, index) => (item.isHeader ? `header-${index}` : item.id)}
        contentContainerStyle={[styles.listContent, flattenedData.length === 0 && { flex: 1 }]}
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
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  markAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonContainer: {
    padding: 16,
  },
});

export default NotificationsScreen;
