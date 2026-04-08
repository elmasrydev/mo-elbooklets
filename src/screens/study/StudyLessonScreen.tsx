import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Video, ResizeMode } from 'expo-av';
import { layout } from '../../config/layout';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { tryFetchWithFallback } from '../../config/api';
import CloseButton from '../../components/navigation/CloseButton';
import LessonNavBar from '../../components/navigation/LessonNavBar';
import UnifiedHeader from '../../components/UnifiedHeader';
import { useTypography } from '../../hooks/useTypography';
import useAndroidBack from '../../hooks/useAndroidBack';
import AppButton from '../../components/AppButton';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';
import { useScreenTracking } from '../../hooks/useScreenTracking';
import { isRTL, textAlign } from '../../lib/rtl';
import { analytics } from '../../lib/analytics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LessonPoint {
  id: string;
  title: string;
  explanation?: string;
  order: number;
  is_viewed?: boolean;
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
  isLocked?: boolean;
}

interface LessonDODProgress {
  lessonId: string;
  keyPointsViewed: number;
  keyPointsTotal: number;
  quizzesPassed: number;
  quizzesRequired: number;
  totalProgress: number;
  isComplete: boolean;
}

const LessonVideoPlayer: React.FC<{ url: string; theme: any; spacing: any; borderRadius: any }> = ({
  url,
  theme,
  spacing,
  borderRadius,
}) => {
  const video = React.useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (ms: number) => {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handlePlayPause = () => {
    if (status.isPlaying) {
      video.current?.pauseAsync();
    } else {
      video.current?.playAsync();
    }
  };

  const handleSkip = async (seconds: number) => {
    if (status.positionMillis !== undefined) {
      const newPosition = status.positionMillis + seconds * 1000;
      await video.current?.setPositionAsync(
        Math.max(0, Math.min(newPosition, status.durationMillis || newPosition)),
      );
    }
  };

  const currentVideoStyles = videoStyles(theme, spacing, borderRadius);

  return (
    <View style={currentVideoStyles.container}>
      <Video
        ref={video}
        style={currentVideoStyles.video}
        source={{ uri: url }}
        useNativeControls={false}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onPlaybackStatusUpdate={(s) => setStatus(() => s)}
        isMuted={isMuted}
      />
      <View style={currentVideoStyles.controlsContainer}>
        <View style={currentVideoStyles.progressWrapper}>
          <View style={currentVideoStyles.progressBarBackground}>
            <View
              style={[
                currentVideoStyles.progressBarFill,
                { width: `${(status.positionMillis / (status.durationMillis || 1)) * 100}%` },
              ]}
            />
          </View>
          <View style={currentVideoStyles.timeRow}>
            <Text style={currentVideoStyles.timeText}> {formatTime(status.positionMillis)} </Text>
            <Text style={currentVideoStyles.timeText}> {formatTime(status.durationMillis)} </Text>
          </View>
        </View>
        <View style={currentVideoStyles.mainButtonsRow}>
          <TouchableOpacity
            onPress={() => handleSkip(-10)}
            style={currentVideoStyles.controlButton}
          >
            <Ionicons
              name={isRTL() ? 'play-forward' : 'play-back'}
              size={24}
              color={theme.colors.textOnDark}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePlayPause} style={currentVideoStyles.playButton}>
            <Ionicons
              name={status.isPlaying ? 'pause' : 'play'}
              size={32}
              color={theme.colors.textOnDark}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSkip(10)} style={currentVideoStyles.controlButton}>
            <Ionicons
              name={isRTL() ? 'play-back' : 'play-forward'}
              size={24}
              color={theme.colors.textOnDark}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => setIsMuted(!isMuted)}
          style={currentVideoStyles.muteButton}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={20}
            color={theme.colors.textOnDark}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StudyLessonScreen: React.FC = () => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  useScreenTracking('Lesson');
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const [currentLesson, setCurrentLesson] = useState<Lesson>(route.params?.lesson);
  const allLessons: Lesson[] = route.params?.allLessons || [];
  const subject = route.params?.subject;
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set());
  const [dodProgress, setDodProgress] = useState<LessonDODProgress | null>(null);
  const [loadingDod, setLoadingDod] = useState(false);
  const [viewedPoints, setViewedPoints] = useState<Set<string>>(
    new Set(currentLesson.lessonPoints?.filter((p) => p.is_viewed).map((p) => p.id) || []),
  );
  const scrollViewRef = useRef<ScrollView>(null);
  // Local state for the leave-lesson confirmation — must be rendered here
  // because GlobalModalHandler (root-level) cannot pierce iOS native fullScreenModal.
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const { contentAlign, contentRowDirection } = useSubjectTextAlign(subject?.language);
  const currentStyles = styles(
    theme,
    isRTL,
    typography,
    fontWeight,
    insets,
    spacing,
    borderRadius,
    contentAlign,
    contentRowDirection,
  );

  // Open local leave-disclaimer (works inside iOS native fullScreenModal).
  const handleLeaveLesson = useCallback(() => {
    setShowLeaveModal(true);
    return true; // block Android default back action
  }, []);

  // Android hardware back → leave disclaimer
  useAndroidBack(handleLeaveLesson);

  const togglePoint = async (pointId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const isExpanding = !expandedPoints.has(pointId);

    setExpandedPoints((prev) => {
      const next = new Set(prev);
      if (next.has(pointId)) {
        next.delete(pointId);
      } else {
        next.add(pointId);
      }
      return next;
    });

    if (isExpanding && !viewedPoints.has(pointId)) {
      handleRecordView(pointId);
    }
  };

  const fetchDodProgress = async (lessonId: string) => {
    try {
      setLoadingDod(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `query LessonDOD($lessonId: ID!) { 
          lessonDODProgress(lessonId: $lessonId) { 
            lessonId keyPointsViewed keyPointsTotal quizzesPassed quizzesRequired totalProgress isComplete 
          } 
        }`,
        { lessonId },
        token,
      );

      if (result.data?.lessonDODProgress) {
        setDodProgress(result.data.lessonDODProgress);
      }
    } catch (err) {
      console.error('Fetch DOD error:', err);
    } finally {
      setLoadingDod(false);
    }
  };

  const handleRecordView = async (lessonPointId: string) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `mutation RecordView($lessonPointId: ID!) { recordKeyPointView(lessonPointId: $lessonPointId) }`,
        { lessonPointId },
        token,
      );

      if (result.data?.recordKeyPointView) {
        setViewedPoints((prev) => new Set(prev).add(lessonPointId));
        fetchDodProgress(currentLesson.id);
      }
    } catch (err) {
      console.error('Record view error:', err);
    }
  };

  React.useEffect(() => {
    fetchDodProgress(currentLesson.id);
    analytics.trackLessonStarted({
      lesson_id: currentLesson.id,
      lesson_title: currentLesson.name,
      chapter_id: currentLesson.chapter?.id,
      chapter_title: currentLesson.chapter?.name,
      subject_id: subject?.id,
      subject_title: subject?.name,
    });
  }, [currentLesson.id]);

  const handleNavigateLesson = (lesson: Lesson) => {
    analytics.trackLessonCompleted({
      lesson_id: currentLesson.id,
      lesson_title: currentLesson.name,
      chapter_id: currentLesson.chapter?.id,
      chapter_title: currentLesson.chapter?.name,
      subject_id: subject?.id,
      subject_title: subject?.name,
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentLesson(lesson);
    setExpandedPoints(new Set());
    setViewedPoints(
      new Set(lesson.lessonPoints?.filter((p) => p.is_viewed).map((p) => p.id) || []),
    );
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleTakeQuiz = () => {
    const selectedUnits = [
      {
        id: currentLesson.chapter.id,
        name: currentLesson.chapter.name,
        lessons: [{ id: currentLesson.id, name: currentLesson.name }],
      },
    ];
    const selectedLessonIds = [currentLesson.id];

    navigation.goBack();
    setTimeout(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'MainTabs', state: { routes: [{ name: 'Quiz' }] } },
            {
              name: 'QuizFlowSettings',
              params: {
                subject,
                selectedUnits,
                selectedLessonIds,
              },
            },
          ],
        }),
      );
    }, 400);
  };

  const hasNewPoints = currentLesson.lessonPoints && currentLesson.lessonPoints.length > 0;
  const hasLegacyPoints = !hasNewPoints && currentLesson.points && currentLesson.points.length > 0;

  return (
    <View style={currentStyles.container}>
      <UnifiedHeader
        leftContent={<CloseButton onPress={handleLeaveLesson} />}
        title={t('study_lesson.lesson_content')}
      />

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.xl),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.titleBreadcrumbContainer}>
          <View style={currentStyles.breadcrumbRow}>
            <Ionicons
              name="library"
              size={20}
              color={theme.colors.primary}
              style={currentStyles.breadcrumbIcon}
            />
            <Text style={currentStyles.chapterBadge}>{currentLesson.chapter.name}</Text>
          </View>
          <Text style={currentStyles.mainTitle}>{currentLesson.name}</Text>
        </View>

        {currentLesson.videoUrl && (
          <View style={currentStyles.videoSection}>
            <LessonVideoPlayer
              url={currentLesson.videoUrl as string}
              theme={theme}
              spacing={spacing}
              borderRadius={borderRadius}
            />
          </View>
        )}

        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeader}>
            <View
              style={[currentStyles.sectionIcon, { backgroundColor: theme.colors.primary + '1A' }]}
            >
              <Ionicons name="newspaper-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text
              style={[currentStyles.sectionTitle, { color: theme.colors.primary, fontSize: 24 }]}
            >
              {' '}
              {t('study_lesson.summary')}
            </Text>
          </View>
          {currentLesson.summary ? (
            <Text style={currentStyles.summaryText}>{currentLesson.summary}</Text>
          ) : (
            <Text style={currentStyles.noContentText}>{t('study_lesson.no_summary')}</Text>
          )}
        </View>

        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeader}>
            <View
              style={[currentStyles.sectionIcon, { backgroundColor: theme.colors.primary + '1A' }]}
            >
              <Ionicons name="star-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={currentStyles.sectionTitle}> {t('study_lesson.key_points')} </Text>
          </View>

          {hasNewPoints ? (
            <View style={currentStyles.pointsList}>
              {currentLesson.lessonPoints!.map((point) => {
                const isExpanded = expandedPoints.has(point.id);
                return (
                  <TouchableOpacity
                    key={point.id}
                    style={currentStyles.pointItem}
                    onPress={() => point.explanation && togglePoint(point.id)}
                    activeOpacity={point.explanation ? 0.7 : 1}
                  >
                    <View style={currentStyles.pointHeader}>
                      <View>
                        <Ionicons
                          name={viewedPoints.has(point.id) ? 'checkmark-circle' : 'ellipse-outline'}
                          size={26}
                          color={
                            viewedPoints.has(point.id)
                              ? theme.colors.success
                              : theme.colors.textTertiary
                          }
                        />
                      </View>
                      <Text style={currentStyles.pointText}>{point.title}</Text>
                      {point.explanation && (
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={theme.colors.textSecondary}
                        />
                      )}
                    </View>
                    {isExpanded && point.explanation && (
                      <View style={currentStyles.explanationContainer}>
                        <Text style={currentStyles.explanationText}>{point.explanation}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : hasLegacyPoints ? (
            <View style={currentStyles.pointsList}>
              {currentLesson.points!.map((point, index) => (
                <View key={index} style={currentStyles.pointItem}>
                  <View style={currentStyles.pointHeader}>
                    <View
                      style={[currentStyles.pointBullet, { backgroundColor: theme.colors.primary }]}
                    >
                      <Ionicons name="bookmark" size={12} color={theme.colors.textOnDark} />
                    </View>
                    <Text style={currentStyles.pointText}>{point}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={currentStyles.noContentText}>{t('study_lesson.no_key_points')}</Text>
          )}
        </View>

        {/* DOD Progress Section */}
        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeader}>
            <View
              style={[currentStyles.sectionIcon, { backgroundColor: theme.colors.success + '1A' }]}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} />
            </View>
            <Text style={[currentStyles.sectionTitle, { color: theme.colors.success }]}>
              {t('study_lesson.definition_of_done', 'Definition of Done')}
            </Text>
            {dodProgress?.isComplete && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.success}
                style={{ marginLeft: 'auto' }}
              />
            )}
          </View>

          {loadingDod && !dodProgress ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : dodProgress ? (
            <View style={currentStyles.dodContent}>
              <View style={currentStyles.dodItem}>
                <Ionicons
                  name={
                    dodProgress.keyPointsViewed >= dodProgress.keyPointsTotal
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={20}
                  color={
                    dodProgress.keyPointsViewed >= dodProgress.keyPointsTotal
                      ? theme.colors.success
                      : theme.colors.textTertiary
                  }
                />
                <Text style={currentStyles.dodText}>
                  {t('study_lesson.key_points_progress', {
                    current: dodProgress.keyPointsViewed,
                    total: dodProgress.keyPointsTotal,
                    defaultValue: `View all key points (${dodProgress.keyPointsViewed}/${dodProgress.keyPointsTotal})`,
                  })}
                </Text>
              </View>
              <View style={currentStyles.dodItem}>
                <Ionicons
                  name={
                    dodProgress.quizzesPassed >= dodProgress.quizzesRequired
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={20}
                  color={
                    dodProgress.quizzesPassed >= dodProgress.quizzesRequired
                      ? theme.colors.success
                      : theme.colors.textTertiary
                  }
                />
                <Text style={currentStyles.dodText}>
                  {t('study_lesson.quizzes_progress', {
                    current: dodProgress.quizzesPassed,
                    total: dodProgress.quizzesRequired,
                    defaultValue: `Pass required quizzes (${dodProgress.quizzesPassed}/${dodProgress.quizzesRequired})`,
                  })}
                </Text>
              </View>
              <View style={currentStyles.dodProgressContainer}>
                <View style={currentStyles.dodProgressBar}>
                  <View
                    style={[
                      currentStyles.dodProgressFill,
                      {
                        width: `${dodProgress.totalProgress}%`,
                        backgroundColor: dodProgress.isComplete
                          ? theme.colors.success
                          : theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={currentStyles.dodPercentText}>
                  {Math.round(dodProgress.totalProgress)}%
                </Text>
              </View>
            </View>
          ) : (
            <Text style={currentStyles.noContentText}>
              {t('study_lesson.no_dod_data', 'No progress data available')}
            </Text>
          )}
        </View>

        {/* Take Quiz CTA */}
        {subject && (
          <View style={currentStyles.takeQuizSection}>
            <View style={currentStyles.takeQuizDivider} />
            <View style={currentStyles.takeQuizContent}>
              <Ionicons name="school-outline" size={28} color={theme.colors.primary} />
              <Text style={currentStyles.takeQuizLabel}>
                {t('study_lesson.test_your_knowledge')}
              </Text>
              <AppButton
                title={t('study_lesson.take_quiz')}
                onPress={handleTakeQuiz}
                size="lg"
                icon={<Ionicons name="play" size={20} color={theme.colors.textOnDark} />}
                iconPosition={isRTL ? 'left' : 'right'}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <LessonNavBar
        currentIndex={currentIndex}
        totalCount={allLessons.length}
        onPrevious={previousLesson ? () => handleNavigateLesson(previousLesson as Lesson) : null}
        onNext={nextLesson ? () => handleNavigateLesson(nextLesson as Lesson) : null}
        onFinish={() => {
          analytics.trackLessonCompleted({
            lesson_id: currentLesson.id,
            lesson_title: currentLesson.name,
            chapter_id: currentLesson.chapter?.id,
            chapter_title: currentLesson.chapter?.name,
            subject_id: subject?.id,
            subject_title: subject?.name,
          });
          navigation.goBack();
        }}
      />

      {/* Leave-lesson confirmation — rendered locally so it works inside iOS fullScreenModal */}
      <ConfirmModal
        visible={showLeaveModal}
        title={t('study_lesson.leave_title')}
        message={t('study_lesson.leave_message')}
        confirmLabel={t('common.yes')}
        cancelLabel={t('common.no')}
        onConfirm={() => {
          setShowLeaveModal(false);
          navigation.goBack();
        }}
        onCancel={() => setShowLeaveModal(false)}
      />
    </View>
  );
};

const styles = (
  theme: any,
  isRTL: boolean,
  typography: any,
  fontWeight: any,
  insets: { top: number; bottom: number },
  spacing: any,
  borderRadius: any,
  contentAlign: 'left' | 'right',
  contentRowDirection: 'row' | 'row-reverse',
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    titleBreadcrumbContainer: {
      marginBottom: spacing.sectionGap,
      alignItems: 'flex-start',
      backgroundColor: theme.colors.card,
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    breadcrumbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary + '1A',
      paddingHorizontal: spacing.xl,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.primary + '33',
      flex: 0,
      width: '100%',
    },
    breadcrumbIcon: {
      marginRight: 12,
    },
    chapterBadge: {
      ...typography('caption'),
      fontSize: 13,
      ...fontWeight('700'),
      color: theme.colors.primary,
      textAlign: contentAlign,
    },
    mainTitle: {
      ...typography('h3'),
      fontSize: 16,
      lineHeight: 28,
      ...fontWeight('800'),
      color: theme.colors.text,
      textAlign: contentAlign,
      width: '100%',
    },
    section: {
      marginBottom: spacing.sectionGap,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionIcon: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '1A',
    },
    sectionTitle: {
      ...typography('h3'),
      ...fontWeight('700'),
      marginLeft: spacing.sm,
      marginRight: spacing.sm,
      color: theme.colors.text,
    },
    videoSection: {
      marginBottom: spacing.sectionGap,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: '#000',
      ...layout.shadow,
    },
    summaryText: {
      ...typography('bodyLarge'),
      lineHeight: 24,
      color: theme.colors.text,
      textAlign: contentAlign,
    },
    noContentText: {
      ...typography('caption'),
      fontStyle: 'italic',
      color: theme.colors.textSecondary,
      textAlign: contentAlign,
    },
    pointsList: {
      gap: spacing.sm,
    },
    pointItem: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pointHeader: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      gap: 7,
    },
    pointBullet: {
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.success,
      flexShrink: 0,
    },
    pointText: {
      flex: 1,
      ...typography('body'),
      marginLeft: spacing.sm,
      marginRight: 0,
      color: theme.colors.text,
      textAlign: contentAlign,
      fontWeight: '600',
    },
    explanationContainer: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginLeft: 28,
      marginRight: 28,
    },
    explanationText: {
      ...typography('caption'),
      fontSize: 15,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: contentAlign,
    },
    takeQuizSection: {
      marginTop: spacing.lg,
      marginBottom: spacing.xl,
    },
    takeQuizDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginBottom: spacing.xl,
    },
    takeQuizContent: {
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.primary + '1A',
    },
    takeQuizLabel: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    // DOD Styles
    dodContent: {
      gap: spacing.sm,
    },
    dodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: spacing.sm,
    },
    dodText: {
      ...typography('caption'),
      color: theme.colors.text,
      flex: 1,
      textAlign: contentAlign,
    },
    dodProgressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    dodProgressBar: {
      flex: 1,
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    dodProgressFill: {
      height: '100%',
      borderRadius: 4,
    },
    dodPercentText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
      width: 45,
      textAlign: 'center',
      marginBottom: 3,
    },
  });

const videoStyles = (theme: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: '#000',
      position: 'relative',
    },
    video: {
      width: '100%',
      height: '100%',
    },
    controlsContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    progressWrapper: {
      marginBottom: spacing.xs,
    },
    progressBarBackground: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    timeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    mainButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.lg,
    },
    controlButton: {
      padding: spacing.xs,
    },
    playButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary + 'CC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    muteButton: {
      position: 'absolute',
      right: spacing.sm,
      bottom: spacing.xs,
      padding: 5,
    },
  });

export default StudyLessonScreen;
