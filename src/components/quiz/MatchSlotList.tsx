import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../hooks/useTypography';
import { isArabicText } from '../../config/fonts';
import { QUIZ_COLORS } from '../../config/colors';
import QuizBottomSheet from './QuizBottomSheet';
import type { MatchItem } from './MatchBoard';

/**
 * The "long content" match view from the mockup: full-width prompt cards, each
 * with a dashed answer slot that opens a bottom-sheet picker. Unlike the wires
 * board, picking an already-used answer here moves it (steals) to the new
 * prompt — matching the mockup's slot interaction.
 */

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

type MatchSlotListProps = {
  left: MatchItem[]; // prompts
  right: MatchItem[]; // answers
  pairs: Record<string, string>; // leftId -> rightId
  onChange: (pairs: Record<string, string>) => void;
  colorForLeftId: (leftId: string) => string;
  contentAlign: 'left' | 'right';
};

const MatchSlotList: React.FC<MatchSlotListProps> = ({
  left,
  right,
  pairs,
  onChange,
  colorForLeftId,
  contentAlign,
}) => {
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);

  const rightById = useMemo(() => {
    const map: Record<string, MatchItem> = {};
    right.forEach((item) => (map[item.id] = item));
    return map;
  }, [right]);

  const letterForRight = useMemo(() => {
    const map: Record<string, string> = {};
    right.forEach((item, i) => (map[item.id] = LETTERS[i] ?? String(i + 1)));
    return map;
  }, [right]);

  const leftNumberById = useMemo(() => {
    const map: Record<string, number> = {};
    left.forEach((item, i) => (map[item.id] = i + 1));
    return map;
  }, [left]);

  const selectAnswer = (leftId: string, rightId: string) => {
    const next = { ...pairs };
    // Steal the answer from any prompt already using it.
    const stolenFrom = Object.keys(next).find((lid) => next[lid] === rightId);
    if (stolenFrom) delete next[stolenFrom];
    next[leftId] = rightId;
    onChange(next);
    setActiveLeftId(null);
  };

  const clearSlot = (leftId: string) => {
    const next = { ...pairs };
    delete next[leftId];
    onChange(next);
  };

  const activePrompt = activeLeftId ? left.find((p) => p.id === activeLeftId) : null;

  return (
    <View style={styles.list}>
      {left.map((prompt, i) => {
        const chosenRightId = pairs[prompt.id];
        const chosenRight = chosenRightId ? rightById[chosenRightId] : null;
        const color = colorForLeftId(prompt.id);
        const filled = !!chosenRight;

        return (
          <View
            key={prompt.id}
            style={[styles.card, filled && { borderColor: color }]}
            testID={`match-slot-${prompt.id}`}
          >
            <View style={styles.promptRow}>
              <View style={[styles.chip, filled && { backgroundColor: color }]}>
                <Text
                  style={[
                    styles.chipText,
                    typography('label', '800'),
                    filled && styles.chipTextActive,
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.promptText,
                  typography('bodySmall', '700', isArabicText(prompt.text)),
                ]}
              >
                {prompt.text}
              </Text>
            </View>

            <Pressable
              onPress={() => setActiveLeftId(prompt.id)}
              accessibilityRole="button"
              accessibilityLabel={
                chosenRight
                  ? chosenRight.text
                  : t('quiz_taking.match_choose_answer', 'Choose the answer')
              }
              style={[
                styles.slot,
                filled && {
                  borderStyle: 'solid',
                  borderColor: mix(color),
                  backgroundColor: tint(color),
                },
              ]}
            >
              {chosenRight ? (
                <>
                  <View style={[styles.slotLetter, { backgroundColor: color }]}>
                    <Text style={[typography('label', '800'), styles.slotLetterText]}>
                      {letterForRight[chosenRight.id]}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.slotText,
                      typography('bodySmall', '700', isArabicText(chosenRight.text)),
                    ]}
                    numberOfLines={2}
                  >
                    {chosenRight.text}
                  </Text>
                  <Pressable
                    onPress={() => clearSlot(prompt.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.clear', 'Clear')}
                    testID={`match-slot-${prompt.id}-clear`}
                  >
                    <Ionicons name="close" size={16} color={QUIZ_COLORS.muted} />
                  </Pressable>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={18} color={QUIZ_COLORS.muted} />
                  <Text style={[styles.slotPlaceholder, typography('bodySmall', '700')]}>
                    {t('quiz_taking.match_choose_answer', 'Choose the answer')}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        );
      })}

      <QuizBottomSheet
        visible={activeLeftId !== null}
        onClose={() => setActiveLeftId(null)}
        testID="match-answer-sheet"
        headerAction={
          activeLeftId && pairs[activeLeftId] ? (
            <Pressable
              onPress={() => {
                clearSlot(activeLeftId);
                setActiveLeftId(null);
              }}
              style={styles.sheetClear}
              accessibilityRole="button"
              accessibilityLabel={t('common.clear', 'Clear')}
              testID="match-sheet-clear"
            >
              <Ionicons name="close-circle-outline" size={14} color={QUIZ_COLORS.bad} />
              <Text style={[styles.sheetClearText, typography('label'), fontWeight('700')]}>
                {t('common.clear', 'Clear')}
              </Text>
            </Pressable>
          ) : undefined
        }
      >
        {activePrompt && (
          <>
            <Text style={[styles.sheetTitle, typography('bodySmall'), { textAlign: contentAlign }]}>
              {t('quiz_taking.match_sheet_title', 'Choose the answer for:')}{' '}
              <Text style={fontWeight('800')}>{activePrompt.text}</Text>
            </Text>
            {right.map((answer) => {
              const usedByLeftId = Object.keys(pairs).find((lid) => pairs[lid] === answer.id);
              const usedByNumber = usedByLeftId ? leftNumberById[usedByLeftId] : null;
              const color = usedByLeftId ? colorForLeftId(usedByLeftId) : QUIZ_COLORS.navy;
              return (
                <Pressable
                  key={answer.id}
                  onPress={() => selectAnswer(activePrompt.id, answer.id)}
                  style={styles.sheetOption}
                  accessibilityRole="button"
                  accessibilityLabel={answer.text}
                  testID={`match-sheet-option-${answer.id}`}
                >
                  <View style={styles.sheetLetter}>
                    <Text style={[styles.chipText, typography('label', '800')]}>
                      {letterForRight[answer.id]}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sheetOptionText,
                      typography('bodySmall', '700', isArabicText(answer.text)),
                    ]}
                  >
                    {answer.text}
                  </Text>
                  {usedByNumber != null && (
                    <View style={[styles.usedBadge, { backgroundColor: color }]}>
                      <Text style={[typography('label', '800'), styles.usedBadgeText]}>
                        {usedByNumber}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </>
        )}
      </QuizBottomSheet>
    </View>
  );
};

const tint = (hex: string): string => `${hex}0D`; // ~5% alpha
const mix = (hex: string): string => `${hex}73`; // ~45% alpha border

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: QUIZ_COLORS.cardBg,
    borderWidth: 2,
    borderColor: QUIZ_COLORS.line,
    borderRadius: 16,
    padding: 13,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },
  chip: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#EEF1F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  chipText: {
    color: QUIZ_COLORS.secondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  promptText: {
    flex: 1,
    color: QUIZ_COLORS.ink,
    lineHeight: 20,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#B9C4DC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  slotLetter: {
    width: 20,
    height: 20,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotLetterText: {
    color: '#FFFFFF',
  },
  slotText: {
    flex: 1,
    color: QUIZ_COLORS.ink,
  },
  slotPlaceholder: {
    flex: 1,
    color: QUIZ_COLORS.muted,
  },
  sheetTitle: {
    color: QUIZ_COLORS.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  sheetClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: QUIZ_COLORS.badBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  sheetClearText: {
    color: QUIZ_COLORS.bad,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: QUIZ_COLORS.line,
    borderRadius: 13,
    padding: 12,
    marginBottom: 9,
  },
  sheetLetter: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#EEF1F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptionText: {
    flex: 1,
    color: QUIZ_COLORS.ink,
    lineHeight: 20,
  },
  usedBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usedBadgeText: {
    color: '#FFFFFF',
  },
});

export default MatchSlotList;
