import React, { useState, useMemo } from 'react';
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
import ProfileCompletionPrompt from '../components/ProfileCompletionPrompt';
import { useMutation } from '@apollo/client/react';
import {
  DeleteAccountDocument,
  DeleteAccountMutation,
  DeleteAccountMutationVariables,
} from '../generated/graphql';
import { isDebugMode } from '../config/debug';
import crashlytics from '@react-native-firebase/crashlytics';

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

  const [deleteAccountMutation, { loading: isDeletingAccount }] = useMutation<
    DeleteAccountMutation,
    DeleteAccountMutationVariables
  >(DeleteAccountDocument);

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
            console.error('Delete account server returned false', result.data?.deleteAccount?.message);
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
      <UnifiedHeader
        title={t('profile_screen.header_title')}
        style={currentStyles.headerOverride}
      />

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
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
            {/* Hide edit avatar button for now */}
            {/* <TouchableOpacity style={currentStyles.editAvatarButton}>
              <Ionicons name="pencil" size={14} color="#ffffff" />
            </TouchableOpacity> */}
          </View>

          <View style={currentStyles.userInfoTextContainer}>
            <Text style={currentStyles.userName}>{user?.name || 'User'}</Text>
            <Text style={currentStyles.userSubtitle}>
              {user?.grade?.name || t('profile_screen.not_specified')}{' '}
              {user?.educational_system?.name ? `• ${user.educational_system.name}` : ''}
            </Text>
            {user?.mobile ? (
              <Text
                style={[
                  currentStyles.userSubtitle,
                  { marginTop: 4, fontWeight: 'normal', opacity: 0.8 },
                ]}
              >
                {user?.country_code ? `${user.country_code} ` : ''}
                {user.mobile}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Menu Section */}
        <View style={currentStyles.menuSection}>
          {/* Menu Items "TODO: we need to release and show it in next release"*/}
          {/*<TouchableOpacity 
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
          </TouchableOpacity>*/}

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

          {/* Parental Linking */}
          <TouchableOpacity
            style={currentStyles.settingItem}
            onPress={() => navigation.navigate('ParentLinking' as never)}
          >
            <View
              style={[
                currentStyles.settingIconBox,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Ionicons name="people-outline" size={22} color={theme.colors.primary} />
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
                <Ionicons name="settings-outline" size={22} color={theme.colors.warning} />
              </View>
              <View style={currentStyles.settingContent}>
                <Text style={currentStyles.settingTitle}>{t('profile_screen.internal_settings')}</Text>
              </View>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={20}
                color={theme.colors.textTertiary}
              />
            </TouchableOpacity>
          )}

          {/* Dark Mode Toggle */}
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

          {/* Log Out */}
          <View style={currentStyles.logoutContainer}>
            <TouchableOpacity style={currentStyles.logoutItem} onPress={handleLogout}>
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
          <View style={currentStyles.deleteAccountIconBox}>
            <Ionicons name="trash-outline" size={18} color={'#fff'} />
          </View>
          <View style={currentStyles.deleteAccountContent}>
            <Text style={currentStyles.deleteAccountTitle}>
              {t('profile_screen.delete_account')}
            </Text>
          </View>
          {isDeletingAccount && <ActivityIndicator color={theme.colors.error} size="small" />}
        </TouchableOpacity>
      </ScrollView>

      <ProfileCompletionPrompt context="more" />
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
    headerOverride: {
      backgroundColor: '#1E40AF', // Enforce specific blue from HTML design
      borderBottomWidth: 0,
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
      backgroundColor: theme.colors.primary100,
      borderWidth: 2,
      borderColor: theme.colors.primary + '33', // 20% opacity
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
    editAvatarButton: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: theme.colors.primary,
      padding: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: theme.colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
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
    menuSection: {
      marginTop: spacing.sm,
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
      marginTop: 2,
      textAlign: common.textAlign,
    },
    logoutContainer: {
      paddingTop: spacing.md,
    },
    logoutItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: isDark ? theme.colors.error + '1A' : '#FEF2F2', // red-50
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: isDark ? theme.colors.error + '33' : '#FEE2E2', // red-100
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
      padding: spacing.xs,
      marginTop: spacing['3xl'],
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.error + '40',
      backgroundColor: 'red',
      opacity: 0.75,
    },
    deleteAccountIconBox: {
      width: 34,
      height: 34,
      borderRadius: borderRadius.sm,
      backgroundColor: theme.colors.error + '1A',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.sm),
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
