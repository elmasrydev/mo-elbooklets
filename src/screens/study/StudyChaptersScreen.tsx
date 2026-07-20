import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { loadFailureMessage } from '../../utils/queryError';
import { StudyChaptersDocument, StudyChaptersQuery } from '../../generated/graphql';
import { layout } from '../../config/layout';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import UnifiedHeader from '../../components/UnifiedHeader';
import AppButton from '../../components/AppButton';
import { GenericListSkeleton } from '../../components/SkeletonLoader';
import RetryView from '../../components/RetryView';
import { useSubscriptionGate } from '../../hooks/useSubscriptionGate';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';

interface Subject {
  id: string;
  name: string;
  description?: string;
  language?: string;
}

type ApiChapter = StudyChaptersQuery['lessonsForSubject'][number];

// The reader needs to know which chapter a lesson belongs to, so each lesson
// gets a back-reference the API response doesn't carry.
type Lesson = ApiChapter['lessons'][number] & {
  chapter: { id: string; name: string; order: number };
};

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
  const { checkSubscription } = useSubscriptionGate();

  const {
    data,
    loading,
    error: queryError,
    refetch,
  } = useQuery(StudyChaptersDocument, {
    variables: { subjectId: subject?.id },
    skip: !subject?.id,
    // myInteraction (like/dislike) must be fresh when returning from the reader.
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
  const error = loadFailureMessage(
    data?.lessonsForSubject,
    queryError,
    t('study_chapters.error_loading'),
  );

  // The list is ordered by the backend; `order` is its 1-based position, and
  // each lesson carries a back-reference so the reader can show its chapter.
  const chapters: Chapter[] = useMemo(
    () =>
      (data?.lessonsForSubject ?? []).map((chapter, idx) => ({
        id: chapter.id,
        name: chapter.name,
        order: idx + 1,
        lessons: chapter.lessons.map((lesson) => ({
          ...lesson,
          chapter: { id: chapter.id, name: chapter.name, order: idx + 1 },
        })),
      })),
    [data],
  );

  // Re-fetch on every focus so myInteraction (like/dislike) is always fresh
  // when the user navigates back from StudyLessonScreen.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleLessonPress = (lesson: Lesson) => {
    if (!checkSubscription()) return;
    if (lesson.isLocked) return;
    const allLessons = chapters.flatMap((ch) => ch.lessons);
    navigation.navigate('StudyLesson', { lesson, allLessons, subject });
  };

  const { contentAlign, contentFlexAlign, contentRowDirection, isContentRTL } = useSubjectTextAlign(
    subject?.language,
    subject?.name,
  );

  const currentStyles = styles(
    theme,
    fontSizes,
    spacing,
    borderRadius,
    common,
    typography,
    contentAlign,
    contentFlexAlign,
    contentRowDirection,
    !!isContentRTL,
  );

  if (loading) {
    return (
      <View style={common.container}>
        <UnifiedHeader showBackButton title={subject.name} />
        <View style={{ paddingTop: 16 }}>
          <GenericListSkeleton numItems={5} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={common.container}>
        <UnifiedHeader showBackButton title={subject.name} />
        <RetryView message={error} onRetry={() => refetch()} />
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
                <Text style={currentStyles.chapterName}>{chapter.name} </Text>
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
                    {lesson.summary && !lesson.isLocked && (
                      <Text style={currentStyles.lessonSummary} numberOfLines={1}>
                        {' '}
                        {lesson.summary}{' '}
                      </Text>
                    )}
                    {lesson.isLocked && (
                      <Text
                        style={[
                          currentStyles.lessonSummary,
                          { color: theme.colors.error || '#EF4444' },
                        ]}
                        numberOfLines={1}
                      >
                        {t('study_chapters.locked_lesson', 'Purchase required or restricted')}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={
                      lesson.isLocked
                        ? 'lock-closed'
                        : subject?.language === 'ar'
                          ? 'chevron-back'
                          : 'chevron-forward'
                    }
                    size={spacing.icon.xs}
                    color={
                      lesson.isLocked ? theme.colors.error || '#EF4444' : theme.colors.textTertiary
                    }
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
  contentAlign: 'left' | 'right',
  contentFlexAlign: 'flex-start' | 'flex-end',
  contentRowDirection: 'row' | 'row-reverse',
  isContentRTL: boolean,
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
      flexDirection: contentRowDirection,
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor:
        theme.mode === 'dark' ? theme.colors.primary + '26' : theme.colors.primary + '0D',
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.border,
    },
    chapterIconContainer: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary + '1A',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isContentRTL ? 0 : spacing.sm,
      marginLeft: isContentRTL ? spacing.sm : 0,
    },
    chapterInfo: {
      flex: 1,
      alignItems: contentFlexAlign,
    },
    chapterName: {
      ...typography('h3', '800'),
      fontSize: 18,
      color: theme.colors.text,
      textAlign: contentAlign,
    },
    lessonCount: {
      ...typography('caption'),
      marginTop: 2,
      color: theme.colors.textSecondary,
      textAlign: contentAlign,
    },
    lessonsContainer: { paddingVertical: spacing.xxs },
    lessonItem: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lessonIconContainer: {
      marginRight: isContentRTL ? 0 : spacing.sm,
      marginLeft: isContentRTL ? spacing.sm : 0,
    },
    lessonInfo: {
      flex: 1,
      alignItems: contentFlexAlign,
    },
    lessonName: {
      ...typography('bodySmall'),
      fontSize: 15,
      color: theme.colors.text,
      textAlign: contentAlign,
    },
    lessonSummary: {
      ...typography('caption'),
      fontSize: 13,
      marginTop: 2,
      color: theme.colors.textSecondary,
      textAlign: contentAlign,
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
