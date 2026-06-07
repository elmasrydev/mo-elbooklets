import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';
import { layout } from '../../config/layout';
import { useNavigation } from '@react-navigation/native';
import { tryFetchWithFallback } from '../../config/api';
import QuizFlowHeader from '../../components/QuizFlowHeader';
import SubjectIcon from '../../components/SubjectIcon';
import { GenericListSkeleton } from '../../components/SkeletonLoader';
import RetryView from '../../components/RetryView';
import { getSubjectConfig } from '../../utils/subjectTheme';

interface Subject {
  id: string;
  name: string;
  description?: string;
  language?: string;
  chapters?: { id: string }[];
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
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        if (__DEV__) console.warn('[QuizSubjectsScreen] No auth token found');
        return;
      }
      const result = await tryFetchWithFallback(
        `query SubjectsForUserGrade { subjectsForUserGrade { id name description language chapters { id } } }`,
        undefined,
        token,
      );
      if (__DEV__) console.log('[QuizSubjectsScreen] fetchSubjects result:', JSON.stringify(result));
      
      if (result.data?.subjectsForUserGrade) {
        setSubjects(result.data.subjectsForUserGrade);
      } else {
        if (__DEV__) console.warn('[QuizSubjectsScreen] No subjectsForUserGrade in response:', result);
        setError(t('quiz_subjects.error_loading_subjects'));
      }
    } catch (err: any) {
      if (__DEV__) console.error('[QuizSubjectsScreen] fetchSubjects error:', err);
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

  if (loading) {
    return (
      <View style={currentStyles.container}>
        <QuizFlowHeader currentStep={1} />
        <View style={{ paddingTop: 16 }}>
          <GenericListSkeleton numItems={5} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={currentStyles.container}>
        <QuizFlowHeader currentStep={1} />
        <RetryView
          message={t('quiz_subjects.error_loading_subjects')}
          onRetry={fetchSubjects}
        />
      </View>
    );
  }

  return (
    <View style={currentStyles.container}>
      <QuizFlowHeader currentStep={1} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing.lg,
          paddingBottom: Math.max(common.insets.bottom, spacing.xl),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.pageHeader}>
          <Text style={currentStyles.pageTitle}>
            {t('quiz_flow.choose_subject')}
          </Text>
          <Text style={currentStyles.pageSubtitle}>
            {t('quiz_flow.choose_subject_subtitle')}
          </Text>
        </View>

        <View style={currentStyles.subjectsGrid}>
          {subjects.map((subject: Subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              currentStyles={currentStyles}
              theme={theme}
              onPress={() => navigation.navigate('QuizFlowLessons', { subject })}
            />
          ))}
        </View>

        {subjects.length === 0 && (
          <View style={currentStyles.emptyState}>
            <Text style={currentStyles.emptyStateTitle}>
              {t('quiz_subjects.no_subjects_available')}
            </Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {t('quiz_subjects.no_subjects_for_grade')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

interface SubjectCardProps {
  subject: Subject;
  currentStyles: ReturnType<typeof styles>;
  theme: any;
  onPress: () => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, currentStyles, theme, onPress }) => {
  const { t } = useTranslation();
  const { contentAlign } = useSubjectTextAlign(subject.language);
  const subjectConfig = getSubjectConfig(subject.name, theme);

  return (
    <TouchableOpacity
      style={[
        currentStyles.subjectCard,
        { borderColor: 'transparent' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={currentStyles.cardHeader}>
        <View
          style={[
            currentStyles.iconContainer,
            { backgroundColor: subjectConfig.bg || '#F3F5FB' },
          ]}
        >
          <SubjectIcon
            subjectName={subject.name}
            size={48}
            style={{}}
          />
        </View>
      </View>

      <Text style={[currentStyles.subjectName, { textAlign: contentAlign }]} numberOfLines={1}>
        {subject.name}
      </Text>

      <Text style={currentStyles.subjectUnitsCount}>
        {subject.chapters?.length === 1
          ? t('quiz_flow.units_count')
          : t('quiz_flow.units_count_plural', {
              count: subject.chapters?.length || 0,
            })}
      </Text>
    </TouchableOpacity>
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
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    pageHeader: {
      marginBottom: spacing.md,
    },
    pageTitle: {
      fontSize: 24,
      ...fontWeight('900'),
      color: theme.colors.text || '#0F172A',
      marginBottom: spacing.xs,
      textAlign: common.textAlign,
    },
    pageSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary || '#475569',
      textAlign: common.textAlign,
    },
    subjectsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingTop: spacing.sm,
    },
    subjectCard: {
      width: '47.5%',
      backgroundColor: theme.colors.card || '#FFFFFF',
      borderRadius: 20,
      padding: spacing.md,
      marginBottom: spacing.xs,
      borderWidth: 2,
      ...layout.shadow,
      alignItems: common.alignStart,
    },
    cardHeader: {
      width: '100%',
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    subjectName: {
      fontSize: 16,
      ...fontWeight('900'),
      color: theme.colors.text || '#0F172A',
      marginBottom: 2,
      textAlign: common.textAlign,
    },
    subjectUnitsCount: {
      ...typography('caption'),
      color: theme.colors.textSecondary || '#94A3B8',
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
