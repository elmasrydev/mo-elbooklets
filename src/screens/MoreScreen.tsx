import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { layout } from '../config/layout';
import ColorThemePicker from '../components/ColorThemePicker';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';

const MoreScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark, fontSizes, spacing, borderRadius } = useTheme();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography } = useTypography();

  const handleLogout = () => {
    Alert.alert(t('more_screen.logout'), t('more_screen.logout_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('more_screen.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    {
      id: 'profile',
      title: t('more_screen.edit_profile'),
      subtitle: t('more_screen.update_profile_info'),
      icon: 'person-outline',
      iconColor: theme.colors.primary,
      iconBg: theme.colors.primary + '1A',
      action: () => {},
    },
    {
      id: 'language',
      title: t('more_screen.language'),
      subtitle: t('more_screen.choose_language'),
      icon: 'language-outline',
      iconColor: theme.colors.success,
      iconBg: theme.colors.success + '1A',
      isLanguageSelector: true,
    },
    {
      id: 'theme',
      title: t('more_screen.dark_mode'),
      subtitle: t('more_screen.switch_dark'),
      icon: 'moon-outline',
      iconColor: theme.colors.primary,
      iconBg: theme.colors.primary + '1A',
      isSwitch: true,
    },
    {
      id: 'color_theme',
      title: t('more_screen.color_theme'),
      subtitle: t('more_screen.choose_app_color'),
      icon: 'color-palette-outline',
      iconColor: theme.colors.orange,
      iconBg: theme.colors.orange + '1A',
      isColorThemePicker: true,
    },
    {
      id: 'help',
      title: t('more_screen.help_support'),
      subtitle: t('more_screen.get_assistance'),
      icon: 'help-circle-outline',
      iconColor: theme.colors.info,
      iconBg: theme.colors.info + '1A',
      action: () => {},
    },
    {
      id: 'logout',
      title: t('more_screen.logout'),
      icon: 'log-out-outline',
      iconColor: theme.colors.error,
      iconBg: theme.colors.error + '1A',
      action: handleLogout,
      isDestructive: true,
    },
  ];

  const currentStyles = styles(theme, fontSizes, spacing, borderRadius, common, isRTL, typography);

  return (
    <View style={currentStyles.container}>
      <UnifiedHeader title={t('more_screen.header_title')} />

      <ScrollView
        style={currentStyles.scrollView}
        contentContainerStyle={currentStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.userCard}>
          <View style={currentStyles.userAvatar}>
            <Text style={currentStyles.userAvatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={currentStyles.userInfo}>
            <Text style={currentStyles.userName}> {user?.name || 'User'}</Text>
            <Text style={currentStyles.userEmail}> {user?.email || 'No email'}</Text>
            <View style={currentStyles.userGradeContainer}>
              <Text style={currentStyles.userGrade}>
                {t('more_screen.grade')}: {user?.grade?.name || t('more_screen.not_specified')}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={currentStyles.editButton}>
            <Ionicons name="pencil" size={spacing.icon.sm} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={currentStyles.menuSection}>
          {menuItems
            .filter((item) => item.id !== 'color_theme')
            .map((item, index, filteredItems) => {
              const isLast = index === filteredItems.length - 1;
              return (
                <View key={item.id}>
                  <TouchableOpacity
                    style={[
                      currentStyles.menuItem,
                      isLast &&
                        !item.isLanguageSelector &&
                        !item.isColorThemePicker &&
                        currentStyles.lastMenuItem,
                    ]}
                    onPress={item.action}
                    disabled={
                      !!item.isSwitch || !!item.isLanguageSelector || !!item.isColorThemePicker
                    }
                    activeOpacity={0.7}
                  >
                    <View style={currentStyles.menuItemContent}>
                      <View
                        style={[currentStyles.menuIconContainer, { backgroundColor: item.iconBg }]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={spacing.icon.md}
                          color={item.iconColor}
                        />
                      </View>
                      <View style={currentStyles.menuTextContainer}>
                        <Text
                          style={[
                            currentStyles.menuTitle,
                            item.isDestructive && { color: item.iconColor },
                          ]}
                        >
                          {item.title}
                        </Text>
                        {item.subtitle && !item.isLanguageSelector && !item.isColorThemePicker && (
                          <Text style={currentStyles.menuSubtitle}> {item.subtitle} </Text>
                        )}
                      </View>
                    </View>

                    {item.isSwitch ? (
                      <View style={common.marginStart(spacing.md)}>
                        <Switch
                          value={isDark}
                          onValueChange={toggleTheme}
                          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                          thumbColor={theme.colors.textOnDark}
                        />
                      </View>
                    ) : item.isLanguageSelector || item.isColorThemePicker ? null : (
                      <Ionicons
                        name={isRTL ? 'chevron-back' : 'chevron-forward'}
                        size={spacing.icon.sm}
                        color={theme.colors.textTertiary}
                      />
                    )}
                  </TouchableOpacity>

                  {item.isLanguageSelector && (
                    <View style={currentStyles.languageSelector}>
                      <TouchableOpacity
                        style={[
                          currentStyles.langOption,
                          language === 'ar' && currentStyles.langSelected,
                        ]}
                        onPress={() => setLanguage('ar')}
                      >
                        <Text
                          style={[
                            currentStyles.langText,
                            language === 'ar' && currentStyles.langTextSelected,
                          ]}
                        >
                          العربية
                        </Text>
                        {language === 'ar' && (
                          <Ionicons
                            name="checkmark-circle"
                            size={spacing.icon.sm}
                            color={theme.colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          currentStyles.langOption,
                          language === 'en' && currentStyles.langSelected,
                        ]}
                        onPress={() => setLanguage('en')}
                      >
                        <Text
                          style={[
                            currentStyles.langText,
                            language === 'en' && currentStyles.langTextSelected,
                          ]}
                        >
                          English
                        </Text>
                        {language === 'en' && (
                          <Ionicons
                            name="checkmark-circle"
                            size={spacing.icon.sm}
                            color={theme.colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {item.isColorThemePicker && (
                    <View style={currentStyles.colorPickerContainer}>
                      <ColorThemePicker />
                    </View>
                  )}

                  {!isLast && <View style={currentStyles.separator} />}
                </View>
              );
            })}
        </View>

        <View style={currentStyles.versionContainer}>
          <Text style={currentStyles.versionText}> ElBooklets {t('common.version')} 1.0.0 </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (
  theme: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  common: any,
  isRTL: boolean,
  typography: any,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: layout.screenPadding,
      alignItems: 'stretch',
    },
    userCard: {
      padding: spacing.ssm,
      borderRadius: borderRadius.xl,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      marginBottom: spacing.sectionGap,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    userAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      ...common.marginEnd(spacing.ssm),
    },
    userAvatarText: { ...typography('h2'), fontWeight: 'bold', color: theme.colors.textOnDark },
    userInfo: { flex: 1, alignItems: common.alignStart },
    userName: {
      ...typography('h3'),
      fontWeight: 'bold',
      marginBottom: spacing.xxs,
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    userEmail: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    userGradeContainer: {
      marginTop: spacing.sm,
      backgroundColor: theme.colors.primary + '1A',
      paddingHorizontal: spacing.ssm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    userGrade: {
      ...typography('caption'),
      fontWeight: '600',
      color: theme.colors.primary,
      textAlign: common.textAlign,
    },
    editButton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    menuSection: {
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      ...layout.shadow,
    },
    menuItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.ssm,
    },
    lastMenuItem: { borderBottomWidth: 0 },
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
      ...common.marginStart(spacing.xl + spacing.md),
    },
    menuItemContent: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      flex: 1,
    },
    menuIconContainer: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.ssm),
    },
    menuTextContainer: { flex: 1, alignItems: common.alignStart },
    menuTitle: {
      ...typography('bodySmall'),
      fontWeight: '500',
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    menuSubtitle: {
      ...typography('label'),
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: common.textAlign,
    },
    languageSelector: {
      flexDirection: common.rowDirection,
      padding: spacing.md,
      paddingTop: 0,
      gap: spacing.md,
    },
    langOption: {
      flex: 1,
      flexDirection: common.rowDirection,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: spacing.xs,
    },
    langSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '1A',
    },
    langText: { ...typography('label'), color: theme.colors.text, fontWeight: '500' },
    langTextSelected: { color: theme.colors.primary, fontWeight: '700' },
    colorPickerContainer: {
      padding: spacing.md,
      paddingTop: 0,
    },
    versionContainer: {
      alignItems: 'center',
      marginTop: spacing['3xl'],
      marginBottom: Math.max(common.insets.bottom, spacing.xl),
    },
    versionText: { ...typography('caption'), color: theme.colors.textTertiary, opacity: 0.7 },
  });

export default MoreScreen;
