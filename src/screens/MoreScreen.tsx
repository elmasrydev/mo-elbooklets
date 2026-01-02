import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
  color?: string;
  isSwitch?: boolean;
  isLanguageSelector?: boolean;
}

const MoreScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
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

  const currentStyles = styles(theme, isRTL);

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
                onPress={item.isSwitch || item.isLanguageSelector ? undefined : item.action}
                disabled={item.isSwitch || item.isLanguageSelector}
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
                ) : item.isLanguageSelector ? null : (
                  <Text style={currentStyles.menuArrow}>{isRTL ? '‹' : '›'}</Text>
                )}
              </TouchableOpacity>
              {item.isLanguageSelector && renderLanguageSelector()}
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

const styles = (theme: any, isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
    color: theme.colors.headerSubtitle,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    padding: 20,
    borderRadius: 16,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isRTL ? 0 : 16,
    marginLeft: isRTL ? 16 : 0,
    backgroundColor: theme.colors.avatarBackground,
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.avatarText,
  },
  userInfo: {
    flex: 1,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
    color: theme.colors.textSecondary,
  },
  userGrade: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  menuSection: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
    fontSize: 24,
    marginRight: isRTL ? 0 : 16,
    marginLeft: isRTL ? 16 : 0,
    width: 32,
    textAlign: 'center',
  },
  menuTextContainer: {
    flex: 1,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: theme.colors.text,
  },
  menuTitleLogout: {
    color: theme.colors.logoutColor,
  },
  menuSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  menuArrow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textTertiary,
  },
  languageSelectorContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  languageOption: {
    flex: 1,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight || theme.colors.background,
  },
  languageOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  languageOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
});

export default MoreScreen;
