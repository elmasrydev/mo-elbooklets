import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

interface AnimatedNavbarLogoProps {
  isRTL?: boolean;
}

const LOGO_WIDTH = 148;
const LOGO_HEIGHT = 40;

const AnimatedNavbarLogo: React.FC<AnimatedNavbarLogoProps> = () => {
  // Logo animation values
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    // Zoom in with spring effect and fade in
    logoScale.value = withDelay(100, withSpring(1, { damping: 18, stiffness: 80 }));
    logoOpacity.value = withDelay(100, withSpring(1));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/homeLogo.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    minWidth: 150,
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
});

export default React.memo(AnimatedNavbarLogo);
