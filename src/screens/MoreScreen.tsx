import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
  color?: string;
  isSwitch?: boolean;
}

const MoreScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Profile editing functionality will be implemented here.',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      'Settings',
      'Settings functionality will be implemented here.',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Help and support functionality will be implemented here.',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About ElBooklets',
      'ElBooklets Mobile App\nVersion 1.0.0\n\nYour digital learning companion for interactive education.',
      [{ text: 'OK' }]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: '👤',
      action: handleEditProfile,
    },
    {
      id: 'theme',
      title: 'Dark Mode',
      subtitle: isDark ? 'Switch to light mode' : 'Switch to dark mode',
      icon: isDark ? '🌙' : '☀️',
      action: () => {}, // Handled by switch
      isSwitch: true,
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and notifications',
      icon: '⚙️',
      action: handleSettings,
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: '❓',
      action: handleHelp,
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App information and version',
      icon: 'ℹ️',
      action: handleAbout,
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      icon: '🚪',
      action: handleLogout,
      color: '#F44336',
    },
  ];

  return (
    <View style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <Text style={styles(theme).headerTitle}>More</Text>
        <Text style={styles(theme).headerSubtitle}>Account and app settings</Text>
      </View>

      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={styles(theme).userCard}>
          <View style={styles(theme).userAvatar}>
            <Text style={styles(theme).userAvatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles(theme).userInfo}>
            <Text style={styles(theme).userName}>{user?.name || 'User'}</Text>
            <Text style={styles(theme).userEmail}>{user?.email || 'No email'}</Text>
            <Text style={styles(theme).userGrade}>
              Grade: {user?.grade?.name || 'Not specified'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles(theme).menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles(theme).menuItem,
                index === menuItems.length - 1 && styles(theme).lastMenuItem
              ]}
              onPress={item.isSwitch ? undefined : item.action}
              disabled={item.isSwitch}
            >
              <View style={styles(theme).menuItemLeft}>
                <Text style={styles(theme).menuIcon}>{item.icon}</Text>
                <View style={styles(theme).menuTextContainer}>
                  <Text 
                    style={[
                      styles(theme).menuTitle,
                      item.id === 'logout' && styles(theme).menuTitleLogout
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles(theme).menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              {item.isSwitch ? (
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#767577', true: theme.colors.primary }}
                  thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
                />
              ) : (
                <Text style={styles(theme).menuArrow}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* App Version */}
        <View style={styles(theme).versionContainer}>
          <Text style={styles(theme).versionText}>ElBooklets v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
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
    flexDirection: 'row',
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
    marginRight: 16,
    backgroundColor: theme.colors.avatarBackground,
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.avatarText,
  },
  userInfo: {
    flex: 1,
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
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  menuTextContainer: {
    flex: 1,
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
