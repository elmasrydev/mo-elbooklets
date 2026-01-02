import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
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
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
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
      if (!token) {
        setError(t('common.error'));
        return;
      }

      const result = await tryFetchWithFallback(`
        query SubjectsForUserGrade {
          subjectsForUserGrade {
            id
            name
            description
          }
        }
      `, undefined, token);
      if (result.data?.subjectsForUserGrade) {
        setSubjects(result.data.subjectsForUserGrade);
      } else {
        setError(result.errors?.[0]?.message || t('quiz_subjects.error_loading_subjects'));
      }
    } catch (err: any) {
      console.error('Fetch subjects error:', err);
      setError(err.message || t('quiz_subjects.error_loading_subjects'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectPress = (subject: Subject) => {
    onSubjectSelect(subject);
  };

  const currentStyles = styles(theme, isRTL);

  if (loading) {
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('quiz_subjects.header_title')}</Text>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>{t('quiz_subjects.loading_subjects')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.header}>
          <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
            <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={currentStyles.headerTitle}>{t('quiz_subjects.header_title')}</Text>
        </View>
        <View style={currentStyles.errorContainer}>
          <Text style={currentStyles.errorIcon}>⚠️</Text>
          <Text style={currentStyles.errorTitle}>{t('quiz_subjects.error_loading_subjects')}</Text>
          <Text style={currentStyles.errorText}>{error}</Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchSubjects}>
            <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={currentStyles.container}>
      <View style={currentStyles.header}>
        <TouchableOpacity style={currentStyles.backButton} onPress={onBack}>
          <Text style={currentStyles.backButtonText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={currentStyles.headerTitle}>{t('quiz_subjects.header_title')}</Text>
        <Text style={currentStyles.headerSubtitle}>{t('quiz_subjects.header_subtitle')}</Text>
      </View>

      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        <View style={currentStyles.subjectsGrid}>
          {subjects.map((subject: Subject) => (
            <TouchableOpacity
              key={subject.id}
              style={currentStyles.subjectCard}
              onPress={() => handleSubjectPress(subject)}
            >
              <View style={currentStyles.subjectIcon}>
                <Text style={currentStyles.subjectIconText}>
                  {getSubjectIcon(subject.name)}
                </Text>
              </View>
              <Text style={currentStyles.subjectName}>{subject.name}</Text>
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
            <Text style={currentStyles.emptyStateTitle}>{t('quiz_subjects.no_subjects_available')}</Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {t('quiz_subjects.no_subjects_for_grade')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const getSubjectIcon = (subjectName: string): string => {
  const name = subjectName.toLowerCase();
  if (name.includes('math') || name.includes('رياضيات')) return '🔢';
  if (name.includes('english') || name.includes('language') || name.includes('لغة')) return '📝';
  if (name.includes('science') || name.includes('علوم')) return '🔬';
  if (name.includes('history') || name.includes('social') || name.includes('تاريخ')) return '📜';
  if (name.includes('art') || name.includes('فن')) return '🎨';
  if (name.includes('music') || name.includes('موسيقى')) return '🎵';
  if (name.includes('physical') || name.includes('sport') || name.includes('رياضة')) return '⚽';
  if (name.includes('computer') || name.includes('tech') || name.includes('حاسوب')) return '💻';
  return '📖';
};

const styles = (theme: any, isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.headerText,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
    marginTop: 4,
    color: theme.colors.headerSubtitle,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.textSecondary,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.buttonPrimary,
  },
  retryButtonText: {
    color: theme.colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  subjectCard: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subjectIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: theme.colors.iconBackground,
  },
  subjectIconText: {
    fontSize: 28,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.text,
  },
  subjectDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    color: theme.colors.textSecondary,
  },
  subjectStats: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectStatsText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: theme.colors.card,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
});

export default QuizSubjectsScreen;
