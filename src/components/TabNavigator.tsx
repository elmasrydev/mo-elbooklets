import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { I18nManager, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import HomeScreen from '../screens/HomeScreen';
import StudyScreen from '../screens/StudyScreen';
import QuizScreen from '../screens/QuizScreen';
import SocialScreen from '../screens/SocialScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import MoreScreen from '../screens/MoreScreen';
import StudyCalendarScreen from '../screens/StudyCalendarScreen';
import StudyChaptersScreen from '../screens/study/StudyChaptersScreen';
import StudyLessonScreen from '../screens/study/StudyLessonScreen';
import QuizTakingScreen from '../screens/quiz/QuizTakingScreen';
import QuizReviewScreen from '../screens/quiz/QuizReviewScreen';
import QuizResultsScreen from '../screens/quiz/QuizResultsScreen';
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
    style={{ marginBottom: 5 }}
    name={focused ? name : (`${name}-outline` as any)}
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
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { typography, fontWeight} = useTypography();

  // Debugging Order
  useEffect(() => {
    console.log(`TabNavigator Render: lang=${language}, isRTL=${isRTL}`);
  }, [language, isRTL]);

  // Define tabs in LTR order (Home -> More)
  const tabs: TabConfig[] = [
    { name: 'Home', component: HomeScreen, labelKey: 'common.home', icon: 'home' },
    { name: 'Study', component: StudyScreen, labelKey: 'common.study', icon: 'grid' },
    { name: 'Quiz', component: QuizScreen, labelKey: 'common.quiz', icon: 'help-circle' },
    { name: 'More', component: MoreScreen, labelKey: 'common.more', icon: 'ellipsis-horizontal' },
  ];

  // Hybrid tab ordering:
  // In production, I18nManager.isRTL matches isRTL → no reversal needed.
  // In dev mode, there may be a mismatch after language switch
  // (DevSettings.reload only reloads JS, not the native Activity).
  // When mismatched, we reverse tabs so they appear in the correct visual order.
  const isMismatch = isRTL !== I18nManager.isRTL;
  const orderedTabs = isMismatch ? [...tabs].reverse() : tabs;

  // Calculate tab bar height with safe area
  const tabBarHeight = 54 + Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <Tab.Navigator
      key={isRTL ? 'rtl' : 'ltr'} // Force re-mount on direction change
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
        },
        tabBarLabelStyle: {
          ...typography('caption'),
          fontSize: 12, // Keeping the smaller size for tabs
          ...fontWeight('600'),
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
      <Stack.Screen name="Social" component={SocialScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="StudyCalendar" component={StudyCalendarScreen} />
      <Stack.Screen
        name="StudyChapters"
        component={StudyChaptersScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="StudyLesson"
        component={StudyLessonScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="QuizTaking"
        component={QuizTakingScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen name="QuizResults" component={QuizResultsScreen as any} options={{}} />
      <Stack.Screen
        name="QuizReview"
        component={QuizReviewScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

export default TabNavigator;
