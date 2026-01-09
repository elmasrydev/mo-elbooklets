import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../config/api';
import StudyChaptersScreen from './study/StudyChaptersScreen';
import StudyLessonScreen from './study/StudyLessonScreen';

interface Subject {
  id: string;
  name: string;
  description?: string;
  chapters: { id: string }[];
}

interface Lesson {
  id: string;
  name: string;
  summary?: string;
  points?: string[];
  chapter: {
    id: string;
    name: string;
    order: number;
  };
}

type StudyFlowStep = 'subjects' | 'chapters' | 'lesson';

const StudyScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StudyFlowStep>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentStep === 'subjects') {
        fetchSubjects();
      }
    }, [currentStep])
  );

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
            chapters {
              id
            }
          }
        }
      `, undefined, token);

      if (result.data?.subjectsForUserGrade) {
        setSubjects(result.data.subjectsForUserGrade);
      } else {
        setError(result.errors?.[0]?.message || t('study_screen.error_loading_subjects'));
      }
    } catch (err: any) {
      console.error('Fetch subjects error:', err);
      setError(err.message || t('study_screen.error_loading_subjects'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setCurrentStep('chapters');
  };

  const handleLessonSelect = (lesson: Lesson, lessons: Lesson[]) => {
    setSelectedLesson(lesson);
    setAllLessons(lessons);
    setCurrentStep('lesson');
  };

  const handleBackToSubjects = () => {
    setCurrentStep('subjects');
    setSelectedSubject(null);
  };

  const handleBackToChapters = () => {
    setCurrentStep('chapters');
    setSelectedLesson(null);
  };

  const handleNavigateLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  // Chapters screen
  if (currentStep === 'chapters' && selectedSubject) {
    return (
      <StudyChaptersScreen
        subject={selectedSubject}
        onLessonSelect={handleLessonSelect}
        onBack={handleBackToSubjects}
      />
    );
  }

  // Lesson detail screen
  if (currentStep === 'lesson' && selectedLesson) {
    return (
      <StudyLessonScreen
        lesson={selectedLesson}
        allLessons={allLessons}
        onBack={handleBackToChapters}
        onNavigateLesson={handleNavigateLesson}
      />
    );
  }

  const currentStyles = styles(theme, isRTL);

  const getSubjectIcon = (subjectName: string): string => {
    const name = subjectName.toLowerCase();
    if (name.includes('math') || name.includes('رياضيات')) return '📐';
    if (name.includes('arabic') || name.includes('عربي')) return '📖';
    if (name.includes('english') || name.includes('انجليزي')) return '🔤';
    if (name.includes('science') || name.includes('علوم')) return '🔬';
    if (name.includes('physics') || name.includes('فيزياء')) return '⚛️';
    if (name.includes('chemistry') || name.includes('كيمياء')) return '🧪';
    if (name.includes('biology') || name.includes('أحياء')) return '🧬';
    if (name.includes('history') || name.includes('تاريخ')) return '📜';
    if (name.includes('geography') || name.includes('جغرافيا')) return '🌍';
    return '📚';
  };

  return (
    <View style={currentStyles.container}>
      {/* Header */}
      <View style={currentStyles.header}>
        <Text style={currentStyles.headerTitle}>{t('study_screen.header_title')}</Text>
        <Text style={currentStyles.headerSubtitle}>{t('study_screen.header_subtitle')}</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={currentStyles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>{t('study_screen.loading_subjects')}</Text>
        </View>
      ) : error ? (
        <View style={currentStyles.errorState}>
          <Text style={currentStyles.errorStateIcon}>⚠️</Text>
          <Text style={currentStyles.errorStateTitle}>{t('study_screen.error_loading_subjects')}</Text>
          <Text style={currentStyles.errorStateSubtitle}>{error}</Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchSubjects}>
            <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
          </TouchableOpacity>
        </View>
      ) : subjects.length === 0 ? (
        <View style={currentStyles.emptyState}>
          <Text style={currentStyles.emptyStateIcon}>📚</Text>
          <Text style={currentStyles.emptyStateTitle}>{t('study_screen.no_subjects_available')}</Text>
          <Text style={currentStyles.emptyStateSubtitle}>
            {t('study_screen.no_subjects_for_grade')}
          </Text>
        </View>
      ) : (
        <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={currentStyles.subjectCard}
              onPress={() => handleSubjectSelect(subject)}
            >
              <View style={currentStyles.subjectIcon}>
                <Text style={currentStyles.subjectIconText}>{getSubjectIcon(subject.name)}</Text>
              </View>
              <View style={currentStyles.subjectInfo}>
                <Text style={currentStyles.subjectName}>{subject.name}</Text>
                {subject.description && (
                  <Text style={currentStyles.subjectDescription} numberOfLines={1}>
                    {subject.description}
                  </Text>
                )}
                <Text style={currentStyles.subjectChapters}>
                  {subject.chapters?.length || 0} {t('study_screen.chapters')}
                </Text>
              </View>
              <View style={currentStyles.subjectArrow}>
                <Text style={currentStyles.subjectArrowText}>{isRTL ? '←' : '→'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  errorStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  subjectCard: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}20`,
  },
  subjectIconText: {
    fontSize: 24,
  },
  subjectInfo: {
    flex: 1,
    marginLeft: isRTL ? 0 : 14,
    marginRight: isRTL ? 14 : 0,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  subjectDescription: {
    fontSize: 13,
    marginTop: 2,
    color: theme.colors.textSecondary,
  },
  subjectChapters: {
    fontSize: 12,
    marginTop: 4,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  subjectArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.border,
  },
  subjectArrowText: {
    fontSize: 16,
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
});

export default StudyScreen;
