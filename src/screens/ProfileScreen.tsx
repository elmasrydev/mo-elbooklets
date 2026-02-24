import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import UnifiedHeader from '../components/UnifiedHeader';
import AppButton from '../components/AppButton';
import { useTranslation } from 'react-i18next';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, spacing, fontSizes, borderRadius } = useTheme();
  const common = useCommonStyles();
  const { isRTL } = useLanguage();
  const { typography } = useTypography();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
  };

  const currentStyles = styles(theme, spacing, fontSizes, borderRadius, common, isRTL, typography);

  return (
    <View style={common.container}>
      {/* Standardized Header */}
      <UnifiedHeader
        title={t('profile_screen.header_title')}
        subtitle={t('profile_screen.header_subtitle')}
        showBackButton
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: layout.screenPadding,
          paddingBottom: common.insets.bottom + 50,
        }}
      >
        {/* User Info Card */}
        <View style={currentStyles.userCard}>
          <View style={currentStyles.avatar}>
            <Text style={currentStyles.avatarText}> {user?.name?.charAt(0).toUpperCase()} </Text>
          </View>
          <View style={currentStyles.userInfo}>
            <Text style={currentStyles.userName}> {user?.name} </Text>
            <Text style={currentStyles.userEmail}> {user?.email} </Text>
            <Text style={currentStyles.userMobile}> {user?.mobile} </Text>
            <Text style={currentStyles.userGrade}>
              Grade: {user?.grade?.name || 'Not specified'}
            </Text>
          </View>
        </View>

        {/* Settings Options */}
        <View style={currentStyles.settingsSection}>
          <Text style={common.sectionTitle}> Settings </Text>

          <TouchableOpacity style={currentStyles.settingItem}>
            <Text style={currentStyles.settingIcon}>👤</Text>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}> Edit Profile </Text>
              <Text style={currentStyles.settingSubtitle}> Update your personal information </Text>
            </View>
            <Text style={currentStyles.settingArrow}> {isRTL ? '<' : '›'} </Text>
          </TouchableOpacity>

          <TouchableOpacity style={currentStyles.settingItem}>
            <Text style={currentStyles.settingIcon}>🔔</Text>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}> Notifications </Text>
              <Text style={currentStyles.settingSubtitle}>
                Manage your notification preferences
              </Text>
            </View>
            <Text style={currentStyles.settingArrow}> {isRTL ? '<' : '›'} </Text>
          </TouchableOpacity>

          <TouchableOpacity style={currentStyles.settingItem}>
            <Text style={currentStyles.settingIcon}>🔒</Text>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}> Privacy & Security </Text>
              <Text style={currentStyles.settingSubtitle}> Password and privacy settings </Text>
            </View>
            <Text style={currentStyles.settingArrow}> {isRTL ? '<' : '›'} </Text>
          </TouchableOpacity>

          <TouchableOpacity style={currentStyles.settingItem}>
            <Text style={currentStyles.settingIcon}>❓</Text>
            <View style={currentStyles.settingContent}>
              <Text style={currentStyles.settingTitle}> Help & Support </Text>
              <Text style={currentStyles.settingSubtitle}> Get help and contact support </Text>
            </View>
            <Text style={currentStyles.settingArrow}> {isRTL ? '<' : '›'} </Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <AppButton
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          style={currentStyles.logoutButton}
        />
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
) =>
  StyleSheet.create({
    content: {
      flex: 1,
      padding: layout.screenPadding,
    },
    userCard: {
      backgroundColor: theme.colors.card,
      padding: spacing.xl,
      borderRadius: borderRadius.xl,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginBottom: spacing.xl,
      ...layout.shadow,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.lg),
    },
    avatarText: {
      ...typography('h3'),
      fontWeight: 'bold',
      color: '#ffffff',
    },
    userInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    userName: {
      ...typography('h3'),
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
      textAlign: common.textAlign,
    },
    userEmail: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginBottom: 2,
      textAlign: common.textAlign,
    },
    userMobile: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginBottom: 2,
      textAlign: common.textAlign,
    },
    userGrade: {
      ...typography('caption'),
      color: theme.colors.primary,
      fontWeight: '600',
      textAlign: common.textAlign,
    },
    settingsSection: {
      marginBottom: spacing.xl,
    },
    settingItem: {
      backgroundColor: theme.colors.card,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginBottom: spacing.md,
      ...layout.shadow,
    },
    settingIcon: {
      fontSize: 24,
      ...common.marginEnd(spacing.lg),
    },
    settingContent: {
      flex: 1,
      alignItems: common.alignStart,
    },
    settingTitle: {
      ...typography('body'),
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
      textAlign: common.textAlign,
    },
    settingSubtitle: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    settingArrow: {
      fontSize: fontSizes.xl,
      color: theme.colors.textTertiary,
    },
    logoutButton: {
      marginTop: spacing.md,
    },
  });

export default ProfileScreen;
