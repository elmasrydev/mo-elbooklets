import React, { useEffect, useMemo } from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import type { MatchPending } from '../../utils/matchInteraction';

/**
 * SVG overlay for the match wires board: draws a colored bezier between each
 * connected pair's inner ports, a hollow port on every unconnected card, and a
 * pulsing highlighted port on the armed (pending) card. Ported from the
 * `mobile-quiz-matching.html` mockup's SVG drawing, adapted to React Native
 * layout measurement (ports are derived from each card's measured rect, so the
 * geometry is direction-agnostic and works in RTL).
 */

export type CardRect = { x: number; y: number; width: number; height: number };
export type Port = { x: number; y: number };

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PORT_GAP = 7; // distance the port floats off the card's inner edge

/** The port for a card: on the edge facing the board centre. */
const portForCard = (rect: CardRect, boardWidth: number): Port => {
  const centerX = rect.x + rect.width / 2;
  const isLeftColumn = centerX < boardWidth / 2;
  return {
    x: isLeftColumn ? rect.x + rect.width + PORT_GAP : rect.x - PORT_GAP,
    y: rect.y + rect.height / 2,
  };
};

/** Cubic bezier path string + its sampled length, for the draw-in animation. */
const buildWire = (p1: Port, p2: Port): { d: string; length: number } => {
  const dir = p2.x > p1.x ? 1 : -1;
  const bend = Math.abs(p2.x - p1.x) * 0.42;
  const c1 = { x: p1.x + dir * bend, y: p1.y };
  const c2 = { x: p2.x - dir * bend, y: p2.y };
  const d = `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;

  const SAMPLES = 24;
  let length = 0;
  let prev = p1;
  for (let i = 1; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const mt = 1 - t;
    const x =
      mt * mt * mt * p1.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * p2.x;
    const y =
      mt * mt * mt * p1.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * p2.y;
    length += Math.hypot(x - prev.x, y - prev.y);
    prev = { x, y };
  }
  return { d, length };
};

const Wire: React.FC<{ p1: Port; p2: Port; color: string; reducedMotion: boolean }> = ({
  p1,
  p2,
  color,
  reducedMotion,
}) => {
  // The geometry only changes when an endpoint moves, but this component
  // re-renders on every card tap and every 1Hz quiz-timer tick — without the
  // memo each of those re-sampled the curve at 24 points and rebuilt the path.
  const { d, length } = useMemo(
    () => buildWire(p1, p2),
    [p1.x, p1.y, p2.x, p2.y], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  // Draw-in once when this wire first mounts (a new pair was formed).
  useEffect(() => {
    if (!reducedMotion) {
      progress.value = withTiming(1, { duration: 300, easing: Easing.bezier(0.22, 0.68, 0, 1) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `length` is a plain JS number the worklet captures as a dependency; reading it
  // directly (instead of mirroring it into a shared value written during render)
  // keeps the offset in sync when the endpoints move, without the render-time write.
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }));

  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={length}
      animatedProps={animatedProps}
    />
  );
};

const PulsingPort: React.FC<{ port: Port; color: string; reducedMotion: boolean }> = ({
  port,
  color,
  reducedMotion,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!reducedMotion) {
      scale.value = withRepeat(
        withTiming(1.45, { duration: 550, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedProps = useAnimatedProps(() => ({ r: 4 * scale.value }));

  return <AnimatedCircle cx={port.x} cy={port.y} fill={color} animatedProps={animatedProps} />;
};

type MatchWireOverlayProps = {
  boardWidth: number;
  boardHeight: number;
  /** Measured rect per card id (left and right columns). */
  layouts: Record<string, CardRect>;
  /** Committed connections: leftId -> rightId. */
  pairs: Record<string, string>;
  pending: MatchPending;
  /** Stable pair color for a given leftId. */
  colorForLeftId: (leftId: string) => string;
  pendingColor: string;
};

const MatchWireOverlay: React.FC<MatchWireOverlayProps> = ({
  boardWidth,
  boardHeight,
  layouts,
  pairs,
  pending,
  colorForLeftId,
  pendingColor,
}) => {
  const reducedMotion = useReducedMotion();
  if (boardWidth === 0 || boardHeight === 0) return null;

  const linkedIds = new Set<string>();
  Object.entries(pairs).forEach(([leftId, rightId]) => {
    linkedIds.add(leftId);
    linkedIds.add(rightId);
  });

  return (
    <Svg
      width={boardWidth}
      height={boardHeight}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* Idle ports on every unlinked card; the armed one pulses. */}
      {Object.entries(layouts).map(([id, rect]) => {
        if (linkedIds.has(id)) return null;
        const port = portForCard(rect, boardWidth);
        if (pending && pending.id === id) {
          return (
            <PulsingPort
              key={`port-${id}`}
              port={port}
              color={pendingColor}
              reducedMotion={reducedMotion}
            />
          );
        }
        return (
          <Circle
            key={`port-${id}`}
            cx={port.x}
            cy={port.y}
            r={4}
            fill="#FFFFFF"
            stroke="#C3CCE0"
            strokeWidth={2}
          />
        );
      })}

      {/* Wires + solid endpoint ports for each connection. */}
      {Object.entries(pairs).map(([leftId, rightId]) => {
        const leftRect = layouts[leftId];
        const rightRect = layouts[rightId];
        if (!leftRect || !rightRect) return null;
        const p1 = portForCard(leftRect, boardWidth);
        const p2 = portForCard(rightRect, boardWidth);
        const color = colorForLeftId(leftId);
        return (
          <React.Fragment key={`wire-${leftId}`}>
            <Wire p1={p1} p2={p2} color={color} reducedMotion={reducedMotion} />
            <Circle cx={p1.x} cy={p1.y} r={4.5} fill={color} />
            <Circle cx={p2.x} cy={p2.y} r={4.5} fill={color} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

export default MatchWireOverlay;
