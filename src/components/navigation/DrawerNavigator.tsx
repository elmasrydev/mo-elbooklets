import React from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTypography } from '../../hooks/useTypography';
import { useProfileCompleteness } from '../../hooks/useProfileCompleteness';
import CircularProgress from '../CircularProgress';
import TabNavigator from '../TabNavigator';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { user } = useAuth();
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { completeness } = useProfileCompleteness();
  const { t } = useTranslation();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.userInfo}>
           <View style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { ...typography('h2'), ...fontWeight('bold'), color: theme.colors.primary }]}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
           </View>
           <View style={styles.userDetails}>
              <Text style={[styles.userName, { ...typography('body'), ...fontWeight('bold'), color: theme.colors.text }]}>
                {user?.name}
              </Text>
              <Text style={[styles.userMobile, { ...typography('caption'), color: theme.colors.textSecondary }]}>
                {user?.mobile}
              </Text>
           </View>
        </View>

        <TouchableOpacity 
          style={[styles.progressCard, { backgroundColor: theme.colors.primary + '0A', borderRadius: borderRadius.lg }]}
          onPress={() => props.navigation.navigate('TabHome', { screen: 'MainTabs', params: { screen: 'Profile' } })}
        >
          <CircularProgress 
             size={60} 
             strokeWidth={6} 
             percentage={completeness?.percentage || 0} 
             color={theme.colors.primary} 
          />
          <View style={styles.progressTextContainer}>
             <Text style={[styles.progressTitle, { ...typography('label'), ...fontWeight('bold'), color: theme.colors.text }]}>
                {t('profile.completeness', 'Profile Completion')}
             </Text>
             <Text style={[styles.progressSubtitle, { ...typography('caption'), color: theme.colors.textSecondary }]}>
                {t('profile.complete_to_unlock', 'Complete your info')}
             </Text>
          </View>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.menuItems}>
         <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
};

const DrawerNavigator = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerStyle: {
          width: '80%',
          backgroundColor: theme.colors.background,
        },
        drawerPosition: isRTL ? 'right' : 'left',
      }}
    >
      <Drawer.Screen 
        name="TabHome" 
        component={TabNavigator} 
        options={{
          drawerLabel: t('common.home', 'Home'),
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    marginBottom: 2,
  },
  userMobile: {
    fontSize: 14,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 14,
  },
  progressSubtitle: {
    fontSize: 12,
  },
  menuItems: {
    flex: 1,
  }
});

export default DrawerNavigator;
