import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, I18nManager, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import HomeScreen from '../screens/HomeScreen';
import QuizScreen from '../screens/QuizScreen';
import SocialScreen from '../screens/SocialScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import MoreScreen from '../screens/MoreScreen';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  color: string;
  focused: boolean;
  icon: string;
}

const TabIcon: React.FC<TabIconProps> = ({ color, focused, icon }) => (
  <Text style={{ fontSize: focused ? 26 : 24, color }}>{icon}</Text>
);

interface TabConfig {
  name: string;
  component: React.ComponentType<any>;
  labelKey: string;
  icon: string;
}

const TabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Define tabs in LTR order
  const tabs: TabConfig[] = [
    { name: 'Home', component: HomeScreen, labelKey: 'common.home', icon: '🏠' },
    { name: 'Quiz', component: QuizScreen, labelKey: 'common.quiz', icon: '📝' },
    { name: 'Social', component: SocialScreen, labelKey: 'common.social', icon: '👥' },
    { name: 'Leaderboard', component: LeaderboardScreen, labelKey: 'common.leaderboard', icon: '🏆' },
    { name: 'More', component: MoreScreen, labelKey: 'common.more', icon: '⚙️' },
  ];

  // Reverse order for RTL
  const orderedTabs = isRTL || I18nManager.isRTL ? [...tabs].reverse() : tabs;
  
  // Calculate tab bar height with safe area
  const tabBarHeight = 60 + Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 0);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 5),
          paddingTop: 5,
          height: tabBarHeight,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {orderedTabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: t(tab.labelKey),
            tabBarIcon: (props) => <TabIcon {...props} icon={tab.icon} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default TabNavigator;
