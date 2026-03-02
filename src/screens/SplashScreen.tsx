import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';

interface SplashScreenProps {
  onFinish: (isAuthenticated: boolean) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { isLoading, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const { typography, fontWeight} = useTypography();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        onFinish(isAuthenticated);
      }, 800); // Reduced to 3s for better UX while keeping it visible

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, onFinish]);

  const currentStyles = styles(theme, typography, fontWeight);

  return (
    <View style={currentStyles.container}>
      {/* 1. Full-screen Background Image */}
      <Image
        source={require('../../assets/splash-bg-default.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* 2. Centered Logo Overlay */}
      <View style={currentStyles.logoOverlayContainer}>
        <Image
          source={require('../../assets/splash-logo.png')}
          style={currentStyles.logo}
          resizeMode="contain"
        />
      </View>

      {/* 3. Loading Indicator & Info */}
      <View style={currentStyles.content}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={currentStyles.loader} />
        <Text style={currentStyles.loadingText}> Loading...</Text>
      </View>

      {/* 4. Optional: Re-add footer if needed, but keeping it clean for now */}
    </View>
  );
};

const styles = (theme: any, typography: any, fontWeight: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoOverlayContainer: {
      width: '150%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    logo: {
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
    },
    content: {
      position: 'absolute',
      bottom: 100,
      alignItems: 'center',
    },
    loader: {
      marginVertical: 15,
    },
    loadingText: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      ...fontWeight('600'),
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: 'hidden',
    },
  });

export default SplashScreen;
