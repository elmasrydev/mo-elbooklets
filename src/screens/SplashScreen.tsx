import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_WIDTH = SCREEN_WIDTH * 0.8;
const LOGO_ASPECT_RATIO = 768 / 1376; // splash-logo.png native ratio
const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT_RATIO;

interface SplashScreenProps {
  onFinish: (isAuthenticated: boolean) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        onFinish(isAuthenticated);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, onFinish]);

  return (
    <View style={styles.container}>
      {/* Full-screen background */}
      <Image
        source={require('../../assets/new-splash-bg.png')}
        style={styles.background}
        resizeMode="cover"
      />

      {/* Centered splash logo */}
      <Image
        source={require('../../assets/splash-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Loading indicator at the bottom */}
      <ActivityIndicator size="large" color="#1E3A8A" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  loader: {
    position: 'absolute',
    bottom: 80,
  },
});

export default SplashScreen;
