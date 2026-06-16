import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  useReducedMotion,
} from 'react-native-reanimated';

/**
 * Lightweight one-shot confetti tuned for low-end Android:
 * - transforms + opacity only (UI thread), no width/height/layout animation
 * - fewer pieces on Android, capped count, single play then self-unmounts to free views
 * - fully skipped when the OS "reduce motion" setting is on
 */
const COLORS = ['#004A9A', '#1E54B8', '#0d9488', '#16a34a', '#d97706', '#fbbf24'];
const COUNT = Platform.OS === 'android' ? 10 : 18;
const FALL = 240;
const LIFETIME_MS = 2800;

interface ConfettiProps {
  onDone?: () => void;
}

const Piece = ({ index }: { index: number }) => {
  const p = useSharedValue(0);
  // Per-piece randomness (Math.random is fine in app code; only worklets restrict it).
  const left = 4 + Math.random() * 92;
  const size = 5 + Math.random() * 6;
  const color = COLORS[index % COLORS.length];
  const round = Math.random() > 0.5;
  const duration = 1500 + Math.random() * 1100;
  const delay = Math.random() * 400;
  const spin = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360);

  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration, easing: Easing.linear }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: p.value * FALL }, { rotate: `${p.value * spin}deg` }],
    opacity: interpolate(p.value, [0, 0.1, 0.82, 1], [0, 1, 1, 0]),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: -12,
          left: `${left}%`,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: round ? size / 2 : 2,
        },
        style,
      ]}
    />
  );
};

const Confetti: React.FC<ConfettiProps> = ({ onDone }) => {
  const reduceMotion = useReducedMotion();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      onDone?.();
      return;
    }
    const id = setTimeout(() => {
      setDone(true);
      onDone?.();
    }, LIFETIME_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  if (reduceMotion || done) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: COUNT }).map((_, i) => (
        <Piece key={i} index={i} />
      ))}
    </View>
  );
};

export default React.memo(Confetti);
