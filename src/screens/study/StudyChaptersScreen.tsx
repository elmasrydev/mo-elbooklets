import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../../config/api';
import { layout } from '../../config/layout';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useNavigation, useRoute } from '@react-navigation/native';
import BackButton from '../../components/navigation/BackButton';

interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface LessonPoint {
  id: string;
  title: string;
  explanation?: string;
  order: number;
}

interface Lesson {
  id: string;
  name: string;
  summary?: string;
  points?: string[];
  lessonPoints?: LessonPoint[];
  chapter: {
    id: string;
    name: string;
    order: number;
  };
}

interface Chapter {
  id: string;
  name: string;
  order: number;
  lessons: Lesson[];
}

const StudyChaptersScreen: React.FC = () => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const subject: Subject = route.params?.subject;

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLessons();
  }, [subject.id]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setError(t('common.error'));
        return;
      }

      const result = await tryFetchWithFallback(
        `
        query LessonsForSubject($subjectId: ID!) {
          lessonsForSubject(subjectId: $subjectId) {
            id
            name
            lessons {
              id
              name
              summary
              points
              lessonPoints {
                id
                title
                explanation
                order
              }
            }
          }
        }
      `,
        { subjectId: subject.id },
        token,
      );

      if (result.data?.lessonsForSubject) {
        const mappedChapters = result.data.lessonsForSubject.map((chapter: any, idx: number) => ({
          id: chapter.id,
          name: chapter.name,
          order: idx + 1,
          lessons: chapter.lessons.map((lesson: any) => ({
            ...lesson,
            chapter: { id: chapter.id, name: chapter.name, order: idx + 1 },
          })),
        }));
        setChapters(mappedChapters);
      } else {
        setError(result.errors?.[0]?.message || t('study_chapters.error_loading'));
      }
    } catch (err: any) {
      console.error('Fetch lessons error:', err);
      setError(err.message || t('study_chapters.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleLessonPress = (lesson: Lesson) => {
    const allLessons = chapters.flatMap((ch) => ch.lessons);
    navigation.navigate('StudyLesson', { lesson, allLessons });
  };

  const currentStyles = styles(theme, fontSizes, spacing, borderRadius, common);

  if (loading) {
    return (
      <View style={common.container}>
        <View style={common.header}>
          <BackButton />
          <View style={[common.headerTextWrapper, common.marginStart(12)]}>
            <Text style={common.headerTitle}> {subject.name} </Text>
          </View>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('study_chapters.loading')} </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={common.container}>
        <View style={common.header}>
          <BackButton />
          <View style={[common.headerTextWrapper, common.marginStart(12)]}>
            <Text style={common.headerTitle}> {subject.name} </Text>
          </View>
        </View>
        <View style={currentStyles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={theme.colors.error || '#EF4444'}
            style={{ marginBottom: 16 }}
          />
          <Text style={currentStyles.errorTitle}> {t('study_chapters.error_loading')} </Text>
          <Text style={currentStyles.errorText}> {error} </Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchLessons}>
            <Text style={currentStyles.retryButtonText}> {t('home_screen.try_again')} </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={common.container}>
      <View style={common.header}>
        <BackButton />
        <View style={[common.headerTextWrapper, common.marginStart(12)]}>
          <Text style={common.headerTitle}> {subject.name} </Text>
          <Text style={common.headerSubtitle}> {t('study_chapters.select_lesson')} </Text>
        </View>
      </View>

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={{ padding: layout.screenPadding, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {chapters.map((chapter) => (
          <View key={chapter.id} style={currentStyles.chapterCard}>
            <View style={currentStyles.chapterHeader}>
              <View style={currentStyles.chapterInfo}>
                <Text style={currentStyles.chapterName}> {chapter.name} </Text>
                <Text style={currentStyles.lessonCount}>
                  {chapter.lessons.length} {t('study_chapters.lessons')}
                </Text>
              </View>
              <View style={currentStyles.chapterIconContainer}>
                <Ionicons name="folder-open-outline" size={20} color={theme.colors.primary} />
              </View>
            </View>

            <View style={currentStyles.lessonsContainer}>
              {chapter.lessons.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={currentStyles.lessonItem}
                  onPress={() => handleLessonPress(lesson)}
                  activeOpacity={0.7}
                >
                  <View style={currentStyles.lessonIconContainer}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                  <View style={currentStyles.lessonInfo}>
                    <Text style={currentStyles.lessonName} numberOfLines={2}>
                      {' '}
                      {lesson.name}{' '}
                    </Text>
                    {lesson.summary && (
                      <Text style={currentStyles.lessonSummary} numberOfLines={1}>
                        {lesson.summary}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {chapters.length === 0 && (
          <View style={currentStyles.emptyState}>
            <Ionicons
              name="library-outline"
              size={48}
              color={theme.colors.textSecondary}
              style={{ marginBottom: 16 }}
            />
            <Text style={currentStyles.emptyStateTitle}> {t('study_chapters.no_chapters')} </Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {t('study_chapters.no_chapters_for_subject')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = (theme: any, fontSizes: any, spacing: any, borderRadius: any, common: any) =>
  StyleSheet.create({
    content: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: fontSizes.base, color: theme.colors.textSecondary },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    errorTitle: {
      fontSize: fontSizes.lg,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    errorText: {
      fontSize: fontSizes.sm,
      textAlign: 'center',
      marginBottom: 20,
      color: theme.colors.textSecondary,
    },
    chapterCard: {
      borderRadius: borderRadius.xl,
      marginBottom: spacing.lg,
      backgroundColor: theme.colors.card,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chapterHeader: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    chapterIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryLight || 'rgba(59, 130, 246, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    chapterInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    chapterName: {
      fontSize: fontSizes.base,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    lessonCount: {
      fontSize: fontSizes.xs,
      marginTop: 2,
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    lessonsContainer: {
      paddingVertical: 4,
    },
    lessonItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight || '#f3f4f6',
    },
    lessonIconContainer: {
      ...common.marginEnd(12),
    },
    lessonInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    lessonName: {
      fontSize: fontSizes.sm,
      fontWeight: '500',
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    lessonSummary: {
      fontSize: fontSizes.xs,
      marginTop: 2,
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    emptyState: {
      padding: 40,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 40,
    },
    emptyStateTitle: {
      fontSize: fontSizes.lg,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    emptyStateSubtitle: {
      fontSize: fontSizes.sm,
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.primary,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: fontSizes.base,
      fontWeight: '600',
    },
  });

export default StudyChaptersScreen;
