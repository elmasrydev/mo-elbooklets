import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { isArabicText } from '../config/fonts';
import { CHOICE_CHIP_COLORS } from '../config/colors';

/**
 * The pick-one chip grid from the registration form (grade, educational
 * system), reused for the Baccalaureate track and elective pickers
 * (`CurriculumPicker`). Same look as before the extraction, with one change:
 * labels are server-supplied, so each chip's font now follows its own script
 * (the Arabic-font rule) rather than the UI language — a Languages-system
 * subject is "Mathematics" even under the Arabic UI.
 */

export interface ChoiceChipOption {
  id: string;
  name: string;
}

interface ChoiceChipsProps {
  options: readonly ChoiceChipOption[];
  selectedId: string | null | undefined;
  onSelect: (id: string) => void;
  /** Each chip's testID is `${testIDPrefix}-${option.id}`. */
  testIDPrefix: string;
  /** One chip per row — for long labels such as track names. */
  fullWidth?: boolean;
}

const ChoiceChips: React.FC<ChoiceChipsProps> = ({
  options,
  selectedId,
  onSelect,
  testIDPrefix,
  fullWidth = false,
}) => {
  const { spacing } = useTheme();
  const { typography } = useTypography();
  const styles = useMemo(() => createStyles(spacing, fullWidth), [spacing, fullWidth]);

  return (
    <View style={styles.gridContainer}>
      {options.map((option) => {
        const active = selectedId === option.id;
        return (
          <TouchableOpacity
            testID={`${testIDPrefix}-${option.id}`}
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[styles.gridItem, active && styles.gridItemActive]}
            onPress={() => onSelect(option.id)}
          >
            <Text
              style={[
                // Use the typography base so the Arabic font-family is applied on
                // iOS too; grade labels previously fell back to the system font
                // and looked inconsistent. (BKLT-255)
                typography('label', '700', isArabicText(option.name)),
                styles.gridItemText,
                active && styles.gridItemTextActive,
              ]}
            >
              {option.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (spacing: { xs: number; sm: number; md: number }, fullWidth: boolean) =>
  StyleSheet.create({
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.md,
      justifyContent: 'center',
    },
    gridItem: {
      minWidth: fullWidth ? '100%' : '31%',
      backgroundColor: CHOICE_CHIP_COLORS.bg,
      borderWidth: 1,
      borderColor: CHOICE_CHIP_COLORS.border,
      borderRadius: 12,
      height: 50,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: CHOICE_CHIP_COLORS.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    gridItemActive: {
      borderColor: CHOICE_CHIP_COLORS.active,
      backgroundColor: CHOICE_CHIP_COLORS.activeBg,
      ...Platform.select({
        ios: { shadowOpacity: 0 },
        android: { elevation: 0 },
      }),
    },
    gridItemText: {
      color: CHOICE_CHIP_COLORS.text,
    },
    gridItemTextActive: {
      color: CHOICE_CHIP_COLORS.active,
    },
  });

export default ChoiceChips;
