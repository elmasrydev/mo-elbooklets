import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';

import OnboardingScreen from '../screens/OnboardingScreen';

type AppState = 'splash' | 'onboarding' | 'auth' | 'main';
type AuthState = 'login' | 'register';

const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const [appState, setAppState] = useState<AppState>('splash');
  const [authState, setAuthState] = useState<AuthState>('login');

  const handleSplashFinish = (authenticated: boolean) => {
    setAppState(authenticated ? 'main' : 'onboarding');
  };

  const handleOnboardingGetStarted = () => {
    setAuthState('register');
    setAppState('auth');
  };

  const handleOnboardingLogin = () => {
    setAuthState('login');
    setAppState('auth');
  };

  // Show splash screen while loading or during initial state
  if (isLoading || appState === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // If user is authenticated, show main app
  if (isAuthenticated) {
    return <TabNavigator />;
  }

  // Show onboarding screen
  if (appState === 'onboarding') {
    return (
      <OnboardingScreen
        onGetStarted={handleOnboardingGetStarted}
        onLogin={handleOnboardingLogin}
      />
    );
  }

  // Show authentication screens
  return authState === 'login' ? (
    <LoginScreen
      onNavigateToRegister={() => setAuthState('register')}
      onBack={() => setAppState('onboarding')}
    />
  ) : (
    <RegisterScreen
      onNavigateToLogin={() => setAuthState('login')}
      onBack={() => setAppState('onboarding')}
    />
  );
};

export default AppNavigator;
