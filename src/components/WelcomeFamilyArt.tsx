import React from 'react';
import Svg, { G, Circle, Rect, Path } from 'react-native-svg';

/**
 * Decorative family silhouette for the Parent Dashboard welcome banner — a father
 * (left, with legs), a small child (middle) and a mother (right, in a dress), echoing
 * the Material `family_restroom` glyph from the design. White, low opacity over the
 * gradient. Group opacity keeps overlapping limbs from darkening at the seams.
 */
const WelcomeFamilyArt: React.FC<{ size?: number }> = ({ size = 84 }) => (
  <Svg width={size} height={size * 0.62} viewBox="0 0 96 60" fill="none">
    <G fill="#FFFFFF" opacity={0.3}>
      {/* Father (left) */}
      <Circle cx={20} cy={11} r={6.5} />
      <Rect x={12} y={19} width={16} height={21} rx={6} />
      <Rect x={14.5} y={36} width={5} height={18} rx={2.5} />
      <Rect x={20.5} y={36} width={5} height={18} rx={2.5} />

      {/* Child (middle) */}
      <Circle cx={48} cy={25} r={5} />
      <Rect x={42.5} y={31} width={11} height={13} rx={5} />
      <Rect x={44.5} y={41} width={3.5} height={12} rx={1.75} />
      <Rect x={48} y={41} width={3.5} height={12} rx={1.75} />

      {/* Mother (right, dress) */}
      <Circle cx={76} cy={11} r={6.5} />
      <Path d="M70 21 C70 18.5 72.5 17 76 17 C79.5 17 82 18.5 82 21 L90 50 L62 50 Z" />
      <Rect x={72} y={49} width={3.5} height={5} rx={1} />
      <Rect x={76.5} y={49} width={3.5} height={5} rx={1} />
    </G>
  </Svg>
);

export default WelcomeFamilyArt;
