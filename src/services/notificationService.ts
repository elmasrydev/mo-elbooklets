import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking, PermissionsAndroid } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { logError, logInfo } from '../utils/logger';
import { tryFetchWithFallback } from '../config/api';
import i18n from '../i18n';

const NOTIFICATION_PROMPTED_KEY = 'notification_permission_prompted';

/**
 * Mark that the current user has been prompted for notification permission.
 * This prevents re-prompting on every app restart.
 */
export const markNotificationPrompted = async (): Promise<void> => {
  await AsyncStorage.setItem(NOTIFICATION_PROMPTED_KEY, 'true');
};

/**
 * Check if the current user has already been prompted.
 */
export const hasBeenPromptedForNotifications = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(NOTIFICATION_PROMPTED_KEY);
  return value === 'true';
};

/**
 * Clear the prompted flag (call on logout so the next user gets a fresh prompt).
 */
export const clearNotificationPromptedFlag = async (): Promise<void> => {
  await AsyncStorage.removeItem(NOTIFICATION_PROMPTED_KEY);
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    // Android 13+ (API 33) requires explicit POST_NOTIFICATIONS runtime permission
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;
      if (typeof apiLevel === 'number' && apiLevel >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          logInfo('Android POST_NOTIFICATIONS permission denied');
          return false;
        }
      }
      // On Android < 33, notifications are enabled by default
      return true;
    }

    // iOS: use Firebase's requestPermission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  } catch (error) {
    logError('Error requesting notification permission', error);
    return false;
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;
      if (typeof apiLevel === 'number' && apiLevel >= 33) {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return granted;
      }
      // Android < 33: notifications are enabled by default
      return true;
    }

    // iOS
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    return false;
  }
};

export const openSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};

// ─── FCM Token Registration ──────────────────────────────────────────

const REGISTERED_FCM_TOKEN_KEY = 'registered_fcm_token';
const REGISTERED_FCM_ROLE_KEY = 'registered_fcm_role';

type UserRole = 'student' | 'parent';

const REGISTER_MUTATIONS: Record<UserRole, string> = {
  student: `mutation RegisterDeviceToken($token: String!, $platform: String!) {
    registerDeviceToken(token: $token, platform: $platform)
  }`,
  parent: `mutation ParentRegisterDeviceToken($token: String!, $platform: String!) {
    parentRegisterDeviceToken(token: $token, platform: $platform)
  }`,
};

const UNREGISTER_MUTATIONS: Record<UserRole, string> = {
  student: `mutation UnregisterDeviceToken($token: String!) {
    unregisterDeviceToken(token: $token)
  }`,
  parent: `mutation ParentUnregisterDeviceToken($token: String!) {
    parentUnregisterDeviceToken(token: $token)
  }`,
};

/**
 * Get the FCM token. Handles iOS device registration if needed.
 * Returns null if running on iOS Simulator or if token retrieval fails.
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const isEmulator = await DeviceInfo.isEmulator();
    if (Platform.OS === 'ios' && isEmulator) {
      logInfo('FCM: Skipping token retrieval on iOS Simulator');
      return null;
    }

    // iOS: ensure device is registered for remote messages
    if (Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages) {
      try {
        await messaging().registerDeviceForRemoteMessages();
      } catch (e) {
        logError('FCM: Failed to register device for remote messages', e);
        return null;
      }
    }

    const token = await messaging().getToken();
    return token;
  } catch (error) {
    logError('FCM: Error getting token', error);
    return null;
  }
};

/**
 * Register the device's FCM token with the backend server.
 * Stores the registered token + role locally for later unregistration.
 */
export const registerDeviceToken = async (role: UserRole): Promise<void> => {
  try {
    const token = await getFCMToken();
    if (!token) {
      logInfo('FCM: No token available, skipping registration');
      return;
    }

    const platform = Platform.OS; // 'ios' or 'android'
    const mutation = REGISTER_MUTATIONS[role];

    const result = await tryFetchWithFallback(mutation, { token, platform });

    if (result?.errors) {
      logError('FCM: Server error registering token', result.errors);
      return;
    }

    // Store locally so we can unregister on logout
    await AsyncStorage.setItem(REGISTERED_FCM_TOKEN_KEY, token);
    await AsyncStorage.setItem(REGISTERED_FCM_ROLE_KEY, role);
    logInfo(`FCM Register Success | Role: ${role} | Platform: ${platform} | Token: ${token}`);
  } catch (error) {
    logError(`FCM Register Error | Role: ${role} | Platform: ${Platform.OS}`, error);
  }
};

/**
 * Unregister the device's FCM token from the backend server.
 * Uses the locally stored token and role from registration.
 */
export const unregisterDeviceToken = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem(REGISTERED_FCM_TOKEN_KEY);
    const role = (await AsyncStorage.getItem(REGISTERED_FCM_ROLE_KEY)) as UserRole | null;

    if (!token || !role) {
      logInfo('FCM: No registered token found, skipping unregistration');
      return;
    }

    const mutation = UNREGISTER_MUTATIONS[role];

    const result = await tryFetchWithFallback(mutation, { token });

    if (result?.errors) {
      logError(`FCM Unregister Failed | Role: ${role} | Token: ${token}`, result.errors);
    } else {
      logInfo(`FCM Unregister Success | Role: ${role} | Token: ${token}`);
    }

    // Clear local storage regardless of server result
    await AsyncStorage.removeItem(REGISTERED_FCM_TOKEN_KEY);
    await AsyncStorage.removeItem(REGISTERED_FCM_ROLE_KEY);
  } catch (error) {
    logError(`FCM Unregister Error`, error);
    // Still clear local storage on error
    await AsyncStorage.removeItem(REGISTERED_FCM_TOKEN_KEY);
    await AsyncStorage.removeItem(REGISTERED_FCM_ROLE_KEY);
  }
};

/**
 * Set up a listener for FCM token refresh events.
 * When the token rotates, re-register with the backend automatically.
 * Returns an unsubscribe function.
 */
export const setupTokenRefreshListener = (): (() => void) => {
  return messaging().onTokenRefresh(async (newToken) => {
    logInfo('FCM: Token refreshed');
    const role = (await AsyncStorage.getItem(REGISTERED_FCM_ROLE_KEY)) as UserRole | null;
    if (!role) return;

    try {
      const platform = Platform.OS;
      const mutation = REGISTER_MUTATIONS[role];

      const result = await tryFetchWithFallback(mutation, { token: newToken, platform });

      if (!result?.errors) {
        await AsyncStorage.setItem(REGISTERED_FCM_TOKEN_KEY, newToken);
        logInfo(
          `FCM Refresh Register Success | Role: ${role} | Platform: ${platform} | Token: ${newToken}`,
        );
      } else {
        logError(
          `FCM Refresh Register Failed | Role: ${role} | Platform: ${platform}`,
          result?.errors,
        );
      }
    } catch (error) {
      logError(`FCM Refresh Register Error | Role: ${role} | Platform: ${Platform.OS}`, error);
    }
  });
};

// ─── Handler Registration ────────────────────────────────────────────

// Handler registration pattern (same as setLogoutHandler in apollo.ts)
// Allows AuthContext to trigger the notification prompt without needing showConfirm
let notificationPromptHandler: (() => void) | null = null;

export const setNotificationPromptHandler = (handler: () => void) => {
  notificationPromptHandler = handler;
};

/**
 * Trigger the notification permission prompt flow.
 * The actual UI (modal with "Enable Now" / "Later") is handled by NotificationHandler.
 */
export const triggerNotificationPrompt = () => {
  notificationPromptHandler?.();
};

export let lastFcmPayload: any = null;

export const setupNotificationHandlers = (
  showConfirm: (config: any) => void,
  onNavigate?: (slug: string, actionUrl?: string) => void,
) => {
  const handleNotification = (
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    isInitial: boolean = false,
  ) => {
    // Save last payload for debug internal settings
    if (Constants.expoConfig?.extra?.debugMode) {
      lastFcmPayload = remoteMessage;
    }

    if (!remoteMessage.notification && !remoteMessage.data) return;

    const title = remoteMessage.notification?.title || 'Notification';
    const body = remoteMessage.notification?.body || '';
    const slug = remoteMessage.data?.event_slug as string | undefined;
    const actionUrl = remoteMessage.data?.action_url as string | undefined;

    // If app opened from notification, prioritize navigation
    if (isInitial && slug && onNavigate) {
      onNavigate(slug, actionUrl);
      return;
    }

    let confirmLabelStr = i18n.t('common.open');
    if (slug) {
      if (slug === 'link_request_received') {
        confirmLabelStr = i18n.t('notification_actions.open_invitation');
      } else if (slug === 'post_liked') {
        confirmLabelStr = i18n.t('notification_actions.show_me');
      } else if (slug === 'new_follower') {
        confirmLabelStr = i18n.t('notification_actions.view_profile');
      } else if (slug.startsWith('link_request')) {
        confirmLabelStr = i18n.t('notification_actions.view_details');
      }
    }

    // Show modal if in foreground or if no slug
    showConfirm({
      title,
      message: body,
      confirmLabel: slug ? confirmLabelStr : i18n.t('common.ok'),
      cancelLabel: slug ? i18n.t('common.ok') : undefined,
      showCancel: !!slug,
      onConfirm: () => {
        if (slug && onNavigate) {
          onNavigate(slug, actionUrl);
        }
      },
    });
  };

  // Foreground
  const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
    logInfo('FCM Message received in foreground');
    handleNotification(remoteMessage, false);
  });

  // Background / Quit -> Foreground (Clicked)
  const unsubscribeOnOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
    logInfo('FCM Message caused app to open from background');
    handleNotification(remoteMessage, true);
  });

  // Quit -> Foreground (Clicked Initial)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        logInfo('FCM Message caused app to open from quit state');
        handleNotification(remoteMessage, true);
      }
    });

  return () => {
    unsubscribeOnMessage();
    unsubscribeOnOpened();
  };
};
