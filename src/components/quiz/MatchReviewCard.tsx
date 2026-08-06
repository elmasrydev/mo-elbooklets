import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../hooks/useTypography';
import { isArabicText } from '../../config/fonts';
import { QUIZ_COLORS } from '../../config/colors';
import {
  buildMatchReviewRows,
  findSwappedPairs,
  type ReviewUserAnswer,
} from '../../utils/quizResultGroups';
import ScoreStrip from './ScoreStrip';

/**
 * The body of a match result (from the mockup): a score strip, a "you swapped
 * X and Y" insight when the student exchanged two answers, and one row per left
 * item showing the chosen vs correct right (resolved from `match_results` +
 * `matchColumns`). Rendered inside the existing review card wrapper, which
 * supplies the header, border and explanation box.
 */

type MatchReviewCardProps = {
  row: ReviewUserAnswer;
  contentAlign: 'left' | 'right';
};

const Chip: React.FC<{ text: string | null; correct: boolean; contentAlign: 'left' | 'right' }> = ({
  text,
  correct,
  contentAlign,
}) => {
  const { typography } = useTypography();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.chip,
        correct ? styles.chipOk : styles.chipBad,
        { borderColor: correct ? QUIZ_COLORS.okBorder : QUIZ_COLORS.badBorder },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          typography('label', '700', isArabicText(text ?? '')),
          { color: correct ? '#14532D' : '#7F1D1D', textAlign: contentAlign },
        ]}
        numberOfLines={2}
      >
        {text ?? t('quiz_review.no_answer', 'No answer')}
      </Text>
    </View>
  );
};

const MatchReviewCard: React.FC<MatchReviewCardProps> = ({ row, contentAlign }) => {
  const { t } = useTranslation();
  const { typography } = useTypography();

  const columns = row.question.matchColumns;
  const reviewRows = buildMatchReviewRows(row.match_results, columns);
  const swaps = findSwappedPairs(row.match_results, columns);

  const total = reviewRows.length;
  const correctCount = reviewRows.filter((r) => r.isCorrect).length;
  const score = row.score ?? correctCount;

  return (
    <View>
      <ScoreStrip
        score={score}
        total={total}
        correctCount={correctCount}
        wrongCount={total - correctCount}
        unitLabel={t('quiz_review.connections', 'Connections')}
      />

      {swaps.length > 0 && (
        <View style={styles.insight}>
          <Ionicons name="swap-vertical" size={17} color={QUIZ_COLORS.warning} />
          <Text style={[styles.insightText, typography('caption', '600'), { textAlign: 'left' }]}>
            {t(
              'quiz_review.swap_insight',
              'Heads up — you swapped the answers of items {{a}} and {{b}}.',
              {
                a: swaps[0].a + 1,
                b: swaps[0].b + 1,
              },
            )}
          </Text>
        </View>
      )}

      <View style={styles.rows}>
        {reviewRows.map((pair, index) => (
          <View
            key={pair.leftId}
            style={[
              styles.row,
              { borderColor: pair.isCorrect ? QUIZ_COLORS.okBorder : QUIZ_COLORS.badBorder },
            ]}
          >
            <View style={styles.rowTop}>
              <View
                style={[
                  styles.status,
                  { backgroundColor: pair.isCorrect ? QUIZ_COLORS.ok : QUIZ_COLORS.bad },
                ]}
              >
                <Ionicons name={pair.isCorrect ? 'checkmark' : 'close'} size={12} color="#FFFFFF" />
              </View>
              <Text
                style={[
                  styles.prompt,
                  typography('caption', '700', isArabicText(pair.leftText)),
                  { textAlign: contentAlign },
                ]}
              >
                <Text style={styles.promptNum}>{index + 1}. </Text>
                {pair.leftText}
              </Text>
            </View>
            <View style={styles.answers}>
              <View style={styles.answerCol}>
                <Text style={[styles.answerLabel, typography('label', '700')]}>
                  {t('quiz_review.your_answer', 'Your answer')}
                </Text>
                <Chip
                  text={pair.chosenRightText}
                  correct={pair.isCorrect}
                  contentAlign={contentAlign}
                />
              </View>
              {!pair.isCorrect && (
                <View style={styles.answerCol}>
                  <Text style={[styles.answerLabel, typography('label', '700')]}>
                    {t('quiz_review.correct_answer', 'Correct answer')}
                  </Text>
                  <Chip text={pair.correctRightText} correct contentAlign={contentAlign} />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: QUIZ_COLORS.warningBg,
    borderWidth: 1.5,
    borderColor: QUIZ_COLORS.warningBorder,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },
  insightText: {
    flex: 1,
    color: '#92400E',
    lineHeight: 19,
  },
  rows: {
    gap: 11,
  },
  row: {
    backgroundColor: QUIZ_COLORS.cardBg,
    borderWidth: 2,
    borderRadius: 17,
    padding: 13,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 10,
  },
  status: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prompt: {
    flex: 1,
    color: QUIZ_COLORS.ink,
    lineHeight: 19,
  },
  promptNum: {
    color: QUIZ_COLORS.navy,
  },
  answers: {
    flexDirection: 'column',
    gap: 10,
  },
  answerCol: {
    gap: 4,
  },
  answerLabel: {
    color: QUIZ_COLORS.muted,
    textTransform: 'uppercase',
    // 'left' + native RTL flip → right-aligned in Arabic, left in English.
    textAlign: 'left',
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  chipOk: {
    backgroundColor: '#FFFFFF',
  },
  chipBad: {
    backgroundColor: '#FFF5F5',
  },
  chipText: {},
});

export default MatchReviewCard;
