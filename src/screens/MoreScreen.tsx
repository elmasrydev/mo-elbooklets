import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import UnifiedHeader from '../components/UnifiedHeader';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
// #TODO: set the correct version
const APP_VERSION = 'EL-Booklets v1.0.0';

const MoreScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, spacing, fontSizes, borderRadius, isDark, toggleTheme } = useTheme();
  const common = useCommonStyles();
  const { isRTL, setLanguage } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();

  const handleLogout = () => {
    Alert.alert(t('profile_screen.log_out'), t('more_screen.logout_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile_screen.log_out'), style: 'destructive', onPress: logout },
    ]);
  };

  const handleLanguagePress = () => {
    Alert.alert(t('profile_screen.choose_language'), t('profile_screen.select_language_msg'), [
      { text: 'English (US)', onPress: () => setLanguage('en') },
      { text: 'العربية', onPress: () => setLanguage('ar') },
      { text: t('common.cancel') || 'Cancel', style: 'cancel' },
    ]);
  };

  const currentStyles = styles(
    theme,
    spacing,
    fontSizes,
    borderRadius,
    common,
    isRTL,
    typography,
    fontWeight,
    isDark,
  );

  return (
    <View style={currentStyles.mainContainer}>
      <UnifiedHeader
        title={t('profile_screen.header_title')}
        style={currentStyles.headerOverride}
      />

      <ScrollView
        style={currentStyles.scrollView}
        contentContainerStyle={{
          padding: layout.screenPadding,
          paddingBottom: Math.max(common.insets.bottom, spacing['2xl']),
        }}
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
            <TouchableOpacity style={currentStyles.editAvatarButton}>
              <Ionicons name="pencil" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={currentStyles.userInfoTextContainer}>
            <Text style={currentStyles.userName}>{user?.name || 'User'}</Text>
            <Text style={currentStyles.userSubtitle}>
              {user?.grade?.name || t('profile_screen.not_specified')}{' '}
              {user?.grade?.name ? `• International` : ''}
            </Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={currentStyles.menuSection}>
          {/* Edit Profile */}
          <TouchableOpacity style={currentStyles.settingItem}>
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

          {/* Badges */}
          <TouchableOpacity style={currentStyles.settingItem}>
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

          {/* Help and Support */}
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
    headerOverride: {
      backgroundColor: '#1E40AF', // Enforce specific blue from HTML design
      borderBottomWidth: 0,
    },
    scrollView: {
      flex: 1,
    },
    profileSection: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      marginBottom: spacing.md,
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
      ...fontWeight('500'),
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
      alignItems: common.alignStart,
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
    versionText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing['2xl'],
    },
  });

export default MoreScreen;
