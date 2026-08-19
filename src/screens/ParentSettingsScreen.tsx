import React, { useState, useMemo, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useTheme } from '../context/ThemeContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import UnifiedHeader from '../components/UnifiedHeader';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import DeviceInfo from 'react-native-device-info';
import { useMutation } from '@apollo/client/react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  openSettings,
} from '../services/notificationService';
import {
  ParentDeleteAccountDocument,
  ParentDeleteAccountMutation,
  ParentDeleteAccountMutationVariables,
} from '../generated/graphql';
import { isDebugMode } from '../config/debug';
import { parentVerificationState } from '../utils/parentVerification';
import { logError } from '../utils/logger';
import crashlytics from '@react-native-firebase/crashlytics';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';

const APP_VERSION = `EL-Booklets v${DeviceInfo.getVersion()}`;

const CrashTrigger = () => {
  throw new Error('Test React Render Error for ErrorBoundary');
};

// WhatsApp / verify accent greens — kept identical to ProfileScreen so the
// parent and student verification surfaces read as one feature (the theme's
// `success` green is a different shade).
const WHATSAPP_GREEN = '#25D366';
const VERIFY_BG = '#f0fdf4';
const VERIFY_BORDER = 'rgba(22,163,74,0.18)';
const VERIFY_TEXT = '#166534';
const VERIFY_CHEVRON = '#16a34a';

const ParentSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { parentUser, logout, requestVerification } = useAuth();
  const { showConfirm } = useModal();
  const { theme, spacing, fontSizes, borderRadius, isDark, toggleTheme } = useTheme();
  const common = useCommonStyles();
  const { isRTL, setLanguage, language } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();

  // Tri-state, matching AppNavigator's parent gate: a real timestamp means
  // verified; explicit `null` means the server says "not verified" (reachable
  // here only after a debug skip, since the gate otherwise holds them on the OTP
  // screen); `undefined` means the record predates the gate and is being
  // backfilled — the gate deliberately does not judge that case, so neither do
  // we. Claiming "Verified" for undefined would be a lie, and offering "Verify"
  // would route nowhere because the gate only fires on `=== null`.
  const verification = parentVerificationState(parentUser?.mobile_verified_at);
  const isParentVerified = verification === 'verified';
  const isParentUnverified = verification === 'unverified';

  const handleVerifyPress = () => {
    showConfirm({
      title: t('otp.verify_mobile', 'Verify mobile'),
      message: t(
        'profile_screen.verify_mobile_msg',
        'Verify your mobile number via WhatsApp to secure your account and unlock all features.',
      ),
      confirmLabel: t('common.ok', 'OK'),
      // Un-skip + auto-request, so AppNavigator re-mounts the parent OTP screen
      // with a code already on its way.
      onConfirm: () => requestVerification(),
    });
  };

  // BKLT-323: `deleteAccount` resolves against the student guard, so a parent
  // token made it 500 — the dialog completed and the account stayed live.
  const [deleteAccountMutation, { loading: isDeletingAccount }] = useMutation<
    ParentDeleteAccountMutation,
    ParentDeleteAccountMutationVariables
  >(ParentDeleteAccountDocument);

  const {
    preferences,
    toggleAppNotifications,
    loading: prefsLoading,
    updating,
  } = useNotificationPreferences('parent');

  const [pushEnabled, setPushEnabled] = useState(false);

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

  const reportDeleteFailure = (serverMessage?: string | null) => {
    if (serverMessage) logError(`[ParentSettings] Delete account rejected: ${serverMessage}`);
    showConfirm({
      title: t('common.error'),
      // The server message is untranslated English; the app's own copy is the
      // only thing an Arabic parent can read.
      message: t('profile_screen.delete_account_error', 'Could not delete your account.'),
      showCancel: false,
      onConfirm: () => {},
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
          if (result.data?.parentDeleteAccount?.success) {
            logout();
            return;
          }
          // Without this the sheet just closes and the account is still there —
          // exactly the symptom reported in BKLT-323.
          reportDeleteFailure(result.data?.parentDeleteAccount?.message);
        } catch (error) {
          logError('[ParentSettings] Delete account failed', error);
          reportDeleteFailure();
        }
      },
    });
  };

  const handleLanguagePress = () => {
    showConfirm({
      title: t('profile_screen.choose_language'),
      message: t('profile_screen.select_language_msg'),
      confirmLabel: language === 'ar' ? 'English (US)' : 'العربية',
      cancelLabel: t('common.cancel'),
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
      <UnifiedHeader title={t('profile_screen.header_title')} showBackButton={false} />

      <ScrollView
        style={currentStyles.scrollView}
        contentContainerStyle={[
          currentStyles.scrollContentContainer,
          { paddingBottom: Math.max(common.insets.bottom, spacing['2xl']) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={currentStyles.profileSection}>
          <View style={currentStyles.avatarRingWrapper}>
            <View style={currentStyles.avatarOuterRing}>
              <View style={[currentStyles.avatarImage, currentStyles.avatarFallback]}>
                <Text style={currentStyles.avatarFallbackText}>
                  {parentUser?.name?.charAt(0).toUpperCase() || 'P'}
                </Text>
              </View>
            </View>
          </View>

          <View style={currentStyles.userInfoTextContainer}>
            <Text style={currentStyles.userName}>{parentUser?.name || 'Parent'}</Text>
            <Text style={currentStyles.userSubtitle}>{t('onboarding.role_parent')}</Text>
            {parentUser?.mobile ? (
              <Text
                style={[
                  currentStyles.userSubtitle,
                  { marginTop: 4, ...fontWeight('normal'), opacity: 0.8 },
                ]}
              >
                {parentUser?.country_code ? `${parentUser.country_code} ` : ''}
                {parentUser.mobile}
              </Text>
            ) : null}

            {isParentVerified ? (
              <View style={currentStyles.verifiedInline} testID="parent-verified-badge">
                <Ionicons name="checkmark-circle" size={13} color={theme.colors.success} />
                <Text style={currentStyles.verifiedInlineText}>
                  {t('otp.mobile_verified', 'Verified')}
                </Text>
              </View>
            ) : null}
          </View>

          {isParentUnverified ? (
            <TouchableOpacity
              testID="parent-verify-mobile"
              style={currentStyles.verifyBtn}
              activeOpacity={0.8}
              onPress={handleVerifyPress}
            >
              <Ionicons name="logo-whatsapp" size={18} color={WHATSAPP_GREEN} />
              <Text style={currentStyles.verifyText} numberOfLines={1}>
                {t('otp.verify_mobile', 'Verify your mobile via WhatsApp')}
              </Text>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={18}
                color={VERIFY_CHEVRON}
                style={{ marginStart: 'auto' }}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Menu Section */}
        <View style={currentStyles.menuSection}>
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
              <Ionicons name="help-circle-outline" size={22} color={theme.colors.info} />
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
              <Ionicons name="mail-outline" size={22} color={theme.colors.warning} />
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
                <Ionicons name="settings-outline" size={22} color={theme.colors.warning} />
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
              <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
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
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
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
              testID="parent-settings-logout-item"
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
          testID="parent-settings-delete-account"
          style={currentStyles.deleteAccountItem}
          onPress={handleDeleteAccount}
          disabled={isDeletingAccount}
        >
          <View style={currentStyles.deleteAccountIconBox}>
            <Ionicons name="trash-outline" size={18} color={'#fff'} />
          </View>
          <View style={currentStyles.deleteAccountContent}>
            <Text style={currentStyles.deleteAccountTitle}>
              {t('profile_screen.delete_account')}
            </Text>
          </View>
          {isDeletingAccount && (
            <ActivityIndicator color="#fff" size="small" style={{ marginStart: 8 }} />
          )}
        </TouchableOpacity>
      </ScrollView>
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
    profileSection: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      marginBottom: 0,
    },
    avatarRingWrapper: {
      position: 'relative',
    },
    avatarOuterRing: {
      padding: 4,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary + '15',
      borderWidth: 2,
      borderColor: theme.colors.primary + '33',
    },
    avatarImage: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 4,
      borderColor: theme.colors.card,
    },
    avatarFallback: {
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarFallbackText: {
      ...typography('h1'),
      ...fontWeight('bold'),
      color: '#ffffff',
    },
    userInfoTextContainer: {
      marginTop: spacing.md,
      alignItems: 'center',
    },
    userName: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: 2,
      textAlign: 'center',
    },
    userSubtitle: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    verifiedInline: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    verifiedInlineText: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.success,
    },
    verifyBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: 10,
      marginTop: spacing.md,
      marginHorizontal: layout.screenPadding,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: borderRadius.lg,
      backgroundColor: VERIFY_BG,
      borderWidth: 1,
      borderColor: VERIFY_BORDER,
    },
    verifyText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: VERIFY_TEXT,
      flexShrink: 1,
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
      backgroundColor: theme.colors.card,
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sm,
      ...layout.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    settingIconBox: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: isDark ? theme.colors.primary + '1A' : theme.colors.primary100,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
    },
    menuImage: {
      width: 21,
      height: 21,
      resizeMode: 'contain',
    },
    logoutMenuImage: {
      width: 21,
      height: 21,
      resizeMode: 'contain',
    },
    settingContent: {
      flex: 1,
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
      marginTop: 2,
      textAlign: common.textAlign,
    },
    logoutContainer: {
      paddingTop: spacing.md,
    },
    logoutItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: isDark ? theme.colors.error + '1A' : '#FEF2F2',
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: isDark ? theme.colors.error + '33' : '#FEE2E2',
    },
    logoutIconBox: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: isDark ? theme.colors.error + '33' : '#FEE2E2',
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
      width: '70%',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.sm,
      marginTop: spacing['3xl'],
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.error,
      opacity: 0.8,
    },
    deleteAccountIconBox: {
      width: 30,
      height: 30,
      borderRadius: borderRadius.sm,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.sm),
    },
    deleteAccountContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteAccountTitle: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: '#fff',
      textAlign: common.textAlign,
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
      //flexDirection: 'row',
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
      marginTop: spacing.lg,
    },
    scrollContentContainer: {
      padding: layout.screenPadding,
    },
  });

export default ParentSettingsScreen;
