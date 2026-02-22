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
  const { typography } = useTypography();
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

  const currentStyles = styles(theme, common, typography, fontSizes, spacing, borderRadius);

  if (loading)
    return (
      <View style={currentStyles.container}>
        <View style={common.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Ionicons name={common.arrowBack as any} size={24} color={theme.colors.headerText} />
          </TouchableOpacity>
          <Text style={common.headerTitle}> {t('quiz_subjects.header_title')} </Text>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('quiz_subjects.loading_subjects')} </Text>
        </View>
      </View>
    );

  if (error)
    return (
      <View style={currentStyles.container}>
        <View style={common.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Ionicons name={common.arrowBack as any} size={24} color={theme.colors.headerText} />
          </TouchableOpacity>
          <Text style={common.headerTitle}> {t('quiz_subjects.header_title')} </Text>
        </View>
        <View style={currentStyles.errorContainer}>
          <Text style={currentStyles.errorIcon}>⚠️</Text>
          <Text style={currentStyles.errorTitle}>
            {' '}
            {t('quiz_subjects.error_loading_subjects')}{' '}
          </Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchSubjects}>
            <Text style={currentStyles.retryButtonText}> {t('home_screen.try_again')} </Text>
          </TouchableOpacity>
        </View>
      </View>
    );

  return (
    <View style={currentStyles.container}>
      <View style={common.header}>
        <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
          <Ionicons name={common.arrowBack as any} size={24} color={theme.colors.headerText} />
        </TouchableOpacity>
        <View style={common.headerTextWrapper}>
          <Text style={common.headerTitle}> {t('quiz_subjects.header_title')} </Text>
          <Text style={common.headerSubtitle}> {t('quiz_subjects.header_subtitle')} </Text>
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: layout.screenPadding, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.subjectsGrid}>
          {subjects.map((subject: Subject) => (
            <TouchableOpacity
              key={subject.id}
              style={currentStyles.subjectCard}
              onPress={() => onSubjectSelect(subject)}
            >
              <View style={currentStyles.subjectIcon}>
                <Text style={currentStyles.subjectIconText}> {getSubjectIcon(subject.name)} </Text>
              </View>
              <Text style={currentStyles.subjectName}> {subject.name} </Text>
              <Text style={currentStyles.subjectDescription}>
                {subject.description || t('quiz_subjects.test_knowledge')}
              </Text>
              <View style={currentStyles.subjectStats}>
                <Text style={currentStyles.subjectStatsText}>
                  {t('quiz_subjects.tap_to_start')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {subjects.length === 0 && (
          <View style={currentStyles.emptyState}>
            <Text style={currentStyles.emptyStateIcon}>📚</Text>
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

const styles = (
  theme: any,
  common: any,
  typography: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    backButton: { marginRight: common.isRTL ? 0 : 16, marginLeft: common.isRTL ? 16 : 0 },
    backButtonText: { ...typography('body'), fontWeight: '500', color: theme.colors.headerText },
    content: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, ...typography('body'), color: theme.colors.textSecondary },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorIcon: { fontSize: 48, marginBottom: 16 },
    errorTitle: {
      ...typography('h3'),
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.primary,
    },
    retryButtonText: { color: '#fff', ...typography('button') },
    subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    subjectCard: {
      width: '48%',
      padding: spacing.lg,
      borderRadius: layout.borderRadius.xl,
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      marginBottom: 16,
      ...layout.shadow,
    },
    subjectIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      backgroundColor: theme.colors.primaryLight || 'rgba(147, 51, 234, 0.05)',
    },
    subjectIconText: { fontSize: 28 },
    subjectName: {
      ...typography('body'),
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      color: theme.colors.text,
    },
    subjectDescription: {
      ...typography('caption'),
      textAlign: 'center',
      marginBottom: 12,
      color: theme.colors.textSecondary,
    },
    subjectStats: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    subjectStatsText: { ...typography('caption'), fontWeight: '500', color: theme.colors.primary },
    emptyState: {
      padding: 40,
      borderRadius: layout.borderRadius.xl,
      alignItems: 'center',
      marginTop: 40,
      backgroundColor: theme.colors.card,
    },
    emptyStateIcon: { fontSize: 48, marginBottom: 16 },
    emptyStateTitle: {
      ...typography('h3'),
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    emptyStateSubtitle: {
      ...typography('caption'),
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
  });

export default QuizSubjectsScreen;
