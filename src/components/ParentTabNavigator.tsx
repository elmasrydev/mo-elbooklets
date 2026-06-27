import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { I18nManager, Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import ParentDashboardScreen from '../screens/ParentDashboardScreen';
import ParentRequestsScreen from '../screens/ParentRequestsScreen';
import ParentSettingsScreen from '../screens/ParentSettingsScreen';
import ChildDetailsScreen from '../screens/ChildDetailsScreen';
import {
  ParentDashboardProvider,
  useParentDashboardContext,
} from '../context/ParentDashboardContext';
import AddChildModal from './AddChildModal';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// The "Add Child" tab never renders a screen — tapping it opens the shared modal.
const AddChildPlaceholder: React.FC = () => null;

interface ParentTabConfig {
  name: string;
  component: React.ComponentType<any>;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  testID: string;
  isModalTrigger?: boolean;
}

const ParentTabScreens: React.FC = () => {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { typography, fontWeight } = useTypography();
  const { openAddModal } = useParentDashboardContext();

  // Defined in LTR order — matches the design's bottom nav (Dashboard → Settings).
  const tabs: ParentTabConfig[] = [
    {
      name: 'ParentDashboard',
      component: ParentDashboardScreen,
      labelKey: 'parent_dashboard.tab_dashboard',
      icon: 'home',
      testID: 'parent-tab-dashboard',
    },
    {
      name: 'ParentRequests',
      component: ParentRequestsScreen,
      labelKey: 'parent_dashboard.tab_requests',
      icon: 'link',
      testID: 'parent-tab-requests',
    },
    {
      name: 'ParentAddChild',
      component: AddChildPlaceholder,
      labelKey: 'parent_dashboard.tab_add_child',
      icon: 'person-add',
      testID: 'parent-tab-add-child',
      isModalTrigger: true,
    },
    {
      name: 'ParentSettings',
      component: ParentSettingsScreen,
      labelKey: 'parent_dashboard.tab_settings',
      icon: 'settings',
      testID: 'parent-tab-settings',
    },
  ];

  // Match the student TabNavigator: in dev a JS-only reload can leave isRTL and the
  // native I18nManager.isRTL out of sync, so reverse the visual order when they differ.
  const isMismatch = isRTL !== I18nManager.isRTL;
  const orderedTabs = isMismatch ? [...tabs].reverse() : tabs;

  const tabBarHeight = 54 + Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <Tab.Navigator
      key={isRTL ? 'rtl' : 'ltr'}
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
          listeners={
            tab.isModalTrigger
              ? {
                  tabPress: (e) => {
                    e.preventDefault();
                    openAddModal();
                  },
                }
              : undefined
          }
          options={{
            tabBarAccessibilityLabel: tab.testID,
            tabBarButtonTestID: tab.testID,
            tabBarLabel: ({ color }) => (
              <Text
                style={[
                  typography('caption'),
                  { color, fontSize: 10, marginTop: -5 },
                  fontWeight('700'),
                ]}
              >
                {t(tab.labelKey)}
              </Text>
            ),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                style={{ marginBottom: 5 }}
                name={
                  focused ? tab.icon : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap)
                }
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

const ParentTabNavigator: React.FC = () => {
  return (
    <ParentDashboardProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ParentMainTabs" component={ParentTabScreens} />
        <Stack.Screen name="ChildDetailsScreen" component={ChildDetailsScreen} />
        <Stack.Screen
          name="InternalSettings"
          component={require('../screens/InternalSettingsScreen').default}
        />
        <Stack.Screen
          name="Notifications"
          component={require('../screens/NotificationsScreen').default}
        />
        <Stack.Screen name="FAQs" component={require('../screens/FAQScreen').default} />
        <Stack.Screen name="ContactUs" component={require('../screens/ContactUsScreen').default} />
      </Stack.Navigator>
      <AddChildModal />
    </ParentDashboardProvider>
  );
};

export default ParentTabNavigator;
