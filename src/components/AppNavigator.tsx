import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import ParentLoginScreen from '../screens/ParentLoginScreen';
import ParentRegisterScreen from '../screens/ParentRegisterScreen';
import ParentForgotPasswordScreen from '../screens/ParentForgotPasswordScreen';
import ParentDashboardScreen from '../screens/ParentDashboardScreen';
import ParentSettingsScreen from '../screens/ParentSettingsScreen';
import InternalSettingsScreen from '../screens/InternalSettingsScreen';

const RootStack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated, userRole } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = (authenticated: boolean) => {
    setShowSplash(false);
  };

  // Show splash screen while loading or during initial delay
  if (isLoading || showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        userRole === 'parent' ? (
          <RootStack.Group>
            <RootStack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
            <RootStack.Screen name="ParentSettings" component={ParentSettingsScreen} />
            <RootStack.Screen name="InternalSettings" component={InternalSettingsScreen} />
            <RootStack.Screen name="FAQs" component={require('../screens/FAQScreen').default} />
            <RootStack.Screen name="ContactUs" component={require('../screens/ContactUsScreen').default} />
          </RootStack.Group>
        ) : (
          <RootStack.Group>
            <RootStack.Screen name="MainTabs" component={TabNavigator} />
            <RootStack.Screen name="InternalSettings" component={InternalSettingsScreen} />
          </RootStack.Group>
        )
      ) : (
        <RootStack.Group>
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
          <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <RootStack.Screen name="ParentLogin" component={ParentLoginScreen} />
          <RootStack.Screen name="ParentRegister" component={ParentRegisterScreen} />
          <RootStack.Screen name="ParentForgotPassword" component={ParentForgotPasswordScreen} />
        </RootStack.Group>
      )}
    </RootStack.Navigator>
  );
};


export default AppNavigator;
