import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';

interface AnimatedNavbarLogoProps {
  isRTL?: boolean;
}

const LOGO_SIZE = 36;

const AnimatedNavbarLogo: React.FC<AnimatedNavbarLogoProps> = ({ isRTL = false }) => {
  const { theme } = useTheme();
  const { typography, fontWeight } = useTypography();

  // Logo animation values
  const logoOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.6);

  // Text animation values
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.7);

  useEffect(() => {
    // Logo: spring in → pause → shrink out (sequenced on same shared value)
    logoScale.value = withSequence(
      withSpring(1, { damping: 10, stiffness: 120 }),
      withDelay(200, withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) })),
    );

    // Logo opacity: hold → fade out
    logoOpacity.value = withDelay(
      1000,
      withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
    );

    // Text: fade in + spring scale after logo starts fading
    textOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
    textScale.value = withDelay(1200, withSpring(1, { damping: 14, stiffness: 100 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  const titleText = isRTL ? 'البوكلتس' : 'EL-Booklets';

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/logo-transparent.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
      <Animated.Text
        style={[
          styles.text,
          {
            ...typography('h2'),
            color: theme.colors.headerText,
            ...fontWeight('bold'),
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {titleText}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    minWidth: 120,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    position: 'absolute',
  },
  text: {
    position: 'absolute',
  },
});

export default AnimatedNavbarLogo;
