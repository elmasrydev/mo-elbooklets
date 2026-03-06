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
import { useTypography } from '../../hooks/useTypography';
import { useNavigation, useRoute } from '@react-navigation/native';
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';

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
  videoUrl?: string;
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
  const { typography } = useTypography();
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
              videoUrl
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

  const currentStyles = styles(theme, fontSizes, spacing, borderRadius, common, typography);

  if (loading) {
    return (
      <View style={common.container}>
        <UnifiedHeader showBackButton title={subject.name} />
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
        <UnifiedHeader showBackButton title={subject.name} />
        <View style={currentStyles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={spacing.icon.xl} color={theme.colors.error} />
          <Text style={currentStyles.errorTitle}> {t('study_chapters.error_loading')} </Text>
          <Text style={currentStyles.errorText}> {error} </Text>
          <AppButton
            title={t('home_screen.try_again')}
            onPress={fetchLessons}
            size="sm"
            fullWidth={false}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={common.container}>
      <UnifiedHeader showBackButton title={subject.name} />
      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing.md,
          paddingBottom: Math.max(common.insets.bottom, spacing.xl),
        }}
        showsVerticalScrollIndicator={false}
      >
        {chapters.map((chapter) => (
          <View key={chapter.id} style={currentStyles.chapterCard}>
            <View style={currentStyles.chapterHeader}>
              <View style={currentStyles.chapterIconContainer}>
                <Ionicons
                  name="library-outline"
                  size={spacing.icon.lg}
                  color={theme.colors.primary}
                />
              </View>
              <View style={currentStyles.chapterInfo}>
                <Text style={currentStyles.chapterName}>الدرس {chapter.name} </Text>
                <Text style={currentStyles.lessonCount}>
                  {chapter.lessons.length} {t('study_chapters.lessons')}
                </Text>
              </View>
            </View>
            <View style={currentStyles.lessonsContainer}>
              {chapter.lessons.map((lesson, index) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={currentStyles.lessonItem}
                  onPress={() => handleLessonPress(lesson)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      currentStyles.lessonIconContainer,
                      {
                        backgroundColor: theme.colors.primary + '0D', // 5% opacity
                        width: 32,
                        height: 32,
                        borderRadius: borderRadius.sm,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <Ionicons
                      name="newspaper-outline"
                      size={spacing.icon.sm}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={currentStyles.lessonInfo}>
                    <Text style={currentStyles.lessonName} numberOfLines={2}>
                      {' '}
                      {lesson.name}{' '}
                    </Text>
                    {lesson.summary && (
                      <Text style={currentStyles.lessonSummary} numberOfLines={1}>
                        {' '}
                        {lesson.summary}{' '}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={spacing.icon.xs}
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
              size={spacing.icon.xl}
              color={theme.colors.textTertiary}
            />
            <Text style={currentStyles.emptyStateTitle}> {t('study_chapters.no_chapters')} </Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {' '}
              {t('study_chapters.no_chapters_for_subject')}{' '}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = (
  theme: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  common: any,
  typography: any,
) =>
  StyleSheet.create({
    content: { flex: 1 },
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
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      color: theme.colors.text,
    },
    errorText: {
      ...typography('caption'),
      textAlign: 'center',
      marginBottom: spacing.xl,
      color: theme.colors.textSecondary,
    },
    chapterCard: {
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sectionGap,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      ...layout.shadow,
    },
    chapterHeader: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    chapterIconContainer: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary + '1A',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.sm),
    },
    chapterInfo: { flex: 1, alignItems: common.alignStart },
    chapterName: {
      ...typography('h3'),
      color: theme.colors.text,
      textAlign: common.textAlign,
    },
    lessonCount: {
      ...typography('caption'),
      marginTop: 2,
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    lessonsContainer: { paddingVertical: spacing.xxs },
    lessonItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lessonIconContainer: { ...common.marginEnd(spacing.sm) },
    lessonInfo: { flex: 1, alignItems: common.alignStart },
    lessonName: {
      ...typography('caption'),
      color: theme.colors.text,
      textAlign: common.textAlign,
      fontSize: 13,
    },
    lessonSummary: {
      ...typography('caption'),
      fontSize: 11,
      marginTop: 2,
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    emptyState: { padding: spacing.xl, alignItems: 'center', marginTop: spacing.xl },
    emptyStateTitle: {
      ...typography('h3'),
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

export default StudyChaptersScreen;
