import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useLanguage } from '../context/LanguageContext';

interface AnimatedNavbarLogoProps {
  isRTL?: boolean;
}

const AnimatedNavbarLogo: React.FC<AnimatedNavbarLogoProps> = () => {
  const { t } = useTranslation();
  const { theme, spacing } = useTheme();
  const { typography } = useTypography();
  const { isRTL } = useLanguage();

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
    <Animated.View style={[styles.container, logoStyle]}>
      <Ionicons name="home-sharp" size={24} color="#FFF" />
      <Text style={[styles.brandName, { marginLeft: 8 }]}>{t('common.brand_name')}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
});

export default React.memo(AnimatedNavbarLogo);
