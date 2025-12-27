import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import QuizScreen from '../screens/QuizScreen';
import SocialScreen from '../screens/SocialScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createBottomTabNavigator();

const TabNavigator: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 26 : 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 26 : 24, color }}>🧠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 26 : 24, color }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 26 : 24, color }}>🏆</Text>
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 26 : 24, color }}>⋯</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
