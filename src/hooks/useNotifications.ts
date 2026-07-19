import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { tryFetchWithFallback } from '../config/api';
import { AppNotification } from '../types/notification';
import {
  UserNotificationsDocument,
  ParentNotificationsDocument,
  MarkNotificationReadDocument,
  MarkAllNotificationsReadDocument,
  ParentMarkNotificationReadDocument,
  ParentMarkAllNotificationsReadDocument,
} from '../generated/graphql';
import { useFocusEffect } from '@react-navigation/native';

const PER_PAGE = 20;

export const useNotifications = () => {
  const { userRole, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to prevent overlapping fetches
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(
    async (targetPage: number, isRefresh = false) => {
      if (!isAuthenticated || !userRole) {
        setLoading(false);
        return;
      }
      // Skip if a fetch is already in flight — even for a refresh. Previously a
      // focus-refresh bypassed this guard and could interleave with an in-flight
      // loadMore, appending page-2 data onto a freshly reset page-1 list.
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      if (isRefresh) {
        setRefreshing(true);
      } else if (targetPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const query =
          userRole === 'student' ? UserNotificationsDocument : ParentNotificationsDocument;
        const result = await tryFetchWithFallback(query, {
          page: targetPage,
          per_page: PER_PAGE,
        });

        if (result.errors) {
          throw new Error(result.errors[0]?.message || 'Failed to fetch notifications');
        }

        const data =
          userRole === 'student' ? result.data.userNotifications : result.data.parentNotifications;

        if (isRefresh || targetPage === 1) {
          setNotifications(data.data);
        } else {
          setNotifications((prev) => [...prev, ...data.data]);
        }

        setUnreadCount(data.unread_count);
        setTotal(data.total);
        setHasMore(data.has_more);
        setPage(targetPage);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [isAuthenticated, userRole],
  );

  const refresh = useCallback(() => {
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading && !refreshing) {
      fetchNotifications(page + 1);
    }
  }, [hasMore, loadingMore, loading, refreshing, page, fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!userRole) return;

      // Optimistic update
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const mutation =
          userRole === 'student'
            ? MarkNotificationReadDocument
            : ParentMarkNotificationReadDocument;
        await tryFetchWithFallback(mutation, { id });
      } catch (err) {
        // Revert if needed? Usually for simple read marks we don't revert to avoid flicker
        console.error('Failed to mark notification as read:', err);
      }
    },
    [userRole],
  );

  const [markingAllRead, setMarkingAllRead] = useState(false);

  const markAllAsRead = useCallback(async () => {
    if (!userRole || markingAllRead) return;

    setMarkingAllRead(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const mutation =
        userRole === 'student'
          ? MarkAllNotificationsReadDocument
          : ParentMarkAllNotificationsReadDocument;
      await tryFetchWithFallback(mutation);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setMarkingAllRead(false);
    }
  }, [userRole, markingAllRead]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1, true);
    }, [fetchNotifications]),
  );

  return {
    notifications,
    unreadCount,
    total,
    hasMore,
    page,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    markingAllRead,
  };
};
