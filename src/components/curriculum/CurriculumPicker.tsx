import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTypography } from '../../hooks/useTypography';
import ChoiceChips from '../ChoiceChips';
import {
  CurriculumSelection,
  GradeCurriculum,
  missingPicks,
  selectElective,
  selectSpeciality,
  visibleGroups,
} from '../../utils/curriculum';

/**
 * Track + elective pickers for a grade that has them (contract §3): the track
 * first (when `has_specialities`), then one single-choice group per core
 * elective and per elective of the chosen track, each under its API `label`.
 * Controlled; the reset rules live in `utils/curriculum.ts`. Used by the
 * registration form and `CurriculumSetupScreen`.
 */
interface CurriculumPickerProps {
  grade: GradeCurriculum;
  /** Filters the electives to the student's system; `null` shows every copy. */
  systemId: string | null;
  value: CurriculumSelection;
  onChange: (next: CurriculumSelection) => void;
  /** Show the per-section message for what is still unanswered. */
  showErrors: boolean;
}

const CurriculumPicker: React.FC<CurriculumPickerProps> = ({
  grade,
  systemId,
  value,
  onChange,
  showErrors,
}) => {
  const { t } = useTranslation();
  const { theme, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const { typography } = useTypography();
  const styles = useMemo(
    () => createStyles(theme, spacing, isRTL, typography),
    [theme, spacing, isRTL, typography],
  );

  const missing = showErrors ? missingPicks(grade, systemId, value) : null;
  const groups = visibleGroups(grade, systemId, value.specialityId);

  return (
    <View testID="curriculum-picker">
      {grade.has_specialities && (
        <>
          <Text style={styles.sectionLabel}>{t('curriculum.track_title')}</Text>
          <ChoiceChips
            fullWidth
            options={grade.specialities}
            selectedId={value.specialityId}
            onSelect={(id) => onChange(selectSpeciality(value, grade, id))}
            testIDPrefix="curriculum-track"
          />
          {missing?.speciality && (
            <Text testID="curriculum-track-error" style={styles.errorText}>
              {t('curriculum.choose_track')}
            </Text>
          )}
        </>
      )}
      {groups.map((group) => (
        <View key={group.group}>
          <Text style={styles.sectionLabel}>{group.label}</Text>
          <ChoiceChips
            options={group.subjects}
            selectedId={value.electiveByGroup[group.group] ?? null}
            onSelect={(id) => onChange(selectElective(value, group.group, id))}
            testIDPrefix={`curriculum-${group.group}`}
          />
          {missing?.groups.includes(group.group) && (
            <Text testID={`curriculum-${group.group}-error`} style={styles.errorText}>
              {t('curriculum.choose_one_per_group')}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

const createStyles = (
  theme: ReturnType<typeof useTheme>['theme'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  isRTL: boolean,
  typography: ReturnType<typeof useTypography>['typography'],
) =>
  StyleSheet.create({
    // Same section label as the registration form's grade/system headings.
    sectionLabel: {
      ...typography('label', '900'),
      fontSize: 14,
      color: theme.colors.textSecondary,
      textTransform: isRTL ? 'none' : 'uppercase',
      letterSpacing: isRTL ? 0 : 1.5,
      marginBottom: spacing.sm,
      textAlign: 'left',
    },
    errorText: {
      ...typography('caption'),
      color: theme.colors.error,
      // Pull up under the grid, which carries its own bottom margin.
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.sm,
      textAlign: 'left',
    },
  });

export default CurriculumPicker;
