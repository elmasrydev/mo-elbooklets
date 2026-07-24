import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../hooks/useTypography';
import { MATCH_PAIR_COLORS, QUIZ_COLORS } from '../../config/colors';
import { matchTap, type MatchPending, type MatchSide } from '../../utils/matchInteraction';
import MatchBoard, { type MatchItem } from './MatchBoard';
import MatchSlotList from './MatchSlotList';

/**
 * Wraps a `match` question: chooses the wires board (short items) or the slots
 * list (long items), renders the helper row + counter + clear-all, and owns the
 * transient "armed" (pending) card for the wires interaction. The committed
 * pairs live in the quiz draft and flow in/out via props.
 */

// Items longer than this (or containing a newline) switch the whole question to
// the full-width slots view, where long text stays readable.
const SLOT_MODE_THRESHOLD = 44;

type MatchColumns = { left: MatchItem[]; right: MatchItem[] };

type MatchQuestionProps = {
  matchPairs: MatchColumns;
  pairs: Record<string, string>;
  onChange: (pairs: Record<string, string>) => void;
  contentAlign: 'left' | 'right';
};

const isLongText = (text: string): boolean =>
  text.length > SLOT_MODE_THRESHOLD || text.includes('\n');

const MatchQuestion: React.FC<MatchQuestionProps> = ({
  matchPairs,
  pairs,
  onChange,
  contentAlign,
}) => {
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const [pending, setPending] = useState<MatchPending>(null);

  const { left, right } = matchPairs;

  const useSlots = useMemo(
    () => [...left, ...right].some((item) => isLongText(item.text)),
    [left, right],
  );

  const colorForLeftId = useMemo(() => {
    const indexById: Record<string, number> = {};
    left.forEach((item, i) => (indexById[item.id] = i));
    return (leftId: string): string =>
      MATCH_PAIR_COLORS[(indexById[leftId] ?? 0) % MATCH_PAIR_COLORS.length];
  }, [left]);

  const connected = Object.keys(pairs).length;
  const total = left.length;
  const done = total > 0 && connected >= total;

  const handleTap = (side: MatchSide, id: string) => {
    const next = matchTap({ pairs, pending }, side, id);
    setPending(next.pending);
    if (next.pairs !== pairs) onChange(next.pairs);
  };

  const handleSlotsChange = (nextPairs: Record<string, string>) => {
    onChange(nextPairs);
  };

  const clearAll = () => {
    setPending(null);
    onChange({});
  };

  const helper = (() => {
    if (done)
      return {
        icon: 'checkmark-circle' as const,
        color: QUIZ_COLORS.ok,
        text: t('quiz_taking.match_helper_done', 'All connected — review, then tap Next.'),
      };
    if (!useSlots && pending)
      return {
        icon: 'arrow-forward' as const,
        color: QUIZ_COLORS.navy,
        text: t(
          'quiz_taking.match_helper_hint',
          'Now tap its match. Tap a connected item to undo.',
        ),
      };
    return {
      icon: 'hand-left-outline' as const,
      color: QUIZ_COLORS.secondary,
      text: useSlots
        ? t('quiz_taking.match_helper_slots', 'Tap a slot, then pick its answer.')
        : t(
            'quiz_taking.match_helper_base',
            'Tap an item, then tap its match in the other column.',
          ),
    };
  })();

  return (
    <View>
      <View style={styles.helperRow}>
        <View style={styles.helper}>
          <Ionicons name={helper.icon} size={15} color={helper.color} />
          <Text style={[styles.helperText, typography('caption'), { color: helper.color }]}>
            {helper.text}
          </Text>
        </View>
        <View style={[styles.counter, done && styles.counterFull]} testID="match-progress">
          <Text
            style={[styles.counterText, typography('label', '800'), done && styles.counterTextFull]}
          >
            {connected} / {total}
          </Text>
        </View>
      </View>

      {useSlots ? (
        <MatchSlotList
          left={left}
          right={right}
          pairs={pairs}
          onChange={handleSlotsChange}
          colorForLeftId={colorForLeftId}
          contentAlign={contentAlign}
        />
      ) : (
        <MatchBoard
          left={left}
          right={right}
          pairs={pairs}
          pending={pending}
          onTap={handleTap}
          colorForLeftId={colorForLeftId}
          contentAlign={contentAlign}
        />
      )}

      <View style={styles.clearRow}>
        <Pressable
          onPress={clearAll}
          disabled={connected === 0}
          style={[styles.clearBtn, connected === 0 && styles.clearBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={t('quiz_taking.clear_all', 'Clear all')}
          testID="match-clear-all"
        >
          <Ionicons name="refresh" size={14} color={QUIZ_COLORS.muted} />
          <Text style={[styles.clearText, typography('label'), fontWeight('700')]}>
            {t('quiz_taking.clear_all', 'Clear all')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  helper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helperText: {
    flex: 1,
    lineHeight: 18,
  },
  counter: {
    backgroundColor: QUIZ_COLORS.cardBg,
    borderWidth: 1.5,
    borderColor: QUIZ_COLORS.line,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  counterFull: {
    backgroundColor: QUIZ_COLORS.okBg,
    borderColor: QUIZ_COLORS.okBorder,
  },
  counterText: {
    color: QUIZ_COLORS.secondary,
  },
  counterTextFull: {
    color: QUIZ_COLORS.ok,
  },
  clearRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  clearBtnDisabled: {
    opacity: 0.4,
  },
  clearText: {
    color: QUIZ_COLORS.muted,
  },
});

export default MatchQuestion;
