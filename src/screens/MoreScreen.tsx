import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import ColorThemePicker from '../components/ColorThemePicker';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
  color?: string;
  isSwitch?: boolean;
  isLanguageSelector?: boolean;
  isColorThemePicker?: boolean;
}

const MoreScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark, fontSizes, spacing, borderRadius } = useTheme();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();

  const handleEditProfile = () => {
    Alert.alert(
      t('more_screen.edit_profile'),
      t('more_screen.update_profile_info'),
      [{ text: t('common.ok') }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('more_screen.logout_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.logout'), 
          style: 'destructive',
          onPress: () => {
            logout();
          }
        }
      ]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      t('common.settings'),
      t('more_screen.app_preferences'),
      [{ text: t('common.ok') }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      t('common.help'),
      t('more_screen.contact_support'),
      [{ text: t('common.ok') }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      t('more_screen.about_title'),
      t('more_screen.about_content'),
      [{ text: t('common.ok') }]
    );
  };

  const handleLanguageChange = (newLang: 'en' | 'ar') => {
    if (newLang === language) return;
    
    Alert.alert(
      t('common.switch_language'),
      t('common.reload_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.ok'), 
          onPress: () => setLanguage(newLang)
        }
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      title: t('more_screen.edit_profile'),
      subtitle: t('more_screen.update_profile_info'),
      icon: '👤',
      action: handleEditProfile,
    },
    {
      id: 'language',
      title: t('common.language'),
      subtitle: '',
      icon: '🌐',
      action: () => {},
      isLanguageSelector: true,
    },
    {
      id: 'theme',
      title: t('more_screen.dark_mode'),
      subtitle: isDark ? t('more_screen.switch_light') : t('more_screen.switch_dark'),
      icon: isDark ? '🌙' : '☀️',
      action: () => {},
      isSwitch: true,
    },
    {
      id: 'colorTheme',
      title: t('more_screen.color_theme'),
      subtitle: t('more_screen.choose_accent_color'),
      icon: '🎨',
      action: () => {},
      isColorThemePicker: true,
    },
    {
      id: 'settings',
      title: t('common.settings'),
      subtitle: t('more_screen.app_preferences'),
      icon: '⚙️',
      action: handleSettings,
    },
    {
      id: 'help',
      title: t('common.help'),
      subtitle: t('more_screen.contact_support'),
      icon: '❓',
      action: handleHelp,
    },
    {
      id: 'about',
      title: t('common.about'),
      subtitle: t('more_screen.app_info'),
      icon: 'ℹ️',
      action: handleAbout,
    },
    {
      id: 'logout',
      title: t('common.logout'),
      subtitle: t('more_screen.sign_out'),
      icon: '🚪',
      action: handleLogout,
      color: '#F44336',
    },
  ];

  const currentStyles = styles(theme, isRTL, fontSizes, spacing, borderRadius);

  const renderLanguageSelector = () => (
    <View style={currentStyles.languageSelectorContainer}>
      <TouchableOpacity
        style={[
          currentStyles.languageOption,
          language === 'en' && currentStyles.languageOptionSelected
        ]}
        onPress={() => handleLanguageChange('en')}
      >
        <Text style={[
          currentStyles.languageOptionText,
          language === 'en' && currentStyles.languageOptionTextSelected
        ]}>
          English
        </Text>
        {language === 'en' && <Text style={currentStyles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          currentStyles.languageOption,
          language === 'ar' && currentStyles.languageOptionSelected
        ]}
        onPress={() => handleLanguageChange('ar')}
      >
        <Text style={[
          currentStyles.languageOptionText,
          language === 'ar' && currentStyles.languageOptionTextSelected
        ]}>
          العربية
        </Text>
        {language === 'ar' && <Text style={currentStyles.checkmark}>✓</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={currentStyles.container}>
      {/* Header */}
      <View style={currentStyles.header}>
        <Text style={currentStyles.headerTitle}>{t('more_screen.header_title')}</Text>
        <Text style={currentStyles.headerSubtitle}>{t('more_screen.header_subtitle')}</Text>
      </View>

      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={currentStyles.userCard}>
          <View style={currentStyles.userAvatar}>
            <Text style={currentStyles.userAvatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={currentStyles.userInfo}>
            <Text style={currentStyles.userName}>{user?.name || 'User'}</Text>
            <Text style={currentStyles.userEmail}>{user?.email || 'No email'}</Text>
            <Text style={currentStyles.userGrade}>
              {t('more_screen.grade')}: {user?.grade?.name || t('more_screen.not_specified')}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={currentStyles.menuSection}>
          {menuItems.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={[
                  currentStyles.menuItem,
                  index === menuItems.length - 1 && currentStyles.lastMenuItem
                ]}
                onPress={item.isSwitch || item.isLanguageSelector || item.isColorThemePicker ? undefined : item.action}
                disabled={item.isSwitch || item.isLanguageSelector || item.isColorThemePicker}
              >
                <View style={currentStyles.menuItemLeft}>
                  <Text style={currentStyles.menuIcon}>{item.icon}</Text>
                  <View style={currentStyles.menuTextContainer}>
                    <Text 
                      style={[
                        currentStyles.menuTitle,
                        item.id === 'logout' && currentStyles.menuTitleLogout
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text style={currentStyles.menuSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                </View>
                {item.isSwitch ? (
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                    thumbColor="#f4f3f4"
                  />
                ) : item.isLanguageSelector || item.isColorThemePicker ? null : (
                  <Text style={currentStyles.menuArrow}>{isRTL ? '‹' : '›'}</Text>
                )}
              </TouchableOpacity>
              {item.isLanguageSelector && renderLanguageSelector()}
              {item.isColorThemePicker && (
                <View style={currentStyles.colorThemeContainer}>
                  <ColorThemePicker />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* App Version */}
        <View style={currentStyles.versionContainer}>
          <Text style={currentStyles.versionText}>ElBooklets {t('common.version')} 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (theme: any, isRTL: boolean, fontSizes: any, spacing: any, borderRadius: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.xl,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  headerTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  headerSubtitle: {
    fontSize: fontSizes.base,
    opacity: 0.9,
    marginTop: spacing.xs,
    color: theme.colors.headerSubtitle,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  userCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isRTL ? 0 : spacing.lg,
    marginLeft: isRTL ? spacing.lg : 0,
    backgroundColor: theme.colors.avatarBackground,
  },
  userAvatarText: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: theme.colors.avatarText,
  },
  userInfo: {
    flex: 1,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  userName: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: fontSizes.sm,
    marginBottom: 2,
    color: theme.colors.textSecondary,
  },
  userGrade: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  menuSection: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuItem: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: fontSizes.xl,
    marginRight: isRTL ? 0 : spacing.lg,
    marginLeft: isRTL ? spacing.lg : 0,
    width: 32,
    textAlign: 'center',
  },
  menuTextContainer: {
    flex: 1,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  menuTitle: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    marginBottom: 2,
    color: theme.colors.text,
  },
  menuTitleLogout: {
    color: theme.colors.logoutColor,
  },
  menuSubtitle: {
    fontSize: fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  menuArrow: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textTertiary,
  },
  languageSelectorContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingTop: spacing.lg,
  },
  languageOption: {
    flex: 1,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: 4,
    borderRadius: borderRadius.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight || theme.colors.background,
  },
  languageOptionText: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: theme.colors.text,
  },
  languageOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    marginLeft: isRTL ? 0 : spacing.sm,
    marginRight: isRTL ? spacing.sm : 0,
    fontSize: fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  colorThemeContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing.xl,
  },
  versionText: {
    fontSize: fontSizes.xs,
    color: theme.colors.textTertiary,
  },
});

export default MoreScreen;
