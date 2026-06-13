import { useState, useEffect, useCallback } from 'react';
import { tryFetchWithFallback } from '../config/api';
import { useModal } from '../context/ModalContext';
import { useTranslation } from 'react-i18next';
import {
  NOTIFICATION_PREFERENCES_QUERY,
  UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
  PARENT_NOTIFICATION_PREFERENCES_QUERY,
  PARENT_UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
} from '../graphql/notificationPreferences';
import { print } from 'graphql';

type UserRole = 'student' | 'parent';

interface NotificationPreferences {
  app_notifications_enabled: boolean;
  social_notifications_enabled: boolean | null;
}

export const useNotificationPreferences = (role: UserRole) => {
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<keyof NotificationPreferences | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    app_notifications_enabled: false,
    social_notifications_enabled: false,
  });

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const query =
        role === 'student' ? NOTIFICATION_PREFERENCES_QUERY : PARENT_NOTIFICATION_PREFERENCES_QUERY;
      const result = await tryFetchWithFallback(print(query));

      if (result?.data) {
        const data =
          role === 'student'
            ? result.data.notificationPreferences
            : result.data.parentNotificationPreferences;
        if (data) {
          setPreferences({
            app_notifications_enabled: !!data.app_notifications_enabled,
            social_notifications_enabled:
              data.social_notifications_enabled !== null
                ? !!data.social_notifications_enabled
                : null,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    // Optimistic Update
    const previousPreferences = { ...preferences };
    setPreferences((prev) => ({ ...prev, [key]: value }));

    try {
      setUpdating(key);
      const mutation =
        role === 'student'
          ? UPDATE_NOTIFICATION_PREFERENCES_MUTATION
          : PARENT_UPDATE_NOTIFICATION_PREFERENCES_MUTATION;

      const input = { [key]: value };
      const result = await tryFetchWithFallback(print(mutation), { input });

      if (result?.errors) {
        throw new Error(result.errors[0]?.message || 'Update failed');
      }

      if (result?.data) {
        const data =
          role === 'student'
            ? result.data.updateNotificationPreferences
            : result.data.parentUpdateNotificationPreferences;
        if (data) {
          setPreferences({
            app_notifications_enabled: !!data.app_notifications_enabled,
            social_notifications_enabled:
              data.social_notifications_enabled !== null
                ? !!data.social_notifications_enabled
                : null,
          });
        }
      }
    } catch (error) {
      // Revert on error
      setPreferences(previousPreferences);
      showConfirm({
        title: t('common.error') || 'Error',
        message: t('profile_screen.notification_update_failed'),
        confirmLabel: t('common.ok') || 'OK',
        showCancel: false,
        onConfirm: () => {},
      });
      console.error('Error updating notification preference:', error);
    } finally {
      setUpdating(null);
    }
  };

  const toggleAppNotifications = (value: boolean) =>
    updatePreference('app_notifications_enabled', value);
  const toggleSocialNotifications = (value: boolean) =>
    updatePreference('social_notifications_enabled', value);

  return {
    loading,
    updating,
    preferences,
    toggleAppNotifications,
    toggleSocialNotifications,
    refresh: fetchPreferences,
  };
};
