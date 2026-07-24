import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { useTypography } from '../../hooks/useTypography';
import { isArabicText } from '../../config/fonts';
import { QUIZ_COLORS } from '../../config/colors';
import type { MatchPending, MatchSide } from '../../utils/matchInteraction';
import MatchWireOverlay, { type CardRect } from './MatchWireOverlay';

/**
 * The "short content" match view from the mockup: two columns of cards with an
 * SVG wire overlay. Tap a card to arm it, tap one on the other column to
 * connect. Card visual states (pending / hintable / linked) and the pop-on-
 * connect come straight from the mockup.
 */

export type MatchItem = { id: string; text: string };
type CardState = 'idle' | 'pending' | 'hintable' | 'linked';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

type MatchCardProps = {
  item: MatchItem;
  side: MatchSide;
  chipLabel: string;
  state: CardState;
  color: string;
  contentAlign: 'left' | 'right';
  onPress: () => void;
  onMeasure: (id: string, rect: CardRect) => void;
  testID: string;
};

const MatchCard: React.FC<MatchCardProps> = ({
  item,
  side,
  chipLabel,
  state,
  color,
  contentAlign,
  onPress,
  onMeasure,
  testID,
}) => {
  const { typography } = useTypography();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const wasLinked = React.useRef(false);

  // Pop when this card becomes linked (a pair just formed).
  useEffect(() => {
    const linked = state === 'linked';
    if (linked && !wasLinked.current && !reducedMotion) {
      scale.value = withSequence(
        withTiming(1.04, { duration: 120, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 180, easing: Easing.inOut(Easing.ease) }),
      );
    }
    wasLinked.current = linked;
  }, [state, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    onMeasure(item.id, { x, y, width, height });
  };

  const linked = state === 'linked';
  const pending = state === 'pending';

  return (
    <Animated.View style={[styles.cardWrap, animatedStyle]} onLayout={handleLayout}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: linked || pending }}
        accessibilityLabel={item.text}
        testID={testID}
        style={[
          styles.card,
          pending && styles.cardPending,
          state === 'hintable' && styles.cardHintable,
          linked && { borderColor: color, backgroundColor: tint(color) },
        ]}
      >
        <View
          style={[styles.chip, pending && styles.chipPending, linked && { backgroundColor: color }]}
        >
          <Text
            style={[
              styles.chipText,
              typography('label', '800'),
              (pending || linked) && styles.chipTextActive,
            ]}
          >
            {chipLabel}
          </Text>
        </View>
        <Text
          style={[styles.cardText, typography('bodySmall', '700', isArabicText(item.text))]}
          // side kept for future per-column tweaks; text aligns to its own script.
          numberOfLines={4}
        >
          {item.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

/** A very light tint of the pair color for the linked card background. */
const tint = (hex: string): string => `${hex}0F`; // ~6% alpha (8-digit hex)

type MatchBoardProps = {
  left: MatchItem[];
  right: MatchItem[];
  pairs: Record<string, string>;
  pending: MatchPending;
  onTap: (side: MatchSide, id: string) => void;
  colorForLeftId: (leftId: string) => string;
  contentAlign: 'left' | 'right';
};

const MatchBoard: React.FC<MatchBoardProps> = ({
  left,
  right,
  pairs,
  pending,
  onTap,
  colorForLeftId,
  contentAlign,
}) => {
  const [board, setBoard] = useState({ width: 0, height: 0 });
  const [layouts, setLayouts] = useState<Record<string, CardRect>>({});

  const onMeasure = (id: string, rect: CardRect) => {
    setLayouts((prev) => {
      const existing = prev[id];
      if (
        existing &&
        existing.x === rect.x &&
        existing.y === rect.y &&
        existing.width === rect.width &&
        existing.height === rect.height
      ) {
        return prev;
      }
      return { ...prev, [id]: rect };
    });
  };

  const rightColorByLeft = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(pairs).forEach(([leftId, rightId]) => {
      map[rightId] = colorForLeftId(leftId);
    });
    return map;
  }, [pairs, colorForLeftId]);

  const linkedRights = useMemo(() => new Set(Object.values(pairs)), [pairs]);

  const stateFor = (side: MatchSide, id: string): CardState => {
    const isLinked = side === 'left' ? pairs[id] != null : linkedRights.has(id);
    if (isLinked) return 'linked';
    if (pending && pending.side === side && pending.id === id) return 'pending';
    if (pending && pending.side !== side) return 'hintable';
    return 'idle';
  };

  const rowCount = Math.max(left.length, right.length);
  const slots: React.ReactNode[] = [];
  for (let i = 0; i < rowCount; i++) {
    const l = left[i];
    const r = right[i];
    slots.push(
      l ? (
        <MatchCard
          key={`L-${l.id}`}
          item={l}
          side="left"
          chipLabel={String(i + 1)}
          state={stateFor('left', l.id)}
          color={colorForLeftId(l.id)}
          contentAlign={contentAlign}
          onPress={() => onTap('left', l.id)}
          onMeasure={onMeasure}
          testID={`match-left-${l.id}`}
        />
      ) : (
        <View key={`L-empty-${i}`} style={styles.cardWrap} />
      ),
    );
    slots.push(
      r ? (
        <MatchCard
          key={`R-${r.id}`}
          item={r}
          side="right"
          chipLabel={LETTERS[i] ?? String(i + 1)}
          state={stateFor('right', r.id)}
          color={rightColorByLeft[r.id] ?? QUIZ_COLORS.navy}
          contentAlign={contentAlign}
          onPress={() => onTap('right', r.id)}
          onMeasure={onMeasure}
          testID={`match-right-${r.id}`}
        />
      ) : (
        <View key={`R-empty-${i}`} style={styles.cardWrap} />
      ),
    );
  }

  return (
    <View
      style={styles.board}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setBoard((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
      }}
    >
      <MatchWireOverlay
        boardWidth={board.width}
        boardHeight={board.height}
        layouts={layouts}
        pairs={pairs}
        pending={pending}
        colorForLeftId={colorForLeftId}
        pendingColor={QUIZ_COLORS.navy}
      />
      {slots}
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardWrap: {
    width: '46%',
    marginBottom: 12,
  },
  card: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: QUIZ_COLORS.cardBg,
    borderWidth: 2,
    borderColor: QUIZ_COLORS.line,
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  cardPending: {
    borderColor: QUIZ_COLORS.navy,
    backgroundColor: '#F8FAFD',
  },
  cardHintable: {
    borderColor: '#A8BAD8',
    borderStyle: 'dashed',
  },
  chip: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#EEF1F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipPending: {
    backgroundColor: QUIZ_COLORS.navy,
  },
  chipText: {
    color: QUIZ_COLORS.secondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  cardText: {
    flex: 1,
    color: QUIZ_COLORS.ink,
    lineHeight: 18,
  },
});

export default MatchBoard;
