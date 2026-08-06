import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../hooks/useTypography';
import { isArabicText } from '../../config/fonts';
import { QUIZ_COLORS } from '../../config/colors';
import ChoiceOptions from './ChoiceOptions';
import QuestionImage from './QuestionImage';

/**
 * The `paragraph` solve view from the reading mockup: a collapsible passage card
 * on top, then the ordered sub-questions (always mcq/true_false) as numbered
 * cards whose badge turns into a green check once answered. The floating
 * "Passage" FAB + its sheet are rendered by the screen (so they stay fixed while
 * scrolling); the passage is also re-readable here by expanding the card.
 */

export type ParagraphChild = {
  id: string;
  questionNumber: number;
  type: string;
  question: string;
  answers: string[];
  imageUrl: string | null;
};

type ParagraphQuestionProps = {
  passage: string;
  childQuestions: ParagraphChild[];
  answers: Record<string, string>; // childId -> answer
  onChildChange: (childId: string, answer: string) => void;
  contentAlign: 'left' | 'right';
  contentRowDirection: 'row' | 'row-reverse';
};

const readingMinutes = (passage: string): number => {
  const words = passage.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const ParagraphQuestion: React.FC<ParagraphQuestionProps> = ({
  passage,
  childQuestions,
  answers,
  onChildChange,
  contentAlign,
  contentRowDirection,
}) => {
  const { t } = useTranslation();
  const { typography } = useTypography();
  const [collapsed, setCollapsed] = useState(false);
  const chevron = useSharedValue(0);

  const minutes = useMemo(() => readingMinutes(passage), [passage]);

  const answeredCount = childQuestions.filter(
    (child) => (answers[child.id] ?? '').trim() !== '',
  ).length;
  const done = childQuestions.length > 0 && answeredCount === childQuestions.length;

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    chevron.value = withTiming(next ? 1 : 0, { duration: 200 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * 180}deg` }],
  }));

  return (
    // One grouped box (passage + its sub-questions) so it reads as a single
    // unit — the tinted surface + border tie the questions to their passage.
    <View style={styles.box}>
      {/* Collapsible passage card */}
      <View style={styles.passageCard}>
        <Pressable
          style={styles.passageHead}
          onPress={toggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: !collapsed }}
          testID="paragraph-passage-toggle"
        >
          <View style={styles.passageChip}>
            <Ionicons name="book-outline" size={14} color={QUIZ_COLORS.navy} />
            <Text style={[styles.passageChipText, typography('label', '700')]}>
              {t('quiz_taking.passage', 'Reading passage')}
            </Text>
          </View>
          <View style={styles.passageMeta}>
            <Text style={[styles.passageMetaText, typography('label', '700')]}>
              {t('quiz_taking.min_read', '~{{count}} min read', { count: minutes })}
            </Text>
            <Animated.View style={chevronStyle}>
              <Ionicons name="chevron-up" size={18} color={QUIZ_COLORS.secondary} />
            </Animated.View>
          </View>
        </Pressable>
        {!collapsed && (
          <Text
            style={[
              styles.passageBody,
              typography('bodySmall', '600', isArabicText(passage)),
              { textAlign: contentAlign },
            ]}
          >
            {passage}
          </Text>
        )}
      </View>

      {/* Helper + counter */}
      <View style={styles.helperRow}>
        <View style={styles.helper}>
          <Ionicons
            name={done ? 'checkmark-circle' : 'book-outline'}
            size={15}
            color={done ? QUIZ_COLORS.ok : QUIZ_COLORS.secondary}
          />
          <Text
            style={[
              styles.helperText,
              typography('caption'),
              { color: done ? QUIZ_COLORS.ok : QUIZ_COLORS.secondary },
            ]}
          >
            {done
              ? t('quiz_taking.reading_helper_done', 'All answered — review, then tap Next.')
              : t(
                  'quiz_taking.reading_helper_base',
                  'Read the passage, then answer all {{count}} questions.',
                  {
                    count: childQuestions.length,
                  },
                )}
          </Text>
        </View>
        <View style={[styles.counter, done && styles.counterFull]} testID="paragraph-progress">
          <Text
            style={[styles.counterText, typography('label', '800'), done && styles.counterTextFull]}
          >
            {answeredCount} / {childQuestions.length}
          </Text>
        </View>
      </View>

      {/* Sub-questions */}
      <View style={styles.childCol}>
        {childQuestions.map((child) => {
          const answered = (answers[child.id] ?? '').trim() !== '';
          return (
            <View key={child.id} style={[styles.childCard, answered && styles.childCardDone]}>
              <View style={styles.childHead}>
                <View style={[styles.childNum, answered && styles.childNumDone]}>
                  {answered ? (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.childNumText, typography('label', '800')]}>
                      {child.questionNumber}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.childText,
                    typography('bodySmall', '700', isArabicText(child.question)),
                    { textAlign: contentAlign },
                  ]}
                >
                  {child.question}
                </Text>
              </View>

              {child.imageUrl && (
                <QuestionImage uri={child.imageUrl} testID={`paragraph-child-${child.id}-image`} />
              )}

              <ChoiceOptions
                questionType={child.type}
                options={child.answers}
                selectedAnswer={answers[child.id]}
                onSelect={(answer) => onChildChange(child.id, answer)}
                contentAlign={contentAlign}
                contentRowDirection={contentRowDirection}
                testIDPrefix={`paragraph-child-${child.id}`}
                compact
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#F4F7FD',
    borderWidth: 1.5,
    borderColor: '#D5DEF2',
    borderRadius: 20,
    padding: 12,
  },
  passageCard: {
    backgroundColor: QUIZ_COLORS.cardBg,
    borderWidth: 1.5,
    borderColor: QUIZ_COLORS.line,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  passageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
  },
  passageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: QUIZ_COLORS.sky,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  passageChipText: {
    color: QUIZ_COLORS.navy,
  },
  passageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passageMetaText: {
    color: QUIZ_COLORS.muted,
  },
  passageBody: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    color: QUIZ_COLORS.ink,
    lineHeight: 26,
  },
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
  childCol: {
    gap: 13,
  },
  childCard: {
    backgroundColor: QUIZ_COLORS.cardBg,
    borderWidth: 2,
    borderColor: QUIZ_COLORS.line,
    borderRadius: 17,
    padding: 15,
  },
  childCardDone: {
    borderColor: '#C6DBF3',
  },
  childHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 12,
  },
  childNum: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#EEF1F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  childNumDone: {
    backgroundColor: QUIZ_COLORS.ok,
  },
  childNumText: {
    color: QUIZ_COLORS.navy,
  },
  childText: {
    flex: 1,
    color: QUIZ_COLORS.ink,
    lineHeight: 20,
  },
});

export default ParagraphQuestion;
