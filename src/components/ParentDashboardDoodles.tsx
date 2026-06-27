import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Rect, Line, Polygon, Path, Circle } from 'react-native-svg';

/**
 * Decorative book/phone/star/question-mark doodles anchored to the bottom of the
 * Parent Dashboard, ported from the design's doodle layer. Purely cosmetic and
 * non-interactive — sits behind the scroll content.
 */
const ParentDashboardDoodles: React.FC = () => (
  <View pointerEvents="none" style={styles.layer}>
    <Svg width="100%" height="100%" viewBox="0 0 369 260" preserveAspectRatio="xMidYMax meet">
      {/* Book (left, tilted) */}
      <G opacity={0.11} transform="translate(14,148) rotate(-12)">
        <Rect x={0} y={0} width={62} height={80} rx={5} fill="#1E3063" />
        <Rect x={0} y={0} width={8} height={80} rx={4} fill="#0f2050" />
        <Rect x={8} y={3} width={52} height={74} rx={3} fill="#DBEAFA" />
        <Line
          x1={16}
          y1={18}
          x2={52}
          y2={18}
          stroke="#004A9A"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.4}
        />
        <Line
          x1={16}
          y1={27}
          x2={52}
          y2={27}
          stroke="#004A9A"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.4}
        />
        <Line
          x1={16}
          y1={36}
          x2={44}
          y2={36}
          stroke="#004A9A"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.4}
        />
        <Line
          x1={16}
          y1={45}
          x2={48}
          y2={45}
          stroke="#004A9A"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.4}
        />
        <Polygon points="44,3 52,3 52,22 48,18 44,22" fill="#e11d48" opacity={0.7} />
      </G>

      {/* Phone (right-center, tilted) */}
      <G opacity={0.1} transform="translate(270,130) rotate(14)">
        <Rect x={0} y={0} width={44} height={76} rx={10} fill="#1E3063" />
        <Rect x={4} y={10} width={36} height={54} rx={6} fill="#DBEAFA" />
        <Rect x={16} y={4} width={12} height={4} rx={2} fill="#0f2050" />
        <Rect x={14} y={68} width={16} height={3} rx={1.5} fill="#0f2050" />
        <Circle cx={14} cy={38} r={4} fill="#004A9A" opacity={0.35} />
        <Circle cx={22} cy={38} r={4} fill="#004A9A" opacity={0.35} />
        <Circle cx={30} cy={38} r={4} fill="#004A9A" opacity={0.35} />
        <Circle cx={14} cy={50} r={4} fill="#004A9A" opacity={0.25} />
        <Circle cx={22} cy={50} r={4} fill="#004A9A" opacity={0.25} />
        <Circle cx={30} cy={50} r={4} fill="#004A9A" opacity={0.25} />
      </G>

      {/* Star (top-right) */}
      <G opacity={0.09} transform="translate(300,100) rotate(8)">
        <Path
          d="M22 2 L26.5 15 L40 15 L29.5 23.5 L34 37 L22 28.5 L10 37 L14.5 23.5 L4 15 L17.5 15 Z"
          fill="#004A9A"
        />
        <Path
          d="M22 8 L25 17 L34.5 17 L27 22.5 L30 32 L22 26.5 L14 32 L17 22.5 L9.5 17 L19 17 Z"
          fill="#1E54B8"
          opacity={0.5}
        />
      </G>

      {/* Question mark (center) */}
      <G opacity={0.09} transform="translate(155,145)">
        <Path
          d="M12 0 C4 0 0 6 0 12 C0 17 3 21 8 23 L8 30"
          stroke="#004A9A"
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={8} cy={38} r={4} fill="#004A9A" />
      </G>

      {/* Small stars */}
      <G opacity={0.08} transform="translate(100,180)">
        <Path d="M8 0 L9.5 6 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6 Z" fill="#004A9A" />
      </G>
      <G opacity={0.07} transform="translate(330,190)">
        <Path d="M6 0 L7 4.5 L12 6 L7 7 L6 12 L5 7 L0 6 L5 4.5 Z" fill="#1E54B8" />
      </G>

      {/* Floating dots */}
      <Circle cx={240} cy={200} r={5} fill="#004A9A" opacity={0.06} />
      <Circle cx={58} cy={248} r={4} fill="#1E54B8" opacity={0.06} />
      <Circle cx={195} cy={162} r={3} fill="#004A9A" opacity={0.06} />
      <Circle cx={135} cy={240} r={3.5} fill="#1E54B8" opacity={0.05} />
      <Circle cx={348} cy={155} r={3} fill="#004A9A" opacity={0.06} />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
  },
});

export default ParentDashboardDoodles;
