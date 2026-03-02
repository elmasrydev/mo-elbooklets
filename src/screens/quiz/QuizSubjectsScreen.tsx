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
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { layout } from '../../config/layout';
import { tryFetchWithFallback } from '../../config/api';
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';

interface Subject {
  id: string;
  name: string;
  description?: string;
}
interface QuizSubjectsScreenProps {
  onSubjectSelect: (subject: Subject) => void;
  onBack: () => void;
}

const QuizSubjectsScreen: React.FC<QuizSubjectsScreenProps> = ({ onSubjectSelect, onBack }) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight} = useTypography();
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

  const getSubjectIcon = (subjectName: string): string => {
    const name = subjectName.toLowerCase();
    if (name.includes('math') || name.includes('رياضيات')) return '🔢';
    if (name.includes('english') || name.includes('language') || name.includes('لغة')) return '📝';
    if (name.includes('science') || name.includes('علوم')) return '🔬';
    if (name.includes('history') || name.includes('social') || name.includes('تاريخ')) return '📜';
    if (name.includes('art') || name.includes('فن')) return '🎨';
    if (name.includes('physical') || name.includes('sport') || name.includes('رياضة')) return '⚽';
    return '📖';
  };

  const currentStyles = styles(theme, common, typography, fontWeight, fontSizes, spacing, borderRadius);

  if (loading)
    return (
      <View style={currentStyles.container}>
        <UnifiedHeader
          showBackButton
          onBackPress={onBack}
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
          onBackPress={onBack}
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
        isModal
        showBackButton
        onBackPress={onBack}
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
        <View style={currentStyles.subjectsGrid}>
          {subjects.map((subject: Subject) => (
            <TouchableOpacity
              key={subject.id}
              style={currentStyles.subjectCard}
              onPress={() => onSubjectSelect(subject)}
              activeOpacity={0.7}
            >
              <View style={currentStyles.subjectIcon}>
                <Text style={currentStyles.subjectIconText}> {getSubjectIcon(subject.name)} </Text>
              </View>
              <Text style={currentStyles.subjectName} numberOfLines={1}>
                {subject.name}
              </Text>
              <View style={currentStyles.subjectStats}>
                <Text style={currentStyles.subjectStatsText}>
                  {' '}
                  {t('quiz_subjects.tap_to_start')}{' '}
                </Text>
              </View>
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
    subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    subjectCard: {
      width: '48%',
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      marginBottom: spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    subjectIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
      backgroundColor: theme.colors.primary + '0D',
    },
    subjectIconText: { fontSize: 24 },
    subjectName: {
      ...typography('body'),
      ...fontWeight('bold'),
      textAlign: 'center',
      marginBottom: spacing.sm,
      color: theme.colors.text,
    },

    subjectStats: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.primary + '1A',
    },
    subjectStatsText: {
      ...typography('caption'),
      ...fontWeight('700'),
      color: theme.colors.primary,
      fontSize: 10,
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
