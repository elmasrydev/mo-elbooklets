import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { isArabicText } from '../../config/fonts';
import { QUIZ_COLORS } from '../../config/colors';
import type { ReviewUserAnswer } from '../../utils/quizResultGroups';
import ScoreStrip from './ScoreStrip';
import QuizBottomSheet from './QuizBottomSheet';

/**
 * Groups a paragraph's sub-question result rows under their passage (the review
 * counterpart of the reading solve view). Shows a passage header with a "view
 * passage" sheet, a score strip for the group, then each child rendered by the
 * screen's existing per-question card renderer.
 */

type ParagraphReviewGroupProps = {
  passage: string;
  /** The children to render — already narrowed by the active filter. */
  childRows: ReviewUserAnswer[];
  /**
   * Every child of this passage, unfiltered. The score has to come from these:
   * derived from `childRows` it would follow the filter, so the Correct tab
   * would show a passage as full marks and the Wrong tab as zero.
   */
  scoreRows: ReviewUserAnswer[];
  renderChildCard: (row: ReviewUserAnswer) => React.ReactNode;
  contentAlign: 'left' | 'right';
};

const ParagraphReviewGroup: React.FC<ParagraphReviewGroupProps> = ({
  passage,
  childRows,
  scoreRows,
  renderChildCard,
  contentAlign,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { typography } = useTypography();
  const [sheetOpen, setSheetOpen] = useState(false);

  const total = scoreRows.length;
  const correctCount = scoreRows.filter((r) => r.is_correct).length;
  const score = scoreRows.reduce((sum, r) => sum + (r.score ?? (r.is_correct ? 1 : 0)), 0);

  return (
    // One grouped box (passage header + score + its sub-question cards) so the
    // review reads as a single unit tied to the passage. Theme-aware: a subtle
    // branded tint that keeps the child cards distinct in light and dark.
    <View
      style={[
        styles.group,
        { backgroundColor: theme.colors.primary + '12', borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.chip}>
          <Ionicons name="book-outline" size={14} color={QUIZ_COLORS.navy} />
          <Text style={[styles.chipText, typography('label', '700')]}>
            {t('quiz_taking.passage', 'Reading passage')}
          </Text>
        </View>
        <Pressable
          style={styles.viewBtn}
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('quiz_taking.passage', 'Reading passage')}
          testID="paragraph-review-view-passage"
        >
          <Ionicons name="reader-outline" size={14} color={QUIZ_COLORS.navy} />
          <Text style={[styles.viewBtnText, typography('label', '800')]}>
            {t('quiz_review.view_passage', 'View passage')}
          </Text>
        </Pressable>
      </View>

      <ScoreStrip
        score={score}
        total={total}
        correctCount={correctCount}
        wrongCount={total - correctCount}
        unitLabel={t('quiz_review.sub_questions', 'Questions')}
      />

      <View style={styles.children}>{childRows.map((child) => renderChildCard(child))}</View>

      <QuizBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        chipIcon="book-outline"
        chipLabel={t('quiz_taking.passage', 'Reading passage')}
        testID="paragraph-review-passage-sheet"
      >
        <Text
          style={[
            styles.passageText,
            typography('bodySmall', '600', isArabicText(passage)),
            { textAlign: contentAlign },
          ]}
        >
          {passage}
        </Text>
      </QuizBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  group: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: QUIZ_COLORS.sky,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    color: QUIZ_COLORS.navy,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF1F8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  viewBtnText: {
    color: QUIZ_COLORS.navy,
  },
  children: {
    gap: 11,
  },
  passageText: {
    color: QUIZ_COLORS.ink,
    lineHeight: 26,
    paddingBottom: 8,
  },
});

export default ParagraphReviewGroup;
