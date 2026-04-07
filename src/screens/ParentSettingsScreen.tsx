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
import { useMutation } from '@apollo/client/react';
import {
  DeleteAccountDocument,
  DeleteAccountMutation,
  DeleteAccountMutationVariables,
} from '../generated/graphql';
import { isDebugMode } from '../config/debug';
import ApiUrlSwitcherModal from '../components/ApiUrlSwitcherModal';
import crashlytics from '@react-native-firebase/crashlytics';

const APP_VERSION = `EL-Booklets v${DeviceInfo.getVersion()}`;

const ParentSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { parentUser, logout } = useAuth();
  const { showConfirm } = useModal();
  const { theme, spacing, fontSizes, borderRadius, isDark, toggleTheme } = useTheme();
  const common = useCommonStyles();
  const { isRTL, setLanguage, language } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();
  const [showApiModal, setShowApiModal] = useState(false);

  const handleTestCrash = () => {
    crashlytics().crash();
  };

  const handleTestLogError = () => {
    crashlytics().log('Test log from Parent Settings Screen');
    crashlytics().recordError(
      new Error('Test error from Parent Settings Screen at ' + new Date().toISOString()),
    );
  };

  const [deleteAccountMutation, { loading: isDeletingAccount }] = useMutation<DeleteAccountMutation, DeleteAccountMutationVariables>(DeleteAccountDocument);

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
      <UnifiedHeader
        title={t('profile_screen.header_title')}
        showBackButton={true}
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
                  {parentUser?.name?.charAt(0).toUpperCase() || 'P'}
                </Text>
              </View>
            </View>
          </View>

          <View style={currentStyles.userInfoTextContainer}>
            <Text style={currentStyles.userName}>{parentUser?.name || 'Parent'}</Text>
            <Text style={currentStyles.userSubtitle}>
              {t('onboarding.role_parent')}
            </Text>
            {parentUser?.mobile ? (
              <Text
                style={[
                  currentStyles.userSubtitle,
                  { marginTop: 4, fontWeight: 'normal' as any, opacity: 0.8 },
                ]}
              >
                {parentUser?.country_code ? `${parentUser.country_code} ` : ''}
                {parentUser.mobile}
              </Text>
            ) : null}
          </View>
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

          {/* API URL Switcher (debug builds only) */}
          {isDebugMode() && (
            <TouchableOpacity
              style={currentStyles.settingItem}
              onPress={() => setShowApiModal(true)}
            >
              <View
                style={[
                  currentStyles.settingIconBox,
                  { backgroundColor: theme.colors.warning + '20' },
                ]}
              >
                <Ionicons name="server-outline" size={22} color={theme.colors.warning} />
              </View>
              <View style={currentStyles.settingContent}>
                <Text style={currentStyles.settingTitle}>
                  {t('common.api_url_switcher_title')}
                </Text>
              </View>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={20}
                color={theme.colors.textTertiary}
              />
            </TouchableOpacity>
          )}

          {/* Crashlytics Testing (debug builds only) */}
          {isDebugMode() && (
            <View style={currentStyles.crashTestContainer}>
              <View style={currentStyles.crashTestHeader}>
                <Ionicons name="bug-outline" size={18} color={theme.colors.warning} />
                <Text style={currentStyles.crashTestTitle}>
                  {t('profile_screen.crashlytics_testing')}
                </Text>
              </View>
              <Text style={currentStyles.crashTestSubtitle}>
                {t('profile_screen.crashlytics_testing_desc')}
              </Text>
              <View style={currentStyles.crashTestButtonsRow}>
                <TouchableOpacity
                  style={currentStyles.crashButton}
                  onPress={handleTestCrash}
                >
                  <Ionicons name="flame-outline" size={16} color="#fff" />
                  <Text style={currentStyles.crashButtonText}>
                    {t('profile_screen.test_crash')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={currentStyles.logErrorButton}
                  onPress={handleTestLogError}
                >
                  <Ionicons name="alert-circle-outline" size={16} color="#fff" />
                  <Text style={currentStyles.crashButtonText}>
                    {t('profile_screen.test_log_error')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
          {isDeletingAccount && <ActivityIndicator color="#fff" size="small" style={{ marginStart: 8 }} />}
        </TouchableOpacity>
      </ScrollView>

      <ApiUrlSwitcherModal
        isVisible={showApiModal}
        onClose={() => setShowApiModal(false)}
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
    headerOverride: {
      backgroundColor: '#1E40AF',
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
      flexDirection: 'row',
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
