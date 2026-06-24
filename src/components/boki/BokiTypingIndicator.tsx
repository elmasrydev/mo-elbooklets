import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../config/spacing';

const DOT_COUNT = 3;
const DOT_DELAY = 160;

/**
 * Three-dot "Boki is typing…" indicator. Animates opacity only with the native
 * driver so it stays smooth (off the JS thread) on low-end Android.
 */
const BokiTypingIndicator: React.FC = () => {
  const { theme } = useTheme();
  const dots = useRef(Array.from({ length: DOT_COUNT }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * DOT_DELAY),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 320, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dots]);

  return (
    <View style={styles.row} testID="boki-typing-indicator" accessibilityRole="progressbar">
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[styles.dot, { backgroundColor: theme.colors.textSecondary, opacity: dot }]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginHorizontal: 3,
  },
});

export default React.memo(BokiTypingIndicator);
