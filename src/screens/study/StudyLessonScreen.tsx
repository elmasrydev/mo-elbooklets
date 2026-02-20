import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Video, ResizeMode, Audio } from 'expo-av';
import { layout } from '../../config/layout';
import { useNavigation, useRoute } from '@react-navigation/native';
import CloseButton from '../../components/navigation/CloseButton';
import LessonNavBar from '../../components/navigation/LessonNavBar';

// Enable LayoutAnimation on Android
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
  points?: string[]; // Legacy field
  lessonPoints?: LessonPoint[]; // New structured points
  videoUrl?: string; // New field
  chapter: {
    id: string;
    name: string;
    order: number;
  };
}

const LessonVideoPlayer: React.FC<{ url: string; theme: any }> = ({ url, theme }) => {
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
      await video.current?.setPositionAsync(Math.max(0, Math.min(newPosition, status.durationMillis || newPosition)));
    }
  };

  return (
    <View style={videoStyles.container}>
      <Video
        ref={video}
        style={videoStyles.video}
        source={{ uri: url }}
        useNativeControls={false}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onPlaybackStatusUpdate={(s) => setStatus(() => s)}
        isMuted={isMuted}
      />
      
      {/* Custom Controls Overlays */}
      <View style={videoStyles.controlsContainer}>
        {/* Progress Bar Container */}
        <View style={videoStyles.progressWrapper}>
          <View style={videoStyles.progressBarBackground}>
            <View 
              style={[
                videoStyles.progressBarFill, 
                { width: `${(status.positionMillis / (status.durationMillis || 1)) * 100}%` }
              ]} 
            />
          </View>
          <View style={videoStyles.timeRow}>
            <Text style={videoStyles.timeText}>{formatTime(status.positionMillis)}</Text>
            <Text style={videoStyles.timeText}>{formatTime(status.durationMillis)}</Text>
          </View>
        </View>

        {/* Main Buttons */}
        <View style={videoStyles.mainButtonsRow}>
          <TouchableOpacity onPress={() => handleSkip(-10)} style={videoStyles.controlButton}>
            <Ionicons name="play-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handlePlayPause} style={videoStyles.playButton}>
            <Ionicons name={status.isPlaying ? "pause" : "play"} size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleSkip(10)} style={videoStyles.controlButton}>
            <Ionicons name="play-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Audio Toggle */}
        <TouchableOpacity 
          onPress={() => setIsMuted(!isMuted)} 
          style={videoStyles.muteButton}
        >
          <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StudyLessonScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [currentLesson, setCurrentLesson] = useState<Lesson>(route.params?.lesson);
  const allLessons: Lesson[] = route.params?.allLessons || [];
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set());

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const currentStyles = styles(theme, isRTL);

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
    setExpandedPoints(new Set()); // Reset expanded state
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // Prefer new lessonPoints over legacy points
  const hasNewPoints = currentLesson.lessonPoints && currentLesson.lessonPoints.length > 0;
  const hasLegacyPoints = !hasNewPoints && currentLesson.points && currentLesson.points.length > 0;

  return (
    <View style={currentStyles.container}>
      {/* Header */}
      <View style={currentStyles.header}>
        <View style={currentStyles.headerTopRow}>
          <CloseButton />
          <View style={currentStyles.headerTitleArea}>
            <Text style={currentStyles.chapterBadge}> {currentLesson.chapter.name} </Text>
          </View>
        </View>
        <Text style={currentStyles.headerTitle} numberOfLines={2}>
          {currentLesson.name}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: layout.screenPadding, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Section */}
        {currentLesson.videoUrl && (
          <View style={currentStyles.videoSection}>
             <LessonVideoPlayer url={currentLesson.videoUrl} theme={theme} />
          </View>
        )}

        {/* Summary Section */}
        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeader}>
            <View style={currentStyles.sectionIcon}>
              <Text style={currentStyles.sectionIconText}>📄</Text>
            </View>
            <Text style={currentStyles.sectionTitle}> {t('study_lesson.summary')} </Text>
          </View>
          {currentLesson.summary ? (
            <Text style={currentStyles.summaryText}> {currentLesson.summary} </Text>
          ) : (
            <Text style={currentStyles.noContentText}> {t('study_lesson.no_summary')} </Text>
          )}
        </View>

        {/* Key Points Section */}
        <View style={currentStyles.section}>
          <View style={currentStyles.sectionHeader}>
            <View style={[currentStyles.sectionIcon, currentStyles.pointsIcon]}>
              <Text style={currentStyles.sectionIconText}>✓</Text>
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
                        <Text style={currentStyles.pointBulletText}>✓</Text>
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
                      <Text style={currentStyles.pointBulletText}>✓</Text>
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

      {/* Bottom Navigation Bar */}
      <LessonNavBar
        currentIndex={currentIndex}
        totalCount={allLessons.length}
        onPrevious={previousLesson ? () => handleNavigateLesson(previousLesson) : null}
        onNext={nextLesson ? () => handleNavigateLesson(nextLesson) : null}
        onFinish={handleClose}
      />
    </View>
  );
};

const styles = (theme: any, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      paddingTop: 50,
      backgroundColor: theme.colors.headerBackground,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    headerTitleArea: {
      flex: 1,
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    chapterBadge: {
      fontSize: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.2)',
      color: theme.colors.headerText,
      overflow: 'hidden',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.headerText,
      textAlign: isRTL ? 'right' : 'left',
    },
    section: {
      marginBottom: 24,
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.card,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryLight || `${theme.colors.primary}20`,
    },
    pointsIcon: {
      backgroundColor: '#10b98120',
    },
    sectionIconText: {
      fontSize: 18,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    videoSection: {
      marginBottom: 20,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: '#000',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
    summaryText: {
      fontSize: 15,
      lineHeight: 24,
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    noContentText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.colors.textSecondary,
      textAlign: isRTL ? 'right' : 'left',
    },
    pointsList: {
      gap: 12,
    },
    pointItem: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border || '#e5e7eb',
    },
    pointHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pointBullet: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#10b981',
      flexShrink: 0,
    },
    pointBulletText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#fff',
    },
    pointText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 22,
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
      fontWeight: '600',
    },
    explanationContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border || '#e5e7eb',
      marginLeft: isRTL ? 0 : 36,
      marginRight: isRTL ? 36 : 0,
    },
    explanationText: {
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: isRTL ? 'right' : 'left',
    },
  });

const videoStyles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
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
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  progressWrapper: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6', // Brand blue
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
    gap: 20,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    position: 'absolute',
    right: 15,
    bottom: 12,
    padding: 5,
  },
});

export default StudyLessonScreen;
