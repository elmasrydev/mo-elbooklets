import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';

type AppState = 'splash' | 'auth' | 'main';
type AuthState = 'login' | 'register';

const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const [appState, setAppState] = useState<AppState>('splash');
  const [authState, setAuthState] = useState<AuthState>('login');

  const handleSplashFinish = (authenticated: boolean) => {
    setAppState(authenticated ? 'main' : 'auth');
  };

  // Show splash screen while loading or during initial state
  if (isLoading || appState === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // If user is authenticated, show main app
  if (isAuthenticated) {
    return <TabNavigator />;
  }

  // Show authentication screens
  return authState === 'login' ? (
    <LoginScreen onNavigateToRegister={() => setAuthState('register')} />
  ) : (
    <RegisterScreen onNavigateToLogin={() => setAuthState('login')} />
  );
};

export default AppNavigator;
