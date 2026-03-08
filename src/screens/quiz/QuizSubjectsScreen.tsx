import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { layout } from '../../config/layout';
import { useNavigation } from '@react-navigation/native';
import { tryFetchWithFallback } from '../../config/api';
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';
import SubjectIcon from '../../components/SubjectIcon';

interface Subject {
  id: string;
  name: string;
  description?: string;
}

const QuizSubjectsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      const result = await tryFetchWithFallback(
        `query SubjectsForUserGrade { subjectsForUserGrade { id name description } }`,
        undefined,
        token,
      );
      if (result.data?.subjectsForUserGrade) setSubjects(result.data.subjectsForUserGrade);
      else setError(t('quiz_subjects.error_loading_subjects'));
    } catch (err: any) {
      setError(t('quiz_subjects.error_loading_subjects'));
    } finally {
      setLoading(false);
    }
  };

  const currentStyles = styles(
    theme,
    common,
    typography,
    fontWeight,
    fontSizes,
    spacing,
    borderRadius,
  );

  if (loading)
    return (
      <View style={currentStyles.container}>
        <UnifiedHeader
          showBackButton
          onBackPress={() => navigation.goBack()}
          title={t('quiz_subjects.header_title')}
        />
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('quiz_subjects.loading_subjects')} </Text>
        </View>
      </View>
    );

  if (error)
    return (
      <View style={currentStyles.container}>
        <UnifiedHeader
          showBackButton
          onBackPress={() => navigation.goBack()}
          title={t('quiz_subjects.header_title')}
        />
        <View style={currentStyles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={spacing.icon.xl} color={theme.colors.error} />
          <Text style={currentStyles.errorTitle}>
            {' '}
            {t('quiz_subjects.error_loading_subjects')}{' '}
          </Text>
          <AppButton
            title={t('home_screen.try_again')}
            onPress={fetchSubjects}
            size="sm"
            fullWidth={false}
          />
        </View>
      </View>
    );

  return (
    <View style={currentStyles.container}>
      <UnifiedHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title={t('quiz_subjects.header_title')}
        subtitle={t('quiz_subjects.header_subtitle')}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: layout.screenPadding,
          paddingBottom: Math.max(common.insets.bottom, spacing.xl),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.pageHeader}>
          <Text style={currentStyles.pageTitle}>{t('quiz_subjects.page_title')}</Text>
          <Text style={currentStyles.pageSubtitle}>{t('quiz_subjects.page_subtitle')}</Text>
        </View>

        <View style={currentStyles.subjectsContainer}>
          {subjects.map((subject: Subject) => (
            <TouchableOpacity
              key={subject.id}
              style={currentStyles.subjectCard}
              onPress={() => navigation.navigate('QuizFlowLessons', { subject })}
              activeOpacity={0.7}
            >
              <View style={currentStyles.subjectMain}>
                <SubjectIcon
                  subjectName={subject.name}
                  size={48}
                  style={currentStyles.iconBoxOverride}
                />
                <View style={currentStyles.subjectInfo}>
                  <Text style={currentStyles.subjectName} numberOfLines={1}>
                    {subject.name}
                  </Text>
                  <Text style={currentStyles.subjectStatsText}>
                    {t('quiz_subjects.tap_to_start')}
                  </Text>
                </View>
              </View>

              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={24}
                color={theme.colors.textTertiary || '#E2E8F0'}
              />
            </TouchableOpacity>
          ))}
        </View>
        {subjects.length === 0 && (
          <View style={currentStyles.emptyState}>
            <Ionicons
              name="library-outline"
              size={spacing.icon.xl}
              color={theme.colors.textTertiary}
            />
            <Text style={currentStyles.emptyStateTitle}>
              {' '}
              {t('quiz_subjects.no_subjects_available')}{' '}
            </Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {' '}
              {t('quiz_subjects.no_subjects_for_grade')}{' '}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = (
  theme: any,
  common: any,
  typography: any,
  fontWeight: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: {
      marginTop: spacing.md,
      ...typography('body'),
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    errorTitle: {
      ...typography('h3'),
      ...fontWeight('bold'),
      marginTop: spacing.md,
      marginBottom: spacing.md,
      color: theme.colors.text,
    },
    pageHeader: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    pageTitle: {
      fontSize: Math.max(24, fontSizes.xl),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: spacing.xs,
      textAlign: common.textAlign,
    },
    pageSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    subjectsContainer: {
      flexDirection: 'column',
      gap: spacing.sm,
    },
    subjectCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      marginBottom: spacing.sm,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 16,
      borderWidth: 0,
      ...layout.shadow,
    },
    subjectMain: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      flex: 1,
    },
    iconBoxOverride: {
      ...common.marginEnd(spacing.md),
    },
    subjectInfo: {
      flex: 1,
      justifyContent: 'center',
      alignItems: common.alignStart,
    },
    subjectName: {
      fontSize: Math.max(18, fontSizes.lg),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: 2,
      textAlign: common.textAlign,
    },
    subjectStatsText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    emptyState: {
      padding: spacing.xl,
      borderRadius: borderRadius.xl,
      alignItems: 'center',
      marginTop: spacing.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyStateTitle: {
      ...typography('h3'),
      ...fontWeight('bold'),
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      color: theme.colors.text,
    },
    emptyStateSubtitle: {
      ...typography('caption'),
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
  });

export default QuizSubjectsScreen;
