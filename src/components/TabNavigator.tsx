import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { I18nManager, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import HomeScreen from '../screens/HomeScreen';
import StudyScreen from '../screens/StudyScreen';
import QuizScreen from '../screens/QuizScreen';
import SocialScreen from '../screens/SocialScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import MoreScreen from '../screens/MoreScreen';
import StudyCalendarScreen from '../screens/StudyCalendarScreen';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

interface TabIconProps {
  color: string;
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
}

const TabIcon: React.FC<TabIconProps> = ({ color, focused, name }) => (
  <Ionicons 
    name={focused ? name : `${name as any}-outline` as any} 
    size={24} 
    color={color} 
  />
);

interface TabConfig {
  name: string;
  component: React.ComponentType<any>;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TabScreens: React.FC = () => {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Define tabs in LTR order
  const tabs: TabConfig[] = [
    { name: 'Home', component: HomeScreen, labelKey: 'common.home', icon: 'home' },
    { name: 'Study', component: StudyScreen, labelKey: 'common.study', icon: 'book' },
    { name: 'Quiz', component: QuizScreen, labelKey: 'common.quiz', icon: 'help-circle' },
    { name: 'Social', component: SocialScreen, labelKey: 'common.social', icon: 'people' },
    { name: 'Leaderboard', component: LeaderboardScreen, labelKey: 'common.leaderboard', icon: 'stats-chart' },
    { name: 'More', component: MoreScreen, labelKey: 'common.more', icon: 'ellipsis-horizontal' },
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
        tabBarInactiveTintColor: theme.colors.textTertiary || 'gray',
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
          marginTop: -5,
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
            tabBarIcon: (props) => <TabIcon {...props} name={tab.icon} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

const TabNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabScreens} />
      <Stack.Screen name="StudyCalendar" component={StudyCalendarScreen} />
    </Stack.Navigator>
  );
};

export default TabNavigator;

