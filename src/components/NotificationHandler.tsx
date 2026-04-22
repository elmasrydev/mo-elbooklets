import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../context/ModalContext';
import {
  setupNotificationHandlers,
  setupTokenRefreshListener,
  setNotificationPromptHandler,
  requestNotificationPermission,
  markNotificationPrompted,
  hasBeenPromptedForNotifications,
  openSettings,
} from '../services/notificationService';

export const NotificationHandler: React.FC = () => {
  const { showConfirm } = useModal();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = setupNotificationHandlers(showConfirm);
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showConfirm]);

  // Listen for FCM token refresh and re-register with backend
  useEffect(() => {
    const unsubscribe = setupTokenRefreshListener();
    return () => unsubscribe();
  }, []);

  // Register the prompt handler so AuthContext can trigger it
  useEffect(() => {
    setNotificationPromptHandler(async () => {
      const alreadyPrompted = await hasBeenPromptedForNotifications();
      if (alreadyPrompted) return;

      const granted = await requestNotificationPermission();
      await markNotificationPrompted();

      if (!granted) {
        // Permission denied (or iOS won't show dialog again) — show disclaimer
        showConfirm({
          title: t('profile_screen.notifications'),
          message: t('profile_screen.notifications_prompt_msg'),
          confirmLabel: t('profile_screen.enable_now'),
          cancelLabel: t('profile_screen.enable_later'),
          onConfirm: openSettings,
        });
      }
    });
  }, [showConfirm, t]);

  return null;
};
