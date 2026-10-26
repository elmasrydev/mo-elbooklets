import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client/react';
import { CurriculumOptionsDocument } from '../generated/graphql';
import { useAuth } from '../context/AuthContext';
import { useCurriculum } from '../context/CurriculumContext';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';
import AppButton from '../components/AppButton';
import RetryView from '../components/RetryView';
import CurriculumPicker from '../components/curriculum/CurriculumPicker';
import {
  CurriculumSelection,
  EMPTY_SELECTION,
  findGrade,
  fromServer,
  gradeHasChoices,
  isSelectionComplete,
  missingPicks,
  toCurriculumInput,
} from '../utils/curriculum';
import { serverMessageOf, validationMessageOf } from '../utils/graphqlErrors';

type CurriculumSetupParams = {
  CurriculumSetup: { fromProfile?: boolean } | undefined;
};

/**
 * Track + elective picker for a signed-in student (contract §5).
 *
 * Two homes, one screen: the **gate** `AppNavigator` renders instead of the
 * tabs while `needsCurriculum` is true — no back button, no skip; saving
 * flips the flag in the cache and the navigator swaps to the tabs — and the
 * **editor** Profile opens (`fromProfile`), pre-filled, which pops on save.
 */
const CurriculumSetupScreen: React.FC = () => {
  const route = useRoute<RouteProp<CurriculumSetupParams, 'CurriculumSetup'>>();
  const fromProfile = route.params?.fromProfile ?? false;
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme, spacing } = useTheme();
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { specialityId, electiveSubjects, save } = useCurriculum();

  const options = useQuery(CurriculumOptionsDocument, { errorPolicy: 'all' });
  const grade = findGrade(options.data?.curriculumOptions, user?.grade_id);
  // `educational_system.id` is the fresher of the two after an in-app change
  // (see CurriculumContext); the id field covers sessions stored before it,
  // and String() a numeric id an older build may have stored.
  const storedSystemId = user?.educational_system?.id ?? user?.educational_system_id;
  const systemId = storedSystemId != null ? String(storedSystemId) : null;

  // Untouched = the server's picks; the student's edits take over from there.
  const [edited, setEdited] = useState<CurriculumSelection | null>(null);
  const value =
    edited ??
    (grade
      ? fromServer(
          grade,
          systemId,
          specialityId,
          electiveSubjects.map((subject) => subject.id),
        )
      : EMPTY_SELECTION);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const styles = useMemo(
    () => createStyles(theme, spacing, typography, insets.bottom),
    [theme, spacing, typography, insets.bottom],
  );

  const handleSave = async () => {
    if (!grade) return;
    if (!isSelectionComplete(missingPicks(grade, systemId, value))) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      await save(toCurriculumInput(grade, systemId, value));
      // Gate mode: the navigator has already swapped this screen out for the
      // tabs by now, so there is nothing to navigate.
      if (fromProfile) navigation.goBack();
    } catch (error) {
      setServerError(
        validationMessageOf(error, 'speciality_id') ??
          validationMessageOf(error, 'elective_subject_ids') ??
          serverMessageOf(error) ??
          t('common.unexpected_error'),
      );
    } finally {
      setSaving(false);
    }
  };

  const renderBody = () => {
    if (options.loading && !options.data) {
      return <ActivityIndicator style={styles.spinner} color={theme.colors.primary} />;
    }
    if (!grade || !gradeHasChoices(grade, systemId)) {
      return (
        <RetryView
          onRetry={() => options.refetch().catch(() => undefined)}
          message={grade ? t('curriculum.nothing_to_choose') : undefined}
        />
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>{t('curriculum.setup_subtitle')}</Text>
        <CurriculumPicker
          grade={grade}
          systemId={systemId}
          value={value}
          onChange={setEdited}
          showErrors={showErrors}
        />
        {serverError ? (
          <Text testID="curriculum-server-error" style={styles.serverError}>
            {serverError}
          </Text>
        ) : null}
        <AppButton
          testID="curriculum-save-button"
          title={t('common.save')}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
        />
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <UnifiedHeader title={t('curriculum.setup_title')} showBackButton={fromProfile} />
      {renderBody()}
    </View>
  );
};

const createStyles = (
  theme: ReturnType<typeof useTheme>['theme'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  typography: ReturnType<typeof useTypography>['typography'],
  bottomInset: number,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    spinner: { marginTop: spacing.xl },
    content: {
      padding: spacing.md,
      paddingBottom: bottomInset + spacing.lg,
    },
    subtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.lg,
      textAlign: 'left',
    },
    serverError: {
      ...typography('caption'),
      color: theme.colors.error,
      marginBottom: spacing.md,
      textAlign: 'left',
    },
  });

export default CurriculumSetupScreen;
