import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Image, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LOGO_WIDTH = SCREEN_WIDTH * 0.45;
const scaleX = SCREEN_WIDTH / 388;
const scaleY = SCREEN_HEIGHT / 844;

interface SplashScreenProps {
  onFinish: (isAuthenticated: boolean) => void;
}

// 45 background learning doodles extracted from splash HTML mockup
const DOODLES_DATA = [
  {
    coord: { top: 62, left: 24 },
    color: '#004A9A',
    size: 36,
    rot: '-18deg',
    opacity: 0.2,
    delay: 0,
    symbol: 'stylus_note',
  },
  {
    coord: { top: 108, left: 55 },
    color: '#2868D0',
    size: 30,
    rot: '22deg',
    opacity: 0.18,
    delay: 30,
    symbol: 'edit',
  },
  {
    coord: { top: 80, left: 128 },
    color: '#7C3AED',
    size: 18,
    rot: '0deg',
    opacity: 0.2,
    delay: 60,
    symbol: 'plus',
  },
  {
    coord: { top: 140, left: 18 },
    color: '#d97706',
    size: 22,
    rot: '0deg',
    opacity: 0.22,
    delay: 90,
    symbol: 'auto_awesome',
  },
  {
    coord: { top: 180, left: 55 },
    color: '#16a34a',
    size: 20,
    rot: '-15deg',
    opacity: 0.18,
    delay: 120,
    symbol: 'wave',
  },
  {
    coord: { top: 170, left: 138 },
    color: '#d97706',
    size: 18,
    rot: '0deg',
    opacity: 0.2,
    delay: 150,
    symbol: 'grade',
  },
  {
    coord: { top: 215, left: 24 },
    color: '#1E54B8',
    size: 22,
    rot: '30deg',
    opacity: 0.18,
    delay: 180,
    symbol: 'arrow_forward',
  },
  {
    coord: { top: 230, left: 110 },
    color: '#004A9A',
    size: 14,
    rot: '0deg',
    opacity: 0.16,
    delay: 210,
    symbol: 'plus',
  },
  {
    coord: { top: 70, right: 26 },
    color: '#004A9A',
    size: 40,
    rot: '12deg',
    opacity: 0.2,
    delay: 240,
    symbol: 'laptop_mac',
  },
  {
    coord: { top: 130, right: 80 },
    color: '#d97706',
    size: 22,
    rot: '0deg',
    opacity: 0.22,
    delay: 270,
    symbol: 'auto_awesome',
  },
  {
    coord: { top: 165, right: 30 },
    color: '#7C3AED',
    size: 26,
    rot: '45deg',
    opacity: 0.18,
    delay: 300,
    symbol: 'arrow_forward',
  },
  {
    coord: { top: 200, right: 80 },
    color: '#16a34a',
    size: 18,
    rot: '0deg',
    opacity: 0.18,
    delay: 330,
    symbol: 'plus',
  },
  {
    coord: { top: 215, right: 24 },
    color: '#2868D0',
    size: 20,
    rot: '8deg',
    opacity: 0.16,
    delay: 360,
    symbol: 'wave',
  },
  {
    coord: { top: 245, right: 65 },
    color: '#16a34a',
    size: 14,
    rot: '0deg',
    opacity: 0.18,
    delay: 390,
    symbol: 'change_history',
  },
  {
    coord: { top: 125, right: 140 },
    color: '#7C3AED',
    size: 16,
    rot: '0deg',
    opacity: 0.18,
    delay: 420,
    symbol: 'grade',
  },
  {
    coord: { top: 330, left: 18 },
    color: '#004A9A',
    size: 20,
    rot: '-6deg',
    opacity: 0.2,
    delay: 450,
    symbol: 'ai-chip',
  },
  {
    coord: { top: 418, left: 78 },
    color: '#d97706',
    size: 16,
    rot: '0deg',
    opacity: 0.18,
    delay: 480,
    symbol: 'plus',
  },
  {
    coord: { top: 340, left: 78 },
    color: '#16a34a',
    size: 20,
    rot: '-8deg',
    opacity: 0.2,
    delay: 510,
    symbol: 'check-bubble',
  },
  {
    coord: { top: 455, left: 24 },
    color: '#7C3AED',
    size: 20,
    rot: '0deg',
    opacity: 0.2,
    delay: 540,
    symbol: 'auto_awesome',
  },
  {
    coord: { top: 495, left: 88 },
    color: '#d97706',
    size: 14,
    rot: '0deg',
    opacity: 0.2,
    delay: 570,
    symbol: 'grade',
  },
  {
    coord: { top: 530, left: 24 },
    color: '#004A9A',
    size: 20,
    rot: '-20deg',
    opacity: 0.16,
    delay: 600,
    symbol: 'wave',
  },
  {
    coord: { top: 510, left: 135 },
    color: '#16a34a',
    size: 16,
    rot: '60deg',
    opacity: 0.18,
    delay: 630,
    symbol: 'arrow_forward',
  },
  {
    coord: { top: 335, right: 22 },
    color: '#16a34a',
    size: 46,
    rot: '8deg',
    opacity: 0.2,
    delay: 660,
    symbol: 'science',
  },
  {
    coord: { top: 355, right: 84 },
    color: '#7C3AED',
    size: 20,
    rot: '10deg',
    opacity: 0.2,
    delay: 690,
    symbol: 'question-bubble',
  },
  {
    coord: { top: 430, right: 78 },
    color: '#d97706',
    size: 22,
    rot: '0deg',
    opacity: 0.18,
    delay: 720,
    symbol: 'auto_awesome',
  },
  {
    coord: { top: 470, right: 24 },
    color: '#004A9A',
    size: 18,
    rot: '0deg',
    opacity: 0.16,
    delay: 750,
    symbol: 'plus',
  },
  {
    coord: { top: 495, right: 100 },
    color: '#7C3AED',
    size: 14,
    rot: '0deg',
    opacity: 0.18,
    delay: 780,
    symbol: 'grade',
  },
  {
    coord: { top: 530, right: 24 },
    color: '#2868D0',
    size: 20,
    rot: '15deg',
    opacity: 0.16,
    delay: 810,
    symbol: 'wave',
  },
  {
    coord: { top: 520, right: 130 },
    color: '#d97706',
    size: 14,
    rot: '0deg',
    opacity: 0.18,
    delay: 840,
    symbol: 'change_history',
  },
  {
    coord: { left: 28, bottom: 165 },
    color: '#004A9A',
    size: 40,
    rot: '-14deg',
    opacity: 0.2,
    delay: 870,
    symbol: 'smartphone',
  },
  {
    coord: { left: 90, bottom: 230 },
    color: '#7C3AED',
    size: 18,
    rot: '0deg',
    opacity: 0.18,
    delay: 900,
    symbol: 'plus',
  },
  {
    coord: { left: 88, bottom: 125 },
    color: '#2868D0',
    size: 24,
    rot: '-30deg',
    opacity: 0.2,
    delay: 930,
    symbol: 'arrow_forward',
  },
  {
    coord: { left: 30, bottom: 90 },
    color: '#d97706',
    size: 20,
    rot: '8deg',
    opacity: 0.18,
    delay: 960,
    symbol: 'wave',
  },
  {
    coord: { left: 32, bottom: 260 },
    color: '#16a34a',
    size: 18,
    rot: '0deg',
    opacity: 0.2,
    delay: 990,
    symbol: 'auto_awesome',
  },
  {
    coord: { left: 90, bottom: 60 },
    color: '#7C3AED',
    size: 14,
    rot: '0deg',
    opacity: 0.18,
    delay: 1020,
    symbol: 'change_history',
  },
  {
    coord: { left: 130, bottom: 200 },
    color: '#d97706',
    size: 14,
    rot: '0deg',
    opacity: 0.2,
    delay: 1050,
    symbol: 'grade',
  },
  {
    coord: { left: 140, bottom: 50 },
    color: '#004A9A',
    size: 13,
    rot: '0deg',
    opacity: 0.16,
    delay: 1080,
    symbol: 'plus',
  },
  {
    coord: { left: '50%', bottom: 175 },
    color: '#d97706',
    size: 38,
    rot: '0deg',
    opacity: 0.22,
    delay: 1110,
    symbol: 'lightbulb',
  },
  {
    coord: { left: 200, bottom: 250 },
    color: '#7C3AED',
    size: 16,
    rot: '0deg',
    opacity: 0.18,
    delay: 1140,
    symbol: 'auto_awesome',
  },
  {
    coord: { right: 28, bottom: 170 },
    color: '#004A9A',
    size: 40,
    rot: '12deg',
    opacity: 0.2,
    delay: 1170,
    symbol: 'auto_stories',
  },
  {
    coord: { right: 84, bottom: 230 },
    color: '#d97706',
    size: 22,
    rot: '0deg',
    opacity: 0.2,
    delay: 1200,
    symbol: 'auto_awesome',
  },
  {
    coord: { right: 90, bottom: 120 },
    color: '#16a34a',
    size: 18,
    rot: '0deg',
    opacity: 0.18,
    delay: 1230,
    symbol: 'plus',
  },
  {
    coord: { right: 30, bottom: 92 },
    color: '#7C3AED',
    size: 20,
    rot: '-18deg',
    opacity: 0.16,
    delay: 1260,
    symbol: 'wave',
  },
  {
    coord: { right: 130, bottom: 200 },
    color: '#d97706',
    size: 14,
    rot: '0deg',
    opacity: 0.2,
    delay: 1290,
    symbol: 'grade',
  },
  {
    coord: { right: 32, bottom: 260 },
    color: '#2868D0',
    size: 18,
    rot: '60deg',
    opacity: 0.18,
    delay: 1320,
    symbol: 'arrow_forward',
  },
];

const renderDoodleSymbol = (symbol: string, size: number, color: string) => {
  switch (symbol) {
    case 'stylus_note':
      return <MaterialIcons name="gesture" size={size} color={color} />;
    case 'edit':
      return <MaterialIcons name="edit" size={size} color={color} />;
    case 'plus':
      return <Text style={{ fontSize: size, color, fontWeight: '900', lineHeight: size }}>+</Text>;
    case 'auto_awesome':
      return <MaterialIcons name="auto-awesome" size={size} color={color} />;
    case 'wave':
      return (
        <Svg width={size * 2.5} height={size * 0.7} viewBox="0 0 60 20">
          <Path
            d="M2 10 C 10 2, 18 18, 28 10 S 46 2, 58 10"
            fill="none"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'grade':
      return <MaterialIcons name="grade" size={size} color={color} />;
    case 'arrow_forward':
      return <MaterialIcons name="arrow-forward" size={size} color={color} />;
    case 'laptop_mac':
      return <MaterialIcons name="laptop-mac" size={size} color={color} />;
    case 'change_history':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 2L2 22h20L12 2z"
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'ai-chip':
      return (
        <Svg width={size * 1.5} height={size * 1.5} viewBox="0 0 64 64">
          <Rect
            x="14"
            y="14"
            width="36"
            height="36"
            rx="6"
            fill="none"
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M8 22h6 M8 30h6 M8 38h6 M8 46h6 M50 22h6 M50 30h6 M50 38h6 M50 46h6 M22 8v6 M30 8v6 M38 8v6 M46 8v6 M22 50v6 M30 50v6 M38 50v6 M46 50v6"
            fill="none"
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <SvgText
            x="32"
            y="36"
            textAnchor="middle"
            fontSize="14"
            fontWeight="900"
            fill={color}
            stroke="none"
          >
            AI
          </SvgText>
        </Svg>
      );
    case 'check-bubble':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path
            d="M6 8 a4 4 0 0 1 4-4 h20 a4 4 0 0 1 4 4 v14 a4 4 0 0 1 -4 4 h-12 l-8 6 v-6 h-0 a4 4 0 0 1 -4 -4 z"
            fill="none"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14 14 l5 5 l9-10"
            fill="none"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'science':
      return <MaterialIcons name="science" size={size} color={color} />;
    case 'question-bubble':
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path
            d="M34 8 a4 4 0 0 0 -4 -4 h-20 a4 4 0 0 0 -4 4 v14 a4 4 0 0 0 4 4 h12 l8 6 v-6 a4 4 0 0 0 4 -4 z"
            fill="none"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16 12 a4 4 0 0 1 8 0 c0 3 -4 3 -4 6"
            fill="none"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="20" cy="22" r="1.2" fill={color} />
        </Svg>
      );
    case 'smartphone':
      return <MaterialIcons name="smartphone" size={size} color={color} />;
    case 'lightbulb':
      return <MaterialIcons name="lightbulb" size={size} color={color} />;
    case 'auto_stories':
      return <MaterialIcons name="auto-stories" size={size} color={color} />;
    default:
      return null;
  }
};

interface DoodleItemProps {
  doodle: (typeof DOODLES_DATA)[0];
  idx: number;
  entranceProgress: SharedValue<number>;
  loopFloat: SharedValue<number>;
}

// Separate component for background doodles to avoid calling hooks inside maps/callbacks
const DoodleItem: React.FC<DoodleItemProps> = ({ doodle, idx, entranceProgress, loopFloat }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const delayFactor = doodle.delay / 1000;
    const progressed = Math.max(
      0,
      Math.min(1, (entranceProgress.value - delayFactor * 0.55) / 0.15),
    );
    const floatOffset = Math.sin(loopFloat.value * Math.PI * 2 + idx) * 3;
    return {
      opacity: progressed * doodle.opacity,
      transform: [{ rotate: doodle.rot }, { scale: progressed }, { translateY: floatOffset }],
    };
  });

  const getPosition = () => {
    const pos: any = {};
    const coord = doodle.coord;
    if (coord.top !== undefined) pos.top = coord.top * scaleY;
    if (coord.bottom !== undefined) pos.bottom = coord.bottom * scaleY;
    if (coord.left !== undefined) {
      if (coord.left === '50%') {
        pos.left = '50%';
        pos.marginLeft = -(doodle.size / 2);
      } else {
        pos.left = (coord.left as number) * scaleX;
      }
    }
    if (coord.right !== undefined) pos.right = coord.right * scaleX;
    return pos;
  };

  return (
    <Animated.View style={[styles.doodle, getPosition(), animatedStyle]}>
      {renderDoodleSymbol(doodle.symbol, doodle.size, doodle.color)}
    </Animated.View>
  );
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { isLoading, isAuthenticated } = useAuth();

  // Reanimated Shared Values
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(30);

  const brandOpacity = useSharedValue(0);
  const brandTranslateY = useSharedValue(15);

  const tagOpacity = useSharedValue(0);
  const tagTranslateY = useSharedValue(15);

  const loopFloat = useSharedValue(0);

  // Single shared value for staggered entrance of all doodles
  const entranceProgress = useSharedValue(0);

  // Pulse values for custom loading dots
  const dot1Scale = useSharedValue(0.8);
  const dot2Scale = useSharedValue(0.8);
  const dot3Scale = useSharedValue(0.8);

  useEffect(() => {
    // 1. Entrance Animations on Mount
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoTranslateY.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) });

    brandOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    brandTranslateY.value = withDelay(
      300,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    tagOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    tagTranslateY.value = withDelay(
      500,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    // 3. Doodles entrance timeline
    entranceProgress.value = withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) });

    // 4. Subtle background idle float loop
    loopFloat.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    // 5. Loading dots sequence loop
    dot1Scale.value = withRepeat(
      withTiming(1.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    dot2Scale.value = withDelay(
      200,
      withRepeat(withTiming(1.3, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
    dot3Scale.value = withDelay(
      400,
      withRepeat(withTiming(1.3, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true),
    );

    // 6. Navigation hand-off
    if (!isLoading) {
      const timer = setTimeout(() => {
        onFinish(isAuthenticated);
      }, 3500); // 3.5s total time for animation to be fully appreciated

      return () => clearTimeout(timer);
    }
  }, [
    isLoading,
    isAuthenticated,
    onFinish,
    logoScale,
    logoOpacity,
    logoTranslateY,
    brandOpacity,
    brandTranslateY,
    tagOpacity,
    tagTranslateY,
    entranceProgress,
    loopFloat,
    dot1Scale,
    dot2Scale,
    dot3Scale,
  ]);

  // Animated Styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: logoTranslateY.value }],
  }));

  const brandAnimatedStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslateY.value }],
  }));

  const tagAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{ translateY: tagTranslateY.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
    opacity: dot1Scale.value === 1.3 ? 1 : 0.4,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
    opacity: dot2Scale.value === 1.3 ? 1 : 0.4,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
    opacity: dot3Scale.value === 1.3 ? 1 : 0.4,
  }));

  return (
    <View style={styles.container}>
      {/* Background wash gradient */}
      <LinearGradient colors={['#F4F7FC', '#F9FAFF']} style={StyleSheet.absoluteFillObject} />

      {/* Background Doodles Layer */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {DOODLES_DATA.map((doodle, idx) => (
          <DoodleItem
            key={`doodle-${idx}`}
            doodle={doodle}
            idx={idx}
            entranceProgress={entranceProgress}
            loopFloat={loopFloat}
          />
        ))}
      </View>

      {/* Center content */}
      <View style={styles.content}>
        <Animated.View style={logoAnimatedStyle}>
          <Image
            source={require('../../assets/logo-transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text style={[styles.brandName, brandAnimatedStyle]}>El Booklets</Animated.Text>
        <Animated.Text style={[styles.tagline, tagAnimatedStyle]}>
          Study · Quiz · Excel
        </Animated.Text>
      </View>

      {/* Pulse Loader */}
      <View style={styles.loaderContainer}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F5FB',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH,
    ...Platform.select({
      ios: {
        shadowColor: '#004A9A',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#005ab4',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#005ab4',
    opacity: 0.65,
    marginTop: 6,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  doodle: {
    position: 'absolute',
    zIndex: 1,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#005ab4',
  },
});

export default SplashScreen;
