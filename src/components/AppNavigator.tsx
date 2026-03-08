import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';

const RootStack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
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
        <RootStack.Screen name="MainTabs" component={TabNavigator} />
      ) : (
        <RootStack.Group>
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
        </RootStack.Group>
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;
