import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Video, ResizeMode } from 'expo-av';
import { layout } from '../../config/layout';
import { useNavigation, useRoute } from '@react-navigation/native';
import CloseButton from '../../components/navigation/CloseButton';
import LessonNavBar from '../../components/navigation/LessonNavBar';
import UnifiedHeader from '../../components/UnifiedHeader';
import { useTypography } from '../../hooks/useTypography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
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
            <Ionicons name="play-back" size={24} color={theme.colors.textOnDark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePlayPause} style={currentVideoStyles.playButton}>
            <Ionicons
              name={status.isPlaying ? 'pause' : 'play'}
              size={32}
              color={theme.colors.textOnDark}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSkip(10)} style={currentVideoStyles.controlButton}>
            <Ionicons name="play-forward" size={24} color={theme.colors.textOnDark} />
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
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();

  const [currentLesson, setCurrentLesson] = useState<Lesson>(route.params?.lesson);
  const allLessons: Lesson[] = route.params?.allLessons || [];
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const currentStyles = styles(theme, isRTL, typography, insets, spacing, borderRadius);

  const togglePoint = (pointId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPoints((prev) => {
      const next = new Set(prev);
      if (next.has(pointId)) {
        next.delete(pointId);
      } else {
        next.add(pointId);
      }
      return next;
    });
  };

  const handleNavigateLesson = (lesson: Lesson) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentLesson(lesson);
    setExpandedPoints(new Set());
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const hasNewPoints = currentLesson.lessonPoints && currentLesson.lessonPoints.length > 0;
  const hasLegacyPoints = !hasNewPoints && currentLesson.points && currentLesson.points.length > 0;

  return (
    <View style={currentStyles.container}>
      <UnifiedHeader leftContent={<CloseButton />} title={t('study_lesson.lesson_content')} />

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: layout.screenPadding,
          paddingBottom: Math.max(insets.bottom, spacing.xl),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.titleBreadcrumbContainer}>
          <View style={currentStyles.breadcrumbRow}>
            <Ionicons
              name="folder-open"
              size={14}
              color={theme.colors.primary}
              style={currentStyles.breadcrumbIcon}
            />
            <Text style={currentStyles.chapterBadge}> {currentLesson.chapter.name} </Text>
          </View>
          <Text style={currentStyles.mainTitle}> {currentLesson.name} </Text>
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
            <View style={currentStyles.sectionIcon}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={currentStyles.sectionTitle}> {t('study_lesson.summary')} </Text>
          </View>
          {currentLesson.summary ? (
            <Text style={currentStyles.summaryText}> {currentLesson.summary} </Text>
          ) : (
            <Text style={currentStyles.noContentText}> {t('study_lesson.no_summary')} </Text>
          )}
        </View>

        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeader}>
            <View
              style={[currentStyles.sectionIcon, { backgroundColor: theme.colors.success + '1A' }]}
            >
              <Ionicons name="checkmark-done" size={20} color={theme.colors.success} />
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
                      <View style={currentStyles.pointBullet}>
                        <Ionicons name="checkmark" size={12} color={theme.colors.textOnDark} />
                      </View>
                      <Text style={currentStyles.pointText}> {point.title} </Text>
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
                        <Text style={currentStyles.explanationText}> {point.explanation} </Text>
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
                    <View style={currentStyles.pointBullet}>
                      <Ionicons name="checkmark" size={12} color={theme.colors.textOnDark} />
                    </View>
                    <Text style={currentStyles.pointText}> {point} </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={currentStyles.noContentText}> {t('study_lesson.no_key_points')} </Text>
          )}
        </View>
      </ScrollView>

      <LessonNavBar
        currentIndex={currentIndex}
        totalCount={allLessons.length}
        onPrevious={previousLesson ? () => handleNavigateLesson(previousLesson as Lesson) : null}
        onNext={nextLesson ? () => handleNavigateLesson(nextLesson as Lesson) : null}
        onFinish={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = (
  theme: any,
  isRTL: boolean,
  typography: any,
  insets: { top: number; bottom: number },
  spacing: any,
  borderRadius: any,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    titleBreadcrumbContainer: {
      marginBottom: spacing.sectionGap,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
      backgroundColor: theme.colors.card,
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    breadcrumbRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '1A',
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.primary + '33',
    },
    breadcrumbIcon: {
      marginRight: isRTL ? 0 : 6,
      marginLeft: isRTL ? 6 : 0,
    },
    chapterBadge: {
      ...typography('caption'),
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    mainTitle: {
      ...typography('h3'),
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '800',
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
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
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
      fontWeight: '700',
      marginLeft: isRTL ? 0 : spacing.sm,
      marginRight: isRTL ? spacing.sm : 0,
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
      textAlign: isRTL ? 'right' : 'left',
    },
    noContentText: {
      ...typography('caption'),
      fontStyle: 'italic',
      color: theme.colors.textSecondary,
      textAlign: isRTL ? 'right' : 'left',
    },
    pointsList: {
      gap: spacing.sm,
    },
    pointItem: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pointHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
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
      marginLeft: isRTL ? 0 : spacing.sm,
      marginRight: isRTL ? spacing.sm : 0,
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
      fontWeight: '600',
    },
    explanationContainer: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginLeft: isRTL ? 0 : 28,
      marginRight: isRTL ? 28 : 0,
    },
    explanationText: {
      ...typography('caption'),
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: isRTL ? 'right' : 'left',
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
