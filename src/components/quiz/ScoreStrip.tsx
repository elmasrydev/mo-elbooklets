import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { formatScore } from '../../lib/scoreUtils';
import { QUIZ_COLORS } from '../../config/colors';

/**
 * The review score strip for a match or paragraph result (from the mockups): a
 * score badge (units earned / total units, coloured full / partial / zero) and,
 * on the right, a unit label with the correct/wrong split and a mini bar.
 */

type ScoreStripProps = {
  score: number; // units earned in this group
  total: number; // total units
  correctCount: number;
  wrongCount: number;
  unitLabel: string; // e.g. "Connections" / "Questions"
};

const ScoreStrip: React.FC<ScoreStripProps> = ({
  score,
  total,
  correctCount,
  wrongCount,
  unitLabel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { typography } = useTypography();

  const badgeColor =
    total > 0 && score >= total
      ? QUIZ_COLORS.ok
      : score <= 0
        ? QUIZ_COLORS.bad
        : QUIZ_COLORS.warning;
  const okPct = total > 0 ? (correctCount / total) * 100 : 0;
  const badPct = total > 0 ? (wrongCount / total) * 100 : 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.badge}>
        <Text style={[styles.badgeValue, typography('h2', '800'), { color: badgeColor }]}>
          {formatScore(score)}
          <Text
            style={[
              typography('caption', '700'),
              styles.badgeDenominator,
              { color: theme.colors.textTertiary },
            ]}
          >
            /{total}
          </Text>
        </Text>
        <Text
          style={[styles.badgeLabel, typography('label'), { color: theme.colors.textTertiary }]}
        >
          {t('quiz_review.question_score', 'Question score')}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.side}>
        <View style={styles.sideRow}>
          <Text
            style={[
              styles.sideLabel,
              typography('caption', '700'),
              { color: theme.colors.textSecondary },
            ]}
          >
            {unitLabel}
          </Text>
          <Text
            style={[
              styles.sideCount,
              typography('caption', '700'),
              { color: theme.colors.textSecondary },
            ]}
          >
            {correctCount} / {total}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.trackOk, { width: `${okPct}%` }]} />
          <View style={[styles.trackBad, { width: `${badPct}%` }]} />
        </View>
        <View style={styles.sideRow}>
          <Text style={[styles.okText, typography('label', '700')]}>
            {t('quiz_review.n_correct', '{{count}} correct', { count: correctCount })}
          </Text>
          <Text style={[styles.badText, typography('label', '700')]}>
            {t('quiz_review.n_wrong', '{{count}} wrong', { count: wrongCount })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  badge: {
    alignItems: 'center',
    minWidth: 60,
  },
  badgeValue: {
    writingDirection: 'ltr',
  },
  badgeDenominator: {
    // No bare `fontWeight`/`fontSize` here — the family+weight pair comes from
    // typography() above, because a raw fontWeight drops the custom family on
    // Android and the denominator would render in a different face from the
    // numerator beside it.
  },
  badgeLabel: {
    marginTop: 3,
    textAlign: 'center',
  },
  divider: {
    width: 1.5,
    alignSelf: 'stretch',
  },
  side: {
    flex: 1,
  },
  sideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideLabel: {},
  sideCount: {
    writingDirection: 'ltr',
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    marginVertical: 7,
  },
  trackOk: {
    height: '100%',
    backgroundColor: QUIZ_COLORS.ok,
  },
  trackBad: {
    height: '100%',
    backgroundColor: QUIZ_COLORS.bad,
    opacity: 0.72,
  },
  okText: {
    color: QUIZ_COLORS.ok,
  },
  badText: {
    color: QUIZ_COLORS.bad,
  },
});

export default ScoreStrip;
