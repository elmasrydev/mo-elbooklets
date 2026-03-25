import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { I18nManager, Platform, Image, ImageSourcePropType, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import HomeScreen from '../screens/HomeScreen';
import StudyScreen from '../screens/StudyScreen';
import QuizScreen from '../screens/QuizScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SocialScreen from '../screens/SocialScreen';
import StudyCalendarScreen from '../screens/StudyCalendarScreen';
import StudyChaptersScreen from '../screens/study/StudyChaptersScreen';
import StudyLessonScreen from '../screens/study/StudyLessonScreen';
import QuizTakingScreen from '../screens/quiz/QuizTakingScreen';
import QuizReviewScreen from '../screens/quiz/QuizReviewScreen';
import QuizResultsScreen from '../screens/quiz/QuizResultsScreen';
import QuizSubjectsScreen from '../screens/quiz/QuizSubjectsScreen';
import QuizLessonsScreen from '../screens/quiz/QuizLessonsScreen';
import QuizSettingsScreen from '../screens/quiz/QuizSettingsScreen';
import { useTranslation } from 'react-i18next';
import FAQScreen from '../screens/FAQScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

interface TabIconProps {
  color: string;
  focused: boolean;
  name?: keyof typeof Ionicons.glyphMap;
  customIcon?: ImageSourcePropType;
}

const TabIcon: React.FC<TabIconProps> = ({ color, focused, name, customIcon }) => {
  if (customIcon) {
    return (
      <Image
        source={customIcon}
        style={{
          width: 26,
          height: 26,
          marginBottom: 5,
          tintColor: color, // applies active/inactive color over the image
          resizeMode: 'center',
        }}
      />
    );
  }
  return (
    <Ionicons
      style={{ marginBottom: 5 }}
      name={focused ? name : (`${name}-outline` as any)}
      size={24}
      color={color}
    />
  );
};

interface TabConfig {
  name: string;
  component: React.ComponentType<any>;
  labelKey: string;
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: ImageSourcePropType;
}

const TabScreens: React.FC = () => {
  const { theme } = useTheme();
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { typography, fontWeight } = useTypography();

  // Define tabs in LTR order (Home -> Profile) — Stitch design layout
  const tabs: TabConfig[] = [
    {
      name: 'Home',
      component: HomeScreen,
      labelKey: 'common.home',
      customIcon: require('../../assets/images/homeTab.png'),
    },
    {
      name: 'Study',
      component: StudyScreen,
      labelKey: 'common.study',
      customIcon: require('../../assets/images/studyTab.png'),
    },
    {
      name: 'Quiz',
      component: QuizScreen,
      labelKey: 'common.quiz',
      customIcon: require('../../assets/images/quizTab.png'),
    },
    {
      name: 'Community',
      component: SocialScreen,
      labelKey: 'common.community',
      customIcon: require('../../assets/images/communityTab.png'),
    },
    {
      name: 'Profile',
      component: ProfileScreen,
      labelKey: 'common.profile',
      customIcon: require('../../assets/images/profileTab.png'),
    },
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
        tabBarInactiveTintColor: theme.colors.textTertiary || '#94A3B8',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 5),
          paddingTop: 5,
          height: tabBarHeight,
        },
      }}
    >
      {orderedTabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text
                style={[
                  typography('caption'),
                  {
                    color,
                    fontSize: 10,
                    marginTop: -5,
                  },
                  fontWeight('700'),
                ]}
              >
                {t(tab.labelKey)}
              </Text>
            ),
            tabBarIcon: (props) => (
              <TabIcon {...props} name={tab.icon} customIcon={tab.customIcon} />
            ),
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
      <Stack.Screen name="Social" component={require('../screens/SocialScreen').default} />
      <Stack.Screen
        name="Leaderboard"
        component={require('../screens/LeaderboardScreen').default}
      />
      <Stack.Screen name="StudyCalendar" component={StudyCalendarScreen} />
      <Stack.Screen name="StudyChapters" component={StudyChaptersScreen} options={{}} />
      <Stack.Screen
        name="StudyLesson"
        component={StudyLessonScreen}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen name="QuizTaking" component={QuizTakingScreen} options={{}} />
      <Stack.Screen name="QuizResults" component={QuizResultsScreen as any} options={{}} />
      <Stack.Screen name="QuizReview" component={QuizReviewScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="FAQs" component={FAQScreen} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
        <Stack.Screen name="QuizFlowSubjects" component={QuizSubjectsScreen} />
        <Stack.Screen name="QuizFlowLessons" component={QuizLessonsScreen} />
        <Stack.Screen name="QuizFlowSettings" component={QuizSettingsScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default TabNavigator;
