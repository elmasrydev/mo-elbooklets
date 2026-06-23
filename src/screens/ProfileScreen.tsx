import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import Avatar from '../components/Avatar';
import AvatarPickerModal from '../components/AvatarPickerModal';
import { useProfileCompleteness } from '../hooks/useProfileCompleteness';
import { useMutation } from '@apollo/client/react';
import {
  DeleteAccountDocument,
  DeleteAccountMutation,
  DeleteAccountMutationVariables,
} from '../generated/graphql';
import { isDebugMode } from '../config/debug';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  openSettings,
} from '../services/notificationService';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';

const APP_VERSION = `EL-Booklets v${DeviceInfo.getVersion()}`;

// WhatsApp / verify accent greens (brand-specific, intentionally literal to match the
// verification CTA design — the theme `success` green is a different shade).
const WHATSAPP_GREEN = '#25D366';
const VERIFY_BG = '#f0fdf4';
const VERIFY_BORDER = 'rgba(22,163,74,0.18)';
const VERIFY_TEXT = '#166534';
const VERIFY_CHEVRON = '#16a34a';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, logout, refreshUser } = useAuth();
  const { showConfirm } = useModal();
  const { theme, spacing, borderRadius } = useTheme();
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
  const [xp, setXp] = useState<number | null>(null);

  const fetchFollowStats = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      // XP isn't on the `me`/User type, but the leaderboard exposes it via userEntry.
      const [followingRes, followersRes, leaderboardRes] = await Promise.all([
        tryFetchWithFallback(`query { myFollowing { id } }`, undefined, token),
        tryFetchWithFallback(`query { myFollowers { id } }`, undefined, token),
        tryFetchWithFallback(
          `query ProfileXp($limit: Int) { leaderboard(limit: $limit) { userEntry { xp } } }`,
          { limit: 1 },
          token,
        ),
      ]);

      setFollowStats({
        following: followingRes.data?.myFollowing?.length || 0,
        followers: followersRes.data?.myFollowers?.length || 0,
      });
      const userXp = leaderboardRes.data?.leaderboard?.userEntry?.xp;
      if (typeof userXp === 'number') setXp(userXp);
    } catch (err) {
      console.error('Fetch follow stats error:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFollowStats();
      // Refresh from the `me` query so the selected avatar (and other fresh fields)
      // load — login/cached-launch don't fetch it.
      refreshUser();
    }, [fetchFollowStats, refreshUser]),
  );
  const { completeness } = useProfileCompleteness();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

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

  const handleVerifyPress = () => {
    showConfirm({
      title: t('otp.verify_mobile', 'Verify mobile'),
      message: t(
        'profile_screen.verify_mobile_msg',
        'Verify your mobile number via WhatsApp to secure your account and unlock all features.',
      ),
      confirmLabel: t('common.ok', 'OK'),
      onConfirm: () => {},
    });
  };

  const s = useMemo(
    () => styles(theme, spacing, borderRadius, common, isRTL, typography, fontWeight),
    [theme, spacing, borderRadius, common, isRTL, typography, fontWeight],
  );

  // Reusable settings row (grouped-list style). `first` controls the hairline divider.
  const renderRow = ({
    icon,
    iconBg,
    iconColor,
    title,
    subtitle,
    meta,
    onPress,
    danger,
    rightElement,
    first,
    dim,
    testID,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconBg?: string;
    iconColor?: string;
    title: string;
    subtitle?: string;
    meta?: string;
    onPress?: () => void;
    danger?: boolean;
    rightElement?: React.ReactNode;
    first?: boolean;
    dim?: boolean;
    testID?: string;
  }) => (
    <TouchableOpacity
      testID={testID}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
      onPress={onPress}
      style={[s.row, !first && s.rowDivider, dim && { opacity: 0.5 }]}
    >
      <View style={[s.rowIcon, { backgroundColor: iconBg || theme.colors.primary100 }]}>
        <Ionicons name={icon} size={20} color={iconColor || theme.colors.navy} />
      </View>
      <View style={s.rowContent}>
        <Text style={[s.rowTitle, danger && { color: theme.colors.error }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={s.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {meta ? <Text style={s.rowMeta}>{meta}</Text> : null}
      {rightElement
        ? rightElement
        : onPress && (
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={theme.colors.textTertiary}
            />
          )}
    </TouchableOpacity>
  );

  const isVerified = !!user?.mobile_verified_at;

  return (
    <View style={s.mainContainer}>
      <UnifiedHeader title={t('profile_screen.header_title')} />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContentContainer,
          { paddingBottom: Math.max(common.insets.bottom, spacing['2xl']) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header card */}
        <View style={s.headerCard}>
          <View style={s.headerRow}>
            <TouchableOpacity
              testID="profile-avatar-button"
              activeOpacity={0.85}
              onPress={() => setShowAvatarPicker(true)}
            >
              <CircularProgress
                size={74}
                strokeWidth={4}
                percentage={completeness?.percentage || 0}
                color={theme.colors.primary}
                containerStyle={{ padding: 4 }}
              >
                <Avatar
                  uri={user?.selectedAvatar?.url}
                  name={user?.name || 'U'}
                  size={58}
                  fontScale={0.36}
                  showLoading
                />
              </CircularProgress>
              <View style={s.avatarEditBadge}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={s.headerInfo}>
              <Text numberOfLines={1} style={s.headerName}>
                {user?.name || 'User'}
              </Text>
              <Text numberOfLines={1} style={s.headerSub}>
                {user?.grade?.name || t('profile_screen.not_specified')}
                {user?.educational_system?.name ? ` · ${user.educational_system.name}` : ''}
              </Text>
              {user?.mobile ? (
                <Text numberOfLines={1} style={s.headerPhone}>
                  {user?.country_code ? `${user.country_code} ` : ''}
                  {user.mobile}
                </Text>
              ) : null}
              {isVerified ? (
                <View style={s.verifiedInline}>
                  <Ionicons name="checkmark-circle" size={13} color={theme.colors.success} />
                  <Text style={s.verifiedInlineText}>{t('otp.mobile_verified', 'Verified')}</Text>
                </View>
              ) : null}
              {xp != null ? (
                <View style={s.xpInline}>
                  <Ionicons name="flash" size={13} color={theme.colors.warning} />
                  <Text style={s.xpInlineText}>{xp.toLocaleString()} XP</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={s.editBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={19} color={theme.colors.navy} />
            </TouchableOpacity>
          </View>

          {!isVerified ? (
            <TouchableOpacity style={s.verifyBtn} activeOpacity={0.8} onPress={handleVerifyPress}>
              <Ionicons name="logo-whatsapp" size={18} color={WHATSAPP_GREEN} />
              <Text style={s.verifyText} numberOfLines={1}>
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

          <View style={s.statsRow}>
            <TouchableOpacity
              style={s.statCol}
              onPress={() => navigation.navigate('FollowList', { type: 'followers' })}
            >
              <Text style={s.statNum}>{followStats.followers}</Text>
              <Text style={s.statLabel}>{t('profile_screen.followers')}</Text>
            </TouchableOpacity>
            <View style={s.statDivider} />
            <TouchableOpacity
              style={s.statCol}
              onPress={() => navigation.navigate('FollowList', { type: 'following' })}
            >
              <Text style={s.statNum}>{followStats.following}</Text>
              <Text style={s.statLabel}>{t('profile_screen.following')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account */}
        <Text style={s.groupLabel}>{t('profile_screen.account_section', 'Account')}</Text>
        <View style={s.group}>
          {renderRow({
            icon: 'create-outline',
            title: t('profile_screen.edit_profile'),
            onPress: () => navigation.navigate('EditProfile'),
            first: true,
          })}
          {renderRow({
            icon: 'language-outline',
            title: t('profile_screen.change_language'),
            meta: language === 'ar' ? 'العربية' : 'English',
            onPress: handleLanguagePress,
          })}
          {renderRow({
            testID: 'profile-parent-linking-item',
            icon: 'people-outline',
            title: t('profile_screen.parental_linking', 'Parental Linking'),
            subtitle: user?.parent_mobile
              ? user.parent_mobile
              : t('profile_screen.parental_linking_desc', 'Connect with your parents'),
            onPress: () => navigation.navigate('ParentLinking' as never),
          })}
          {renderRow({
            icon: 'medal-outline',
            title: t('profile_screen.badges'),
            onPress: () => navigation.navigate('Badges'),
          })}
          {renderRow({
            icon: 'bookmark-outline',
            title: t('more_screen.bookmarks_notes', 'Bookmarks & Notes'),
            subtitle: t('more_screen.bookmarks_notes_desc', 'View your saved points and notes'),
            onPress: () => navigation.navigate('BookmarksNotes'),
          })}
        </View>

        {/* Support */}
        <Text style={s.groupLabel}>{t('profile_screen.support_section', 'Support')}</Text>
        <View style={s.group}>
          {renderRow({
            icon: 'help-circle-outline',
            title: t('profile_screen.faqs'),
            onPress: () => navigation.navigate('FAQs'),
            first: true,
          })}
          {renderRow({
            icon: 'mail-outline',
            title: t('profile_screen.contact_us'),
            onPress: () => navigation.navigate('ContactUs'),
          })}
          {isDebugMode()
            ? renderRow({
                icon: 'options-outline',
                title: t('profile_screen.internal_settings'),
                onPress: () => navigation.navigate('InternalSettings'),
              })
            : null}
        </View>

        {/* Notifications */}
        <Text style={s.groupLabel}>{t('profile_screen.notifications_control')}</Text>
        <View style={s.group}>
          {renderRow({
            icon: 'notifications-outline',
            title: t('profile_screen.notifications'),
            subtitle: t('profile_screen.notifications_desc'),
            first: true,
            rightElement: (
              <Switch
                value={pushEnabled}
                onValueChange={handlePushToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#ffffff' : pushEnabled ? '#ffffff' : '#f4f3f4'}
                ios_backgroundColor={theme.colors.border}
              />
            ),
          })}
          {renderRow({
            icon: 'megaphone-outline',
            title: t('profile_screen.app_notifications'),
            subtitle: t('profile_screen.app_notifications_desc'),
            dim: !pushEnabled,
            rightElement:
              updating === 'app_notifications_enabled' || (prefsLoading && !pushEnabled) ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
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
              ),
          })}
          {renderRow({
            icon: 'chatbubbles-outline',
            title: t('profile_screen.social_notifications'),
            subtitle: t('profile_screen.social_notifications_desc'),
            dim: !pushEnabled,
            rightElement:
              updating === 'social_notifications_enabled' || (prefsLoading && !pushEnabled) ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Switch
                  value={preferences.social_notifications_enabled ?? false}
                  onValueChange={toggleSocialNotifications}
                  disabled={!pushEnabled}
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
              ),
          })}
        </View>

        {/* Log out */}
        <View style={[s.group, { marginTop: spacing.md }]}>
          {renderRow({
            testID: 'profile-logout-item',
            icon: 'log-out-outline',
            iconBg: theme.colors.error + '12',
            iconColor: theme.colors.error,
            title: t('profile_screen.log_out'),
            danger: true,
            first: true,
            onPress: handleLogout,
          })}
        </View>

        {/* Footer */}
        <Text style={s.versionText}>{APP_VERSION}</Text>
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={handleDeleteAccount}
          disabled={isDeletingAccount}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={theme.colors.error}
            style={{ marginEnd: spacing.xs }}
          />
          <Text style={s.deleteText}>{t('profile_screen.delete_account')}</Text>
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

      <AvatarPickerModal visible={showAvatarPicker} onClose={() => setShowAvatarPicker(false)} />
    </View>
  );
};

const styles = (
  theme: any,
  spacing: any,
  borderRadius: any,
  common: any,
  isRTL: boolean,
  typography: any,
  fontWeight: any,
) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContentContainer: {
      padding: spacing.md,
    },

    // Header card
    headerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius['2xl'],
      padding: spacing.mdd,
      marginTop: spacing.sm,
      shadowColor: '#004A9A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 4,
    },
    headerRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: spacing.md,
    },
    avatarEditBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerInfo: {
      flex: 1,
      gap: 3,
    },
    headerName: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    headerSub: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    headerPhone: {
      ...typography('caption'),
      color: theme.colors.textTertiary,
      textAlign: common.textAlign,
    },
    verifiedInline: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    verifiedInlineText: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.success,
    },
    editBtn: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    verifyBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 10,
      marginTop: spacing.md,
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
    statsRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
    },
    statNum: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    statLabel: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 34,
      backgroundColor: theme.colors.border,
    },
    xpInline: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    xpInlineText: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.warning,
    },

    // Grouped lists
    groupLabel: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      ...common.marginStart(spacing.xs),
      textAlign: common.textAlign,
    },
    group: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      ...layout.shadow,
      shadowOpacity: 0.05,
    },
    row: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      minHeight: 62,
    },
    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowContent: {
      flex: 1,
    },
    rowTitle: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    rowSubtitle: {
      ...typography('label'),
      color: theme.colors.textTertiary,
      marginTop: 2,
      textAlign: common.textAlign,
    },
    rowMeta: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.textTertiary,
    },

    // Footer
    versionText: {
      ...typography('caption'),
      color: theme.colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    deleteBtn: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.ssm,
      paddingHorizontal: spacing.xl,
      marginTop: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: theme.colors.error + '4D',
      backgroundColor: theme.colors.surface,
    },
    deleteText: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.error,
      textAlign: 'center',
    },
  });

export default ProfileScreen;
