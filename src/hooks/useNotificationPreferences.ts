import { useState, useEffect, useCallback } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { isAbortError } from '../utils/queryError';
import { useModal } from '../context/ModalContext';
import { useTranslation } from 'react-i18next';
import {
  GetNotificationPreferencesDocument,
  UpdateNotificationPreferencesDocument,
  GetParentNotificationPreferencesDocument,
  ParentUpdateNotificationPreferencesDocument,
} from '../generated/graphql';

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

  // Role picks the document at call time, so both run imperatively.
  const [runStudentPrefsQuery] = useLazyQuery(GetNotificationPreferencesDocument, {
    fetchPolicy: 'network-only',
  });
  const [runParentPrefsQuery] = useLazyQuery(GetParentNotificationPreferencesDocument, {
    fetchPolicy: 'network-only',
  });
  const [updateStudentPrefs] = useMutation(UpdateNotificationPreferencesDocument);
  const [updateParentPrefs] = useMutation(ParentUpdateNotificationPreferencesDocument);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      // Resolve the payload inside each branch — the two documents return
      // differently-named root fields.
      const data =
        role === 'student'
          ? (await runStudentPrefsQuery()).data?.notificationPreferences
          : (await runParentPrefsQuery()).data?.parentNotificationPreferences;

      if (data) {
        setPreferences({
          app_notifications_enabled: !!data.app_notifications_enabled,
          social_notifications_enabled:
            data.social_notifications_enabled !== null ? !!data.social_notifications_enabled : null,
        });
      }
    } catch (error) {
      // A language-switch reload or unmount aborts in-flight queries.
      if (!isAbortError(error)) console.error('Error fetching notification preferences:', error);
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
      const input = { [key]: value };
      const data =
        role === 'student'
          ? (await updateStudentPrefs({ variables: { input } })).data?.updateNotificationPreferences
          : (await updateParentPrefs({ variables: { input } })).data
              ?.parentUpdateNotificationPreferences;

      if (data) {
        setPreferences({
          app_notifications_enabled: !!data.app_notifications_enabled,
          social_notifications_enabled:
            data.social_notifications_enabled !== null ? !!data.social_notifications_enabled : null,
        });
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
