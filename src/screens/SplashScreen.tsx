import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SplashScreenProps {
  onFinish: (isAuthenticated: boolean) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { isLoading, isAuthenticated } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      // Add a small delay for better UX
      const timer = setTimeout(() => {
        onFinish(isAuthenticated);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, onFinish]);

  const currentStyles = styles(theme);

  return (
    <View style={currentStyles.container}>
      <View style={currentStyles.content}>
        {/* App Logo/Icon */}
        <View style={currentStyles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={currentStyles.logo}
            resizeMode="contain"
          />
          <Text style={currentStyles.appName}>ElBooklets</Text>
        </View>
        
        {/* Loading indicator */}
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary} 
          style={currentStyles.loader}
        />
        
        <Text style={currentStyles.loadingText}>Loading...</Text>
      </View>
      
      {/* Footer */}
      <View style={currentStyles.footer}>
        <Text style={currentStyles.footerText}>Welcome to ElBooklets Hub</Text>
      </View>
    </View>
  );
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary100, // Dynamic light theme color
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  loader: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 10,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 50,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default SplashScreen;
