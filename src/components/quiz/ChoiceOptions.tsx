import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../hooks/useTypography';
import { QUIZ_COLORS } from '../../config/colors';
import { isArabicText } from '../../config/fonts';

/**
 * The pick-one option list for `mcq` / `true_false` questions — extracted
 * verbatim from QuizTakingScreen so the standalone rendering is unchanged, and
 * reused for paragraph sub-questions (which are always mcq/true_false).
 *
 * Answer text may carry a `\n`: the first line is the title, the rest a
 * subtitle. `true_false` answers ("True"/"False") are localized via `t()`.
 */

type ChoiceOptionsProps = {
  questionType: string;
  options: string[];
  selectedAnswer: string | null | undefined;
  onSelect: (answer: string) => void;
  /** Physical text alignment for the subject's script (from useSubjectTextAlign). */
  contentAlign: 'left' | 'right';
  /** Row direction so the radio sits on the correct side for the script. */
  contentRowDirection: 'row' | 'row-reverse';
  /** Prefix for each option's testID: `${testIDPrefix}-option-${index}`. */
  testIDPrefix: string;
  /** Slightly denser cards for nested (paragraph) use. */
  compact?: boolean;
};

const ChoiceOptions: React.FC<ChoiceOptionsProps> = ({
  questionType,
  options,
  selectedAnswer,
  onSelect,
  contentAlign,
  contentRowDirection,
  testIDPrefix,
  compact = false,
}) => {
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();

  const styles = useMemo(
    () => createStyles(typography, fontWeight, contentAlign, contentRowDirection, compact),
    [typography, fontWeight, contentAlign, contentRowDirection, compact],
  );

  const labelFor = (title: string): string => {
    if (questionType === 'true_false') {
      const normalized = title.trim().toLowerCase();
      if (normalized === 'true') return t('common.true');
      if (normalized === 'false') return t('common.false');
    }
    return title;
  };

  return (
    <View style={styles.container}>
      {options.map((answer, index) => {
        const isSelected = selectedAnswer === answer;
        const parts = answer.split('\n');
        const hasSubtitle = parts.length > 1;

        return (
          <TouchableOpacity
            key={`${answer}-${index}`}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => onSelect(answer)}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            testID={`${testIDPrefix}-option-${index}`}
          >
            <View style={styles.radioContainer}>
              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.title,
                  isSelected && styles.titleSelected,
                  typography(compact ? 'bodySmall' : 'body', undefined, isArabicText(parts[0])),
                ]}
              >
                {labelFor(parts[0])}
              </Text>
              {hasSubtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    isSelected && styles.subtitleSelected,
                    typography('caption', undefined, isArabicText(parts.slice(1).join('\n'))),
                  ]}
                >
                  {parts.slice(1).join('\n')}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (
  typography: ReturnType<typeof useTypography>['typography'],
  fontWeight: ReturnType<typeof useTypography>['fontWeight'],
  contentAlign: 'left' | 'right',
  contentRowDirection: 'row' | 'row-reverse',
  compact: boolean,
) =>
  StyleSheet.create({
    container: {
      gap: compact ? 8 : 16,
    },
    card: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      backgroundColor: QUIZ_COLORS.cardBg,
      padding: compact ? 12 : 16,
      borderRadius: compact ? 14 : 24,
      borderWidth: compact ? 2 : 1.5,
      borderColor: QUIZ_COLORS.line,
      gap: 7,
    },
    cardSelected: {
      backgroundColor: QUIZ_COLORS.selectedBg,
      borderColor: QUIZ_COLORS.navy,
    },
    radioContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioCircle: {
      width: compact ? 20 : 24,
      height: compact ? 20 : 24,
      borderRadius: compact ? 10 : 12,
      borderWidth: 2,
      borderColor: '#D1D5DB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioCircleSelected: {
      borderColor: QUIZ_COLORS.navy,
    },
    radioDot: {
      width: compact ? 8 : 10,
      height: compact ? 8 : 10,
      borderRadius: compact ? 4 : 5,
      backgroundColor: QUIZ_COLORS.navy,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      ...typography(compact ? 'bodySmall' : 'body'),
      color: '#374151',
      ...fontWeight('bold'),
      textAlign: contentAlign,
    },
    titleSelected: {
      color: QUIZ_COLORS.navy,
    },
    subtitle: {
      ...typography('caption'),
      color: QUIZ_COLORS.secondary,
      marginTop: 4,
      lineHeight: 20,
      textAlign: contentAlign,
    },
    subtitleSelected: {
      color: '#4B5563',
    },
  });

export default ChoiceOptions;
