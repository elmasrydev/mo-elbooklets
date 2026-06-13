import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Platform,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import * as SecureStore from 'expo-secure-store';
import { tryFetchWithFallback } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import UnifiedHeader from '../components/UnifiedHeader';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import DeviceInfo from 'react-native-device-info';
import ProfileCompletionPrompt from '../components/ProfileCompletionPrompt';
import CircularProgress from '../components/CircularProgress';
import { useProfileCompleteness } from '../hooks/useProfileCompleteness';
import { useMutation } from '@apollo/client/react';
import {
  DeleteAccountDocument,
  DeleteAccountMutation,
  DeleteAccountMutationVariables,
} from '../generated/graphql';
import { isDebugMode } from '../config/debug';
import crashlytics from '@react-native-firebase/crashlytics';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  openSettings,
} from '../services/notificationService';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { logError } from '../utils/logger';

const APP_VERSION = `EL-Booklets v${DeviceInfo.getVersion()}`;

const CrashTrigger = () => {
  throw new Error('Test React Render Error for ErrorBoundary');
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { showConfirm } = useModal();
  const { theme, spacing, fontSizes, borderRadius, isDark, toggleTheme } = useTheme();
  const common = useCommonStyles();
  const { isRTL, setLanguage, language } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();

  const [pushEnabled, setPushEnabled] = useState(false);
  const {
    preferences,
    toggleAppNotifications,
    toggleSocialNotifications,
    loading: prefsLoading,
    updating,
  } = useNotificationPreferences('student');

  useFocusEffect(
    React.useCallback(() => {
      checkNotificationPermission().then(setPushEnabled);
    }, []),
  );

  // Re-check permission when returning from OS Settings
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkNotificationPermission().then(setPushEnabled);
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  const handlePushToggle = async (newValue: boolean) => {
    if (newValue) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPushEnabled(true);
      } else {
        showConfirm({
          title: t('profile_screen.notifications'),
          message: t('profile_screen.notifications_settings_msg'),
          confirmLabel: t('common.settings') || 'Settings',
          cancelLabel: t('common.cancel'),
          onConfirm: openSettings,
        });
      }
    } else {
      showConfirm({
        title: t('profile_screen.notifications'),
        message: t('profile_screen.notifications_disable_msg'),
        confirmLabel: t('common.settings') || 'Settings',
        cancelLabel: t('common.cancel'),
        onConfirm: openSettings,
      });
    }
  };

  const [deleteAccountMutation, { loading: isDeletingAccount }] = useMutation<
    DeleteAccountMutation,
    DeleteAccountMutationVariables
  >(DeleteAccountDocument);

  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchFollowStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const [followingRes, followersRes] = await Promise.all([
        tryFetchWithFallback(`query { myFollowing { id } }`, undefined, token),
        tryFetchWithFallback(`query { myFollowers { id } }`, undefined, token),
      ]);

      setFollowStats({
        following: followingRes.data?.myFollowing?.length || 0,
        followers: followersRes.data?.myFollowers?.length || 0,
      });
    } catch (err) {
      console.error('Fetch follow stats error:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFollowStats();
    }, [fetchFollowStats]),
  );
  const { completeness } = useProfileCompleteness();
  const [showPrompt, setShowPrompt] = useState(false);

  const handleLogout = () => {
    showConfirm({
      title: t('profile_screen.log_out'),
      message: t('more_screen.logout_confirm'),
      confirmLabel: t('profile_screen.log_out'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: logout,
    });
  };

  const handleDeleteAccount = () => {
    showConfirm({
      title: t('profile_screen.delete_account'),
      message: t('profile_screen.delete_account_confirm'),
      confirmLabel: t('profile_screen.delete_account'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      countdown: 10,
      onConfirm: async () => {
        try {
          const result = await deleteAccountMutation();
          if (result.data?.deleteAccount?.success) {
            logout();
          } else {
            console.error(
              'Delete account server returned false',
              result.data?.deleteAccount?.message,
            );
          }
        } catch (error) {
          console.error('Error deleting account:', error);
        }
      },
    });
  };

  const handleLanguagePress = () => {
    showConfirm({
      title: t('profile_screen.choose_language'),
      message: t('profile_screen.select_language_msg'),
      confirmLabel: language === 'ar' ? 'English (US)' : 'العربية',
      cancelLabel: t('common.cancel') || 'Cancel',
      onConfirm: () => setLanguage(language === 'ar' ? 'en' : 'ar', true),
    });
  };

  const currentStyles = useMemo(
    () =>
      styles(
        theme,
        spacing,
        fontSizes,
        borderRadius,
        common,
        isRTL,
        typography,
        fontWeight,
        isDark,
      ),
    [theme, spacing, fontSizes, borderRadius, common, isRTL, typography, fontWeight, isDark],
  );

  return (
    <View style={currentStyles.mainContainer}>
      <UnifiedHeader title={t('profile_screen.header_title')} />

      <ScrollView
        style={currentStyles.scrollView}
        contentContainerStyle={[
          currentStyles.scrollContentContainer,
          { paddingBottom: Math.max(common.insets.bottom, spacing['2xl']) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Integrated Profile Card (Variation A) */}
        <View style={currentStyles.profileCardContainer}>
          {/* Top Half: Avatar (Left) + User Info (Right) */}
          <View style={currentStyles.profileInfoRow}>
            {/* Avatar Column */}
            <TouchableOpacity
              style={currentStyles.avatarContainer}
              activeOpacity={0.8}
              onPress={() => setShowPrompt(true)}
            >
              <CircularProgress
                size={80}
                strokeWidth={4}
                percentage={completeness?.percentage || 0}
                color={theme.colors.primary}
                containerStyle={currentStyles.avatarProgress}
              >
                <View style={[currentStyles.avatarImage, currentStyles.avatarFallback]}>
                  <Text style={currentStyles.avatarFallbackText}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              </CircularProgress>
            </TouchableOpacity>

            {/* User Details Column */}
            <View style={currentStyles.profileDetailsColumn}>
              <Text numberOfLines={1} style={currentStyles.userNameText}>
                {user?.name || 'User'}
              </Text>
              <Text numberOfLines={1} style={currentStyles.userGradeText}>
                {user?.grade?.name || t('profile_screen.not_specified')}{' '}
                {user?.educational_system?.name ? `• ${user.educational_system.name}` : ''}
              </Text>

              {/* Phone + Verification Badge Row */}
              <View style={currentStyles.phoneBadgeRow}>
                {user?.mobile ? (
                  <Text style={currentStyles.userPhoneText}>
                    {user?.country_code ? `${user.country_code} ` : ''}
                    {user.mobile}
                  </Text>
                ) : null}

                {!user?.mobile_verified_at ? (
                  <View style={currentStyles.verifyCapsule}>
                    <Ionicons name="logo-whatsapp" size={12} color="#25D366" />
                    <Text
                      numberOfLines={1}
                      style={[typography('caption'), currentStyles.verifyCapsuleText]}
                    >
                      {t('otp.verify_mobile', 'Verify')}
                    </Text>
                  </View>
                ) : (
                  <View style={currentStyles.verifiedCapsule}>
                    <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
                    <Text
                      numberOfLines={1}
                      style={[typography('caption'), currentStyles.verifiedCapsuleText]}
                    >
                      {t('otp.mobile_verified', 'Verified')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={currentStyles.cardDivider} />

          {/* Bottom Half: Follow Stats */}
          <View style={currentStyles.statsRowContainer}>
            <TouchableOpacity
              style={currentStyles.statsColumn}
              onPress={() => navigation.navigate('FollowList', { type: 'followers' })}
            >
              <Text style={currentStyles.statsNumber}>{followStats.followers}</Text>
              <Text style={currentStyles.statsLabelText}>{t('profile_screen.followers')}</Text>
            </TouchableOpacity>
            <View style={currentStyles.statsVerticalDivider} />
            <TouchableOpacity
              style={currentStyles.statsColumn}
              onPress={() => navigation.navigate('FollowList', { type: 'following' })}
            >
              <Text style={currentStyles.statsNumber}>{followStats.following}</Text>
              <Text style={currentStyles.statsLabelText}>{t('profile_screen.following')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Section */}
        <View style={currentStyles.menuSection}>
          {/* Menu Items "TODO: we need to release and show it in next release"*/}
          <TouchableOpacity
            style={currentStyles.settingItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={currentStyles.settingIconBox}>
              <Image
                source={require('../../assets/images/editProfile.png')}
                style={currentStyles.menuImage}
              />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>{t('profile_screen.edit_profile')}</Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Change Language */}
          <TouchableOpacity style={currentStyles.settingItem} onPress={handleLanguagePress}>
            <View style={currentStyles.settingIconBox}>
              <Image
                source={require('../../assets/images/changeLang.png')}
                style={currentStyles.menuImage}
              />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>{t('profile_screen.change_language')}</Text>
              <Text style={currentStyles.settingSubtitle}>
                {t('profile_screen.change_language_desc')}
              </Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>

          {/* FAQ */}
          <TouchableOpacity
            style={currentStyles.settingItem}
            onPress={() => navigation.navigate('FAQs')}
          >
            <View
              style={[currentStyles.settingIconBox, { backgroundColor: theme.colors.info + '20' }]}
            >
              <Ionicons name="help-circle-outline" size={20} color={theme.colors.info} />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>{t('profile_screen.faqs')}</Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Contact Us */}
          <TouchableOpacity
            style={currentStyles.settingItem}
            onPress={() => navigation.navigate('ContactUs')}
          >
            <View
              style={[
                currentStyles.settingIconBox,
                { backgroundColor: theme.colors.warning + '20' },
              ]}
            >
              <Ionicons name="mail-outline" size={20} color={theme.colors.warning} />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>{t('profile_screen.contact_us')}</Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Parental Linking */}
          <TouchableOpacity
            testID="profile-parent-linking-item"
            style={currentStyles.settingItem}
            onPress={() => navigation.navigate('ParentLinking' as never)}
          >
            <View
              style={[
                currentStyles.settingIconBox,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>
                {t('profile_screen.parental_linking', 'Parental Linking')}
              </Text>
              <Text style={currentStyles.settingSubtitle}>
                {user?.parent_mobile
                  ? user.parent_mobile
                  : t('profile_screen.parental_linking_desc', 'Connect with your parents')}
              </Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Badges */}
          <TouchableOpacity
            style={currentStyles.settingItem}
            onPress={() => navigation.navigate('Badges')}
          >
            <View style={currentStyles.settingIconBox}>
              <Image
                source={require('../../assets/images/Badges.png')}
                style={currentStyles.menuImage}
              />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>{t('profile_screen.badges')}</Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Bookmarks & Notes */}
          <TouchableOpacity
            style={currentStyles.settingItem}
            onPress={() => navigation.navigate('BookmarksNotes')}
          >
            <View
              style={[
                currentStyles.settingIconBox,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Ionicons name="bookmark-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>
                {t('more_screen.bookmarks_notes', 'Bookmarks & Notes')}
              </Text>
              <Text style={currentStyles.settingSubtitle}>
                {t('more_screen.bookmarks_notes_desc', 'View your saved points and notes')}
              </Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Help and Support - Hidden for now */}
          {/*
          <TouchableOpacity style={currentStyles.settingItem}>
            <View style={currentStyles.settingIconBox}>
              <Image
                source={require('../../assets/images/help.png')}
                style={currentStyles.menuImage}
              />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>{t('profile_screen.help_support')}</Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
          */}

          {/* Internal Settings (debug builds only) */}
          {isDebugMode() && (
            <TouchableOpacity
              style={currentStyles.settingItem}
              onPress={() => navigation.navigate('InternalSettings')}
            >
              <View
                style={[
                  currentStyles.settingIconBox,
                  { backgroundColor: theme.colors.warning + '20' },
                ]}
              >
                <Ionicons name="settings-outline" size={20} color={theme.colors.warning} />
              </View>
              <View style={currentStyles.settingContent}>
                <Text style={currentStyles.settingTitle}>
                  {t('profile_screen.internal_settings')}
                </Text>
              </View>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={20}
                color={theme.colors.textTertiary}
              />
            </TouchableOpacity>
          )}

          {/* Notifications Control Section */}
          <View style={currentStyles.sectionHeader}>
            <Text style={currentStyles.sectionHeaderText}>
              {t('profile_screen.notifications_control')}
            </Text>
          </View>

          {/* 1. Main Push Notifications Toggle (OS Level) */}
          <View style={currentStyles.settingItem}>
            <View
              style={[
                currentStyles.settingIconBox,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>{t('profile_screen.notifications')}</Text>
              <Text style={currentStyles.settingSubtitle}>
                {t('profile_screen.notifications_desc')}
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              style={{ alignSelf: 'center' }}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#ffffff' : pushEnabled ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor={theme.colors.border}
            />
          </View>

          {/* 2. App Notifications Toggle (API Level) */}
          <View style={[currentStyles.settingItem, !pushEnabled && { opacity: 0.5 }]}>
            <View
              style={[
                currentStyles.settingIconBox,
                { backgroundColor: theme.colors.secondary + '20' },
              ]}
            >
              <Ionicons name="apps-outline" size={20} color={theme.colors.secondary} />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>
                {t('profile_screen.app_notifications')}
              </Text>
              <Text style={currentStyles.settingSubtitle}>
                {t('profile_screen.app_notifications_desc')}
              </Text>
            </View>
            {updating === 'app_notifications_enabled' || (prefsLoading && !pushEnabled) ? (
              <View style={currentStyles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <Switch
                value={preferences.app_notifications_enabled}
                onValueChange={toggleAppNotifications}
                disabled={!pushEnabled}
                style={{ alignSelf: 'center' }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={
                  Platform.OS === 'ios'
                    ? '#ffffff'
                    : preferences.app_notifications_enabled
                      ? '#ffffff'
                      : '#f4f3f4'
                }
                ios_backgroundColor={theme.colors.border}
              />
            )}
          </View>

          {/* 3. Social Notifications Toggle (API Level) */}
          <View style={[currentStyles.settingItem, !pushEnabled && { opacity: 0.5 }]}>
            <View
              style={[currentStyles.settingIconBox, { backgroundColor: theme.colors.info + '20' }]}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={theme.colors.info} />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>
                {t('profile_screen.social_notifications')}
              </Text>
              <Text style={currentStyles.settingSubtitle}>
                {t('profile_screen.social_notifications_desc')}
              </Text>
            </View>
            {updating === 'social_notifications_enabled' || (prefsLoading && !pushEnabled) ? (
              <View style={currentStyles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <Switch
                value={preferences.social_notifications_enabled ?? false}
                onValueChange={toggleSocialNotifications}
                disabled={!pushEnabled}
                style={{ alignSelf: 'center' }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={
                  Platform.OS === 'ios'
                    ? '#ffffff'
                    : preferences.social_notifications_enabled
                      ? '#ffffff'
                      : '#f4f3f4'
                }
                ios_backgroundColor={theme.colors.border}
              />
            )}
          </View>

          {/* Dark Mode Toggle - Locked to Light Mode */}
          {/* 
          <View style={currentStyles.settingItem}>
            <View style={currentStyles.settingIconBox}>
              <Image
                source={require('../../assets/images/darkMode.png')}
                style={currentStyles.menuImage}
              />
            </View>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}>{t('profile_screen.dark_mode')}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#ffffff' : isDark ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
          */}

          {/* Log Out */}
          <View style={currentStyles.logoutContainer}>
            <TouchableOpacity
              testID="profile-logout-item"
              style={currentStyles.logoutItem}
              onPress={handleLogout}
            >
              <View style={currentStyles.logoutIconBox}>
                <Image
                  source={require('../../assets/images/logout.png')}
                  style={currentStyles.logoutMenuImage}
                />
              </View>
              <View style={currentStyles.settingContent}>
                <Text style={currentStyles.logoutTitle}>{t('profile_screen.log_out')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Info */}
        <Text style={currentStyles.versionText}>{APP_VERSION}</Text>

        <TouchableOpacity
          style={currentStyles.deleteAccountItem}
          onPress={handleDeleteAccount}
          disabled={isDeletingAccount}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={theme.colors.error}
            style={{ marginEnd: spacing.xs }}
          />
          <Text style={currentStyles.deleteAccountTitle}>{t('profile_screen.delete_account')}</Text>
          {isDeletingAccount && (
            <ActivityIndicator
              color={theme.colors.error}
              size="small"
              style={{ marginStart: spacing.xs }}
            />
          )}
        </TouchableOpacity>
      </ScrollView>

      <ProfileCompletionPrompt
        context="more"
        isVisible={showPrompt}
        onClose={() => setShowPrompt(false)}
        autoShow={true}
      />
    </View>
  );
};

const styles = (
  theme: any,
  spacing: any,
  fontSizes: any,
  borderRadius: any,
  common: any,
  isRTL: boolean,
  typography: any,
  fontWeight: any,
  isDark: boolean,
) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    scrollView: {
      flex: 1,
    },
    avatarImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 1.5,
      borderColor: theme.colors.surface,
    },
    avatarProgress: {
      padding: 4,
    },
    avatarFallback: {
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarFallbackText: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: '#ffffff',
    },
    profileCardContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: spacing.sm,
      padding: spacing.md,
      ...layout.shadow,
    },
    profileInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatarContainer: {
      position: 'relative',
    },
    profileDetailsColumn: {
      flex: 1,
      justifyContent: 'center',
      gap: 4,
    },
    userNameText: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: 'left',
    },
    userGradeText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'left',
    },
    phoneBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    userPhoneText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'left',
    },
    verifyCapsule: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: borderRadius.md,
    },
    verifyCapsuleText: {
      ...fontWeight('600'),
      color: theme.colors.primary,
      fontSize: 10,
    },
    verifiedCapsule: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.success + '15',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: borderRadius.md,
    },
    verifiedCapsuleText: {
      ...fontWeight('600'),
      color: theme.colors.success,
      fontSize: 10,
    },
    cardDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: spacing.md,
    },
    statsRowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statsColumn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsNumber: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    statsLabelText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    statsVerticalDivider: {
      width: 1,
      height: 32,
      backgroundColor: theme.colors.border,
    },
    menuSection: {
      marginTop: spacing.sm,
    },
    sectionHeader: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      ...common.marginStart(spacing.xs),
    },
    sectionHeaderText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    loaderContainer: {
      width: 50,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      minHeight: 64,
      borderRadius: borderRadius.xl,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    settingIconBox: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.md,
      backgroundColor: isDark ? theme.colors.primary + '1A' : theme.colors.primary100,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
    },
    menuImage: {
      width: 18,
      height: 18,
      resizeMode: 'contain',
    },
    logoutMenuImage: {
      width: 18,
      height: 18,
      resizeMode: 'contain',
    },
    settingContent: {
      flex: 1,
      justifyContent: 'center',
    },
    deleteAccountContent: {
      //flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingTitle: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    settingSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 0,
      textAlign: common.textAlign,
    },
    logoutContainer: {
      paddingTop: spacing.md,
    },
    logoutItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      minHeight: 64,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    logoutIconBox: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.error + '10',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
    },
    logoutTitle: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.error,
      textAlign: common.textAlign,
    },
    deleteAccountItem: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
      marginTop: spacing['2xl'],
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.error + '40',
      backgroundColor: 'transparent',
    },
    deleteAccountTitle: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.error,
      textAlign: 'center',
    },
    crashTestContainer: {
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: isDark ? theme.colors.warning + '0D' : '#FFF8E1',
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: isDark ? theme.colors.warning + '33' : '#FFE082',
    },
    crashTestHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    crashTestTitle: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.warning,
      ...common.marginStart(spacing.xs),
    },
    crashTestSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.sm,
      textAlign: common.textAlign,
    },
    crashTestButtonsRow: {
      gap: spacing.sm,
    },
    crashButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: theme.colors.error,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    logErrorButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: theme.colors.warning,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    crashButtonText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: '#ffffff',
    },
    versionText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing['lg'],
    },
    scrollContentContainer: {
      padding: layout.screenPadding,
    },
  });

export default ProfileScreen;
