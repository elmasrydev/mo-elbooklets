import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  TextInput,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
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
import { isRTL, textAlign } from '../../lib/rtl';

import { useSubscriptionGate } from '../../hooks/useSubscriptionGate';
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

interface UserSavedPoint {
  id: string;
  is_bookmarked: boolean;
  note_content?: string;
  lessonPoint: { id: string };
}

interface Lesson {
  id: string;
  name: string;
  summary?: string;
  points?: string[];
  lessonPoints?: LessonPoint[];
  videoUrl?: string;
  myInteraction?: 'LIKE' | 'DISLIKE' | null;
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

const LessonVideoPlayer: React.FC<{
  url: string;
  theme: any;
  spacing: any;
  borderRadius: any;
  typography: any;
}> = ({ url, theme, spacing, borderRadius, typography }) => {
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

  const handleFullscreen = async () => {
    try {
      if (video.current) {
        if (typeof (video.current as any).presentFullscreenPlayer === 'function') {
          await (video.current as any).presentFullscreenPlayer();
        } else if (typeof (video.current as any).presentFullscreenPlayerAsync === 'function') {
          await (video.current as any).presentFullscreenPlayerAsync();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const currentVideoStyles = videoStyles(theme, spacing, borderRadius, typography);

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
          {/* Mute — left side */}
          <TouchableOpacity
            onPress={() => setIsMuted(!isMuted)}
            style={currentVideoStyles.actionIconButton}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={20}
              color={theme.colors.textOnDark}
            />
          </TouchableOpacity>

          {/* Skip back */}
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

          {/* Play / Pause */}
          <TouchableOpacity onPress={handlePlayPause} style={currentVideoStyles.playButton}>
            <Ionicons
              name={status.isPlaying ? 'pause' : 'play'}
              size={32}
              color={theme.colors.textOnDark}
            />
          </TouchableOpacity>

          {/* Skip forward */}
          <TouchableOpacity onPress={() => handleSkip(10)} style={currentVideoStyles.controlButton}>
            <Ionicons
              name={isRTL() ? 'play-back' : 'play-forward'}
              size={24}
              color={theme.colors.textOnDark}
            />
          </TouchableOpacity>

          {/* Fullscreen — right side */}
          <TouchableOpacity onPress={handleFullscreen} style={currentVideoStyles.actionIconButton}>
            <Ionicons name="expand" size={20} color={theme.colors.textOnDark} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const NoteModal: React.FC<{
  visible: boolean;
  initialNote: string;
  title: string;
  onClose: () => void;
  onSave: (note: string) => void;
  theme: any;
  spacing: any;
  borderRadius: any;
  t: any;
  isRTL: boolean;
  typography: any;
  onDelete?: () => void;
}> = ({
  visible,
  initialNote,
  title,
  onClose,
  onSave,
  theme,
  spacing,
  borderRadius,
  t,
  isRTL,
  typography,
  onDelete,
}) => {
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote, visible]);

  return (
    <ConfirmModal
      visible={visible}
      title={title}
      confirmLabel={t('common.save')}
      cancelLabel={t('common.cancel')}
      onConfirm={() => onSave(note)}
      onCancel={onClose}
    >
      <View style={{ marginTop: spacing.md }}>
        <TextInput
          style={{
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            height: 120,
            textAlignVertical: 'top',
            color: theme.colors.text,
            ...typography('body'),
            textAlign: isRTL ? 'right' : 'left',
          }}
          placeholder={t('study_lesson.notes_placeholder', 'Add your note here...')}
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          value={note}
          onChangeText={setNote}
          autoFocus
        />
        {onDelete && initialNote && (
          <TouchableOpacity
            onPress={onDelete}
            style={{
              marginTop: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.sm,
              backgroundColor: theme.colors.error + '10',
              borderRadius: borderRadius.md,
              marginBottom: 14,
            }}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={theme.colors.error}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{ ...typography('caption'), color: theme.colors.error, fontWeight: '700' }}
            >
              {t('common.delete', 'Delete')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ConfirmModal>
  );
};

const StudyLessonScreen: React.FC = () => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const [currentLesson, setCurrentLesson] = useState<Lesson>(route.params?.lesson);
  const [allLessons, setAllLessons] = useState<Lesson[]>(route.params?.allLessons || []);
  const [subject, setSubject] = useState(route.params?.subject);
  const { checkSubscription } = useSubscriptionGate();
  const [activeTab, setActiveTab] = useState<'lesson' | 'notes'>('lesson');
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

  const [localAlert, setLocalAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Like / Dislike — seeded from the lesson list query (myInteraction)
  const [interaction, setInteraction] = useState<'LIKE' | 'DISLIKE' | null>(
    currentLesson.myInteraction ?? null,
  );
  const confirmedInteractionRef = useRef<'LIKE' | 'DISLIKE' | null>(
    currentLesson.myInteraction ?? null,
  );
  const interactionCacheRef = useRef<Map<string, 'LIKE' | 'DISLIKE' | null>>(
    new Map(allLessons.map((l) => [l.id, l.myInteraction ?? null])),
  );

  const [savedPoints, setSavedPoints] = useState<Map<string, UserSavedPoint>>(new Map());
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [highlightedPointId, setHighlightedPointId] = useState<string | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const mutationInFlightRef = useRef(false);
  const pointLayoutsRef = useRef<Map<string, number>>(new Map());
  const pointsSectionLayoutY = useRef<number>(0);

  // Re-seed when the user navigates to a different lesson
  useEffect(() => {
    let cachedInteraction = interactionCacheRef.current.get(currentLesson.id);
    if (cachedInteraction === undefined) {
      // Seed cache with the lesson's own interaction state
      cachedInteraction = currentLesson.myInteraction ?? null;
      interactionCacheRef.current.set(currentLesson.id, cachedInteraction);
    }
    setInteraction(cachedInteraction);
    confirmedInteractionRef.current = cachedInteraction;
  }, [currentLesson.id, currentLesson.myInteraction]);

  const handleVideoInteraction = useCallback(
    async (type: 'LIKE' | 'DISLIKE') => {
      if (mutationInFlightRef.current) return;
      try {
        mutationInFlightRef.current = true;
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return;

        const previous = confirmedInteractionRef.current;
        // Toggle off if same type, switch otherwise
        const optimistic: 'LIKE' | 'DISLIKE' | null = previous === type ? null : type;
        setInteraction(optimistic);

        const result = await tryFetchWithFallback(
          `mutation ToggleLessonInteraction($lessonId: ID!, $type: String!) {
          toggleLessonInteraction(lessonId: $lessonId, type: $type) {
            success
            interactionType
            message
          }
        }`,
          { lessonId: currentLesson.id, type },
          token,
        );

        const payload = result.data?.toggleLessonInteraction;
        if (payload?.success) {
          // Server tells us the new interactionType ("LIKE", "DISLIKE", or null)
          const confirmed = (payload.interactionType as 'LIKE' | 'DISLIKE' | null) ?? null;
          confirmedInteractionRef.current = confirmed;
          interactionCacheRef.current.set(currentLesson.id, confirmed);
          setInteraction(confirmed);
        } else {
          // Roll back to last confirmed state
          confirmedInteractionRef.current = previous;
          interactionCacheRef.current.set(currentLesson.id, previous);
          setInteraction(previous);
        }
      } catch (err) {
        console.error('Toggle interaction error:', err);
        setInteraction(confirmedInteractionRef.current);
      } finally {
        mutationInFlightRef.current = false;
      }
    },
    [currentLesson.id],
  );

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const inferredLanguage = useMemo(() => {
    if (subject?.language) return subject.language;
    // Fall back to detecting Arabic in currentLesson name or chapter name
    const hasArabic = (text?: string) => (text ? /[\u0600-\u06FF]/.test(text) : false);
    if (hasArabic(currentLesson?.name) || hasArabic(currentLesson?.chapter?.name)) {
      return 'ar';
    }
    // As a final fallback, check the app's current language/direction
    return isRTL ? 'ar' : 'en';
  }, [subject?.language, currentLesson?.name, currentLesson?.chapter?.name, isRTL]);

  const { contentAlign, contentRowDirection } = useSubjectTextAlign(inferredLanguage);
  const currentStyles = useMemo(
    () =>
      styles(
        theme,
        isRTL,
        typography,
        fontWeight,
        insets,
        spacing,
        borderRadius,
        contentAlign,
        contentRowDirection,
      ),
    [
      theme,
      isRTL,
      typography,
      fontWeight,
      insets,
      spacing,
      borderRadius,
      contentAlign,
      contentRowDirection,
    ],
  );

  // Open local leave-disclaimer (works inside iOS native fullScreenModal).
  const handleLeaveLesson = useCallback(() => {
    if (route.params?.fromBookmarks) {
      navigation.goBack();
      return true;
    }
    setShowLeaveModal(true);
    return true; // block Android default back action
  }, [navigation, route.params?.fromBookmarks]);

  // Android hardware back → leave disclaimer
  useAndroidBack(handleLeaveLesson);

  // Expanding/collapsing a point only toggles its explanation — it does NOT
  // mark the point as done. "Done" is recorded solely via the check icon.
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
    if (viewedPoints.has(lessonPointId)) return;
    // Optimistically mark done so the check fills immediately. The server
    // mutation returns false when the view was already recorded (e.g. after
    // switching lessons with a stale is_viewed flag), which previously left the
    // check empty — don't gate the UI on that boolean.
    const lessonId = currentLesson.id;
    setViewedPoints((prev) => new Set(prev).add(lessonPointId));
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      await tryFetchWithFallback(
        `mutation RecordView($lessonPointId: ID!) { recordKeyPointView(lessonPointId: $lessonPointId) }`,
        { lessonPointId },
        token,
      );
      fetchDodProgress(lessonId);
    } catch (err) {
      console.error('Record view error:', err);
    }
  };

  const fetchLessonDetails = async (lessonId: string) => {
    try {
      setFetchingDetails(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      // We use mySavedPoints because it's guaranteed to return the lesson object
      // if we're navigating from a bookmark.
      const result = await tryFetchWithFallback(
        `query GetLessonDetails($lessonId: ID) {
          mySavedPoints(lessonId: $lessonId) {
            lesson {
              id
              name
              summary
              videoUrl
              myInteraction
              lessonPoints {
                id
                title
                explanation
                order
                is_viewed
              }
              chapter {
                id
                name
                order
              }
            }
          }
        }`,
        { lessonId },
        token,
      );

      if (result.data?.mySavedPoints?.[0]?.lesson) {
        const fullLesson = result.data.mySavedPoints[0].lesson;
        setCurrentLesson((prev) => ({
          ...prev,
          ...fullLesson,
          lessonPoints: fullLesson.lessonPoints || [],
        }));

        if (fullLesson.lessonPoints) {
          setViewedPoints(
            new Set(fullLesson.lessonPoints.filter((p: any) => p.is_viewed).map((p: any) => p.id)),
          );
        }
      }
    } catch (err) {
      console.error('Fetch lesson details error:', err);
    } finally {
      setFetchingDetails(false);
    }
  };

  const fetchLessonMetadata = async (lessonId: string) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `query MySavedPointsMetadata($lessonId: ID) {
          mySavedPoints(lessonId: $lessonId) {
            id
            is_bookmarked
            note_content
            lessonPoint { id }
          }
        }`,
        { lessonId },
        token,
      );

      if (result.data?.mySavedPoints) {
        const pointsMap = new Map<string, UserSavedPoint>();
        result.data.mySavedPoints.forEach((p: UserSavedPoint) => {
          pointsMap.set(p.lessonPoint.id, p);
        });
        setSavedPoints(pointsMap);
      }
    } catch (err) {
      console.error('Fetch metadata error:', err);
    }
  };

  const handleToggleBookmark = async (pointId: string) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `mutation ToggleSavedPointBookmark($lessonId: ID!, $lessonPointId: ID!) {
          toggleSavedPointBookmark(lessonId: $lessonId, lessonPointId: $lessonPointId) {
            success
            message
            savedPoint {
              id
              is_bookmarked
              note_content
              lessonPoint { id }
            }
          }
        }`,
        { lessonId: currentLesson.id, lessonPointId: pointId },
        token,
      );

      if (result.data?.toggleSavedPointBookmark?.success) {
        const sp = result.data.toggleSavedPointBookmark.savedPoint;
        const isBookmarked = sp?.is_bookmarked;

        setSavedPoints((prev) => {
          const next = new Map(prev);
          if (sp) {
            next.set(pointId, sp);
          } else {
            next.delete(pointId);
          }
          return next;
        });

        // Show confirmation
        setLocalAlert({
          visible: true,
          title: t('common.success'),
          message: isBookmarked
            ? t('study_lesson.bookmark_added', 'Bookmark added successfully')
            : t('study_lesson.bookmark_removed', 'Bookmark removed'),
        });
      }
    } catch (err) {
      console.error('Toggle bookmark error:', err);
    }
  };

  const handleSaveNote = async (pointId: string, note: string) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `mutation SavePointNote($lessonId: ID!, $lessonPointId: ID!, $noteContent: String!) {
          savePointNote(lessonId: $lessonId, lessonPointId: $lessonPointId, noteContent: $noteContent) {
            success
            message
            savedPoint {
              id
              is_bookmarked
              note_content
              lessonPoint { id }
            }
          }
        }`,
        { lessonId: currentLesson.id, lessonPointId: pointId, noteContent: note },
        token,
      );

      if (result.data?.savePointNote?.success) {
        let sp = result.data.savePointNote.savedPoint;
        const wasBookmarked = savedPoints.get(pointId)?.is_bookmarked ?? false;
        // The backend's savePointNote auto-enables the bookmark. If the user
        // hadn't bookmarked this point, undo it so note and bookmark stay
        // independent and the bookmark toggle stays in sync (backend + UI agree).
        if (sp && !wasBookmarked && sp.is_bookmarked) {
          const undo = await tryFetchWithFallback(
            `mutation ToggleSavedPointBookmark($lessonId: ID!, $lessonPointId: ID!) {
              toggleSavedPointBookmark(lessonId: $lessonId, lessonPointId: $lessonPointId) {
                success
                savedPoint { id is_bookmarked note_content lessonPoint { id } }
              }
            }`,
            { lessonId: currentLesson.id, lessonPointId: pointId },
            token,
          );
          if (undo.data?.toggleSavedPointBookmark?.savedPoint) {
            sp = undo.data.toggleSavedPointBookmark.savedPoint;
          }
        }
        setSavedPoints((prev) => {
          const next = new Map(prev);
          if (sp) {
            next.set(pointId, sp);
          }
          return next;
        });
        setNoteModalVisible(false);
        // Show confirmation
        setLocalAlert({
          visible: true,
          title: t('common.success'),
          message: t('study_lesson.note_saved_success', 'Note saved successfully'),
        });
      }
    } catch (err) {
      console.error('Save note error:', err);
    }
  };

  const handleDeleteNote = async (pointId: string) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `mutation DeletePointNote($lessonPointId: ID!) {
          deletePointNote(lessonPointId: $lessonPointId) {
            success
            message
            savedPoint {
              id
              is_bookmarked
              note_content
              lessonPoint { id }
            }
          }
        }`,
        { lessonPointId: pointId },
        token,
      );

      if (result.data?.deletePointNote?.success) {
        const sp = result.data.deletePointNote.savedPoint;
        setSavedPoints((prev) => {
          const next = new Map(prev);
          if (sp) {
            next.set(pointId, sp);
          } else {
            next.delete(pointId);
          }
          return next;
        });
        setNoteModalVisible(false);
        // Show confirmation
        setLocalAlert({
          visible: true,
          title: t('common.success'),
          message: t('study_lesson.note_deleted_success', 'Note deleted successfully'),
        });
      }
    } catch (err) {
      console.error('Delete note error:', err);
    }
  };

  React.useEffect(() => {
    fetchDodProgress(currentLesson.id);
    fetchLessonMetadata(currentLesson.id);

    // If lesson points are missing, fetch them
    if (!currentLesson.lessonPoints || currentLesson.lessonPoints.length === 0) {
      fetchLessonDetails(currentLesson.id);
    }
    analytics.trackLessonStarted({
      lesson_id: currentLesson.id,
      lesson_title: currentLesson.name,
      chapter_id: currentLesson.chapter?.id,
      chapter_title: currentLesson.chapter?.name,
      subject_id: subject?.id,
      subject_title: subject?.name,
    });
  }, [currentLesson.id]);

  useEffect(() => {
    if (route.params?.initialPointId && currentLesson.lessonPoints?.length) {
      const pointId = route.params.initialPointId;

      // Ensure the point is expanded
      setExpandedPoints((prev) => new Set(prev).add(pointId));
      setHighlightedPointId(pointId);

      // Delay slightly to allow layout to be captured
      const timer = setTimeout(() => {
        const pointY = pointLayoutsRef.current.get(pointId);
        if (pointY !== undefined && scrollViewRef.current) {
          // Absolute Y = Section Y + Point Y - Header Offset (optional)
          const absoluteY = pointsSectionLayoutY.current + pointY - 20;
          scrollViewRef.current.scrollTo({ y: absoluteY, animated: true });
        }
      }, 800);

      const highlightTimer = setTimeout(() => setHighlightedPointId(null), 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(highlightTimer);
      };
    }
  }, [route.params?.initialPointId, currentLesson.lessonPoints]);

  const handleNavigateLesson = (lesson: Lesson) => {
    // Locked lessons aren't navigable (mirror the lessons list).
    if (lesson?.isLocked) {
      setLocalAlert({
        visible: true,
        title: t('study_lesson.locked_title', 'Lesson Locked'),
        message: t('study_chapters.locked_lesson', 'Purchase required or restricted'),
      });
      return;
    }
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
    setHighlightedPointId(null);
    // Clear the previous lesson's saved points immediately; the effect re-fetches
    // them for the new lesson (avoids a stale-data window between switches).
    setSavedPoints(new Map());
    setViewedPoints(
      new Set(lesson.lessonPoints?.filter((p) => p.is_viewed).map((p) => p.id) || []),
    );

    // Restore persisted interaction from cache instead of stale lesson object
    const cachedInteraction = interactionCacheRef.current.get(lesson.id) ?? null;
    setInteraction(cachedInteraction);
    confirmedInteractionRef.current = cachedInteraction;

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

  // Key points that have a saved note — drives the "My Notes" tab.
  const notedPoints = (currentLesson.lessonPoints || []).filter(
    (p) => savedPoints.get(p.id)?.note_content,
  );

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
          <>
            <View style={currentStyles.videoSection}>
              <LessonVideoPlayer
                url={currentLesson.videoUrl as string}
                theme={theme}
                spacing={spacing}
                borderRadius={borderRadius}
                typography={typography}
              />
            </View>
            {/* Like / Dislike */}
            <View style={currentStyles.interactionRow}>
              <TouchableOpacity
                style={[
                  currentStyles.interactionButton,
                  interaction === 'LIKE'
                    ? currentStyles.interactionButtonLikeActive
                    : currentStyles.interactionButtonDefault,
                ]}
                onPress={() => handleVideoInteraction('LIKE')}
              >
                <Ionicons
                  name={interaction === 'LIKE' ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={20}
                  color={interaction === 'LIKE' ? '#fff' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    currentStyles.interactionText,
                    { color: interaction === 'LIKE' ? '#fff' : theme.colors.textSecondary },
                  ]}
                >
                  {t('common.like')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  currentStyles.interactionButton,
                  interaction === 'DISLIKE'
                    ? currentStyles.interactionButtonDislikeActive
                    : currentStyles.interactionButtonDefault,
                ]}
                onPress={() => handleVideoInteraction('DISLIKE')}
              >
                <Ionicons
                  name={interaction === 'DISLIKE' ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={20}
                  color={interaction === 'DISLIKE' ? '#fff' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    currentStyles.interactionText,
                    { color: interaction === 'DISLIKE' ? '#fff' : theme.colors.textSecondary },
                  ]}
                >
                  {t('common.dislike')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Tabs: Summary & Key Points | My Notes */}
        <View style={currentStyles.tabBar}>
          <TouchableOpacity
            style={currentStyles.tab}
            onPress={() => setActiveTab('lesson')}
            activeOpacity={0.7}
          >
            <Text
              style={[currentStyles.tabText, activeTab === 'lesson' && currentStyles.tabTextActive]}
            >
              {t('study_lesson.tab_overview', 'Summary & Points')}
            </Text>
            <View
              style={[
                currentStyles.tabUnderline,
                activeTab !== 'lesson' && currentStyles.tabUnderlineHidden,
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={currentStyles.tab}
            onPress={() => setActiveTab('notes')}
            activeOpacity={0.7}
          >
            <Text
              style={[currentStyles.tabText, activeTab === 'notes' && currentStyles.tabTextActive]}
            >
              {t('study_lesson.my_notes', 'My Notes')}
            </Text>
            <View
              style={[
                currentStyles.tabUnderline,
                activeTab !== 'notes' && currentStyles.tabUnderlineHidden,
              ]}
            />
          </TouchableOpacity>
        </View>

        {activeTab === 'lesson' && (
          <>
            <View style={currentStyles.section}>
              <View style={currentStyles.sectionHeader}>
                <View
                  style={[
                    currentStyles.sectionIcon,
                    { backgroundColor: theme.colors.primary + '1A' },
                  ]}
                >
                  <Ionicons name="newspaper-outline" size={20} color={theme.colors.primary} />
                </View>
                <Text
                  style={[
                    currentStyles.sectionTitle,
                    { color: theme.colors.primary, fontSize: 20 },
                  ]}
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

            <View
              style={currentStyles.section}
              onLayout={(e) => {
                pointsSectionLayoutY.current = e.nativeEvent.layout.y;
              }}
            >
              <View style={currentStyles.sectionHeader}>
                <View
                  style={[
                    currentStyles.sectionIcon,
                    { backgroundColor: theme.colors.primary + '1A' },
                  ]}
                >
                  <Ionicons name="star-outline" size={20} color={theme.colors.primary} />
                </View>
                <Text style={currentStyles.sectionTitle}> {t('study_lesson.key_points')} </Text>
                {fetchingDetails && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </View>

              {hasNewPoints ? (
                <View style={currentStyles.pointsList}>
                  {currentLesson.lessonPoints!.map((point, idx) => {
                    const isExpanded = expandedPoints.has(point.id);
                    const isViewed = viewedPoints.has(point.id);
                    const saved = savedPoints.get(point.id);
                    const isBookmarked = !!saved?.is_bookmarked;
                    const hasNote = !!saved?.note_content;
                    return (
                      <TouchableOpacity
                        key={point.id}
                        onLayout={(e) =>
                          pointLayoutsRef.current.set(point.id, e.nativeEvent.layout.y)
                        }
                        style={[
                          currentStyles.kpCard,
                          isViewed && currentStyles.kpCardDone,
                          highlightedPointId === point.id && currentStyles.kpCardHighlight,
                        ]}
                        onPress={() => point.explanation && togglePoint(point.id)}
                        activeOpacity={point.explanation ? 0.7 : 1}
                      >
                        <View style={currentStyles.kpTop}>
                          <TouchableOpacity
                            style={[currentStyles.kpCheck, isViewed && currentStyles.kpCheckDone]}
                            onPress={() => !isViewed && handleRecordView(point.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            activeOpacity={0.7}
                          >
                            {isViewed && <Ionicons name="checkmark" size={14} color="#fff" />}
                          </TouchableOpacity>
                          <Text
                            style={[currentStyles.kpText, isViewed && currentStyles.kpTextDone]}
                          >
                            {point.title}
                          </Text>
                          {point.explanation && (
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={18}
                              color={theme.colors.textSecondary}
                              style={currentStyles.kpChevron}
                            />
                          )}
                        </View>

                        {isExpanded && point.explanation && (
                          <View style={currentStyles.explanationContainer}>
                            <Text style={currentStyles.explanationText}>{point.explanation}</Text>
                          </View>
                        )}

                        {hasNote && (
                          <View style={currentStyles.noteBubble}>
                            <Ionicons name="document-text" size={14} color="#CA8A04" />
                            <Text style={currentStyles.noteBubbleText} numberOfLines={3}>
                              {saved?.note_content}
                            </Text>
                          </View>
                        )}

                        <View style={currentStyles.kpActions}>
                          <TouchableOpacity
                            onPress={() => handleToggleBookmark(point.id)}
                            style={[
                              currentStyles.kpActionBtn,
                              isBookmarked && currentStyles.kpActionBtnSaved,
                            ]}
                          >
                            <Ionicons
                              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                              size={14}
                              color={
                                isBookmarked ? theme.colors.warning : theme.colors.textSecondary
                              }
                            />
                            <Text
                              style={[
                                currentStyles.kpActionText,
                                isBookmarked && { color: theme.colors.warning },
                              ]}
                            >
                              {isBookmarked
                                ? t('study_lesson.saved', 'Saved')
                                : t('study_lesson.save', 'Save')}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedPointId(point.id);
                              setNoteModalVisible(true);
                            }}
                            style={[
                              currentStyles.kpActionBtn,
                              hasNote && currentStyles.kpActionBtnNote,
                            ]}
                          >
                            <Ionicons
                              name={hasNote ? 'document-text' : 'document-text-outline'}
                              size={14}
                              color={hasNote ? theme.colors.primary : theme.colors.textSecondary}
                            />
                            <Text
                              style={[
                                currentStyles.kpActionText,
                                hasNote && { color: theme.colors.primary },
                              ]}
                            >
                              {hasNote
                                ? t('study_lesson.edit_note', 'Edit note')
                                : t('study_lesson.add_note', 'Note')}
                            </Text>
                          </TouchableOpacity>
                          <Text style={currentStyles.kpNum}>
                            {idx + 1} {t('study_lesson.of', 'of')}{' '}
                            {currentLesson.lessonPoints!.length}
                          </Text>
                        </View>
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
                          style={[
                            currentStyles.pointBullet,
                            { backgroundColor: theme.colors.primary },
                          ]}
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
                  style={[
                    currentStyles.sectionIcon,
                    { backgroundColor: theme.colors.success + '1A' },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={theme.colors.success}
                  />
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
                  {[
                    {
                      label: t('study_lesson.dod_view_points', 'View all key points'),
                      current: dodProgress.keyPointsViewed,
                      total: dodProgress.keyPointsTotal,
                    },
                    {
                      label: t('study_lesson.dod_pass_quizzes', 'Pass required quizzes'),
                      current: dodProgress.quizzesPassed,
                      total: dodProgress.quizzesRequired,
                    },
                  ].map((row) => {
                    const done = row.total > 0 && row.current >= row.total;
                    const started = row.current > 0;
                    // green when done, amber/loading when in progress, neutral when not started
                    const stateColor = done
                      ? theme.colors.success
                      : started
                        ? theme.colors.warning
                        : theme.colors.textTertiary;
                    return (
                      <View key={row.label} style={currentStyles.dodItem}>
                        <Ionicons
                          name={
                            done
                              ? 'checkmark-circle'
                              : started
                                ? 'hourglass-outline'
                                : 'ellipse-outline'
                          }
                          size={20}
                          color={stateColor}
                        />
                        <Text style={currentStyles.dodText}>{row.label}</Text>
                        <View
                          style={[currentStyles.dodPill, { backgroundColor: stateColor + '1A' }]}
                        >
                          <Text style={[currentStyles.dodPillText, { color: stateColor }]}>
                            {row.current} / {row.total}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  <View style={currentStyles.dodProgressContainer}>
                    <View style={currentStyles.dodProgressBar}>
                      <LinearGradient
                        colors={['#004A9A', '#3B82F6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          currentStyles.dodProgressFill,
                          { width: `${dodProgress.totalProgress}%` },
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
          </>
        )}

        {activeTab === 'notes' && (
          <View style={currentStyles.notesTab}>
            {notedPoints.length > 0 ? (
              notedPoints.map((point) => (
                <TouchableOpacity
                  key={point.id}
                  style={currentStyles.noteCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedPointId(point.id);
                    setNoteModalVisible(true);
                  }}
                >
                  <Text style={currentStyles.noteCardTitle} numberOfLines={3}>
                    {point.title}
                  </Text>
                  <View style={currentStyles.noteCardBubble}>
                    <Ionicons name="pencil" size={13} color={theme.colors.primary} />
                    <Text style={currentStyles.noteCardText}>
                      {savedPoints.get(point.id)?.note_content}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={currentStyles.notesEmpty}>
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color={theme.colors.textTertiary}
                />
                <Text style={currentStyles.noContentText}>
                  {t(
                    'study_lesson.no_notes',
                    'No notes yet. Tap the note icon on a key point to add one.',
                  )}
                </Text>
              </View>
            )}
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

      <NoteModal
        visible={noteModalVisible}
        title={t('study_lesson.add_note')}
        initialNote={selectedPointId ? savedPoints.get(selectedPointId)?.note_content || '' : ''}
        onClose={() => setNoteModalVisible(false)}
        onSave={(note) => selectedPointId && handleSaveNote(selectedPointId, note)}
        onDelete={() => selectedPointId && handleDeleteNote(selectedPointId)}
        theme={theme}
        spacing={spacing}
        borderRadius={borderRadius}
        t={t}
        isRTL={isRTL}
        typography={typography}
      />

      <ConfirmModal
        visible={!!localAlert?.visible}
        title={localAlert?.title || ''}
        message={localAlert?.message || ''}
        confirmLabel={t('common.ok', 'OK')}
        showCancel={false}
        onConfirm={() => {
          if (localAlert) {
            setLocalAlert((prev) => (prev ? { ...prev, visible: false } : null));
            setTimeout(() => {
              setLocalAlert(null);
            }, 500);
          }
        }}
        onCancel={() => {
          if (localAlert) {
            setLocalAlert((prev) => (prev ? { ...prev, visible: false } : null));
            setTimeout(() => {
              setLocalAlert(null);
            }, 500);
          }
        }}
      />
    </View>
  );
};

const styles = (
  theme: any,
  isRTL: boolean,
  baseTypography: any,
  fontWeight: any,
  insets: { top: number; bottom: number },
  spacing: any,
  borderRadius: any,
  contentAlign: 'left' | 'right',
  contentRowDirection: 'row' | 'row-reverse',
) => {
  // Slightly smaller type across the whole lesson screen.
  const typography = (style: any, weight?: any, forceArabic?: any) => {
    const o: any = baseTypography(style, weight, forceArabic);
    return o?.fontSize ? { ...o, fontSize: o.fontSize - 1.5 } : o;
  };
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    titleBreadcrumbContainer: {
      // Title + breadcrumb sit on the page (no card) like the design.
      marginBottom: spacing.md,
      alignItems: 'flex-start',
    },
    breadcrumbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor:
        theme.mode === 'dark' ? theme.colors.primary + '33' : theme.colors.primary + '1A',
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor:
        theme.mode === 'dark' ? theme.colors.primary + '4D' : theme.colors.primary + '33',
      maxWidth: '100%',
    },
    breadcrumbIcon: {
      marginRight: 12,
      flexShrink: 0,
    },
    chapterBadge: {
      ...typography('caption'),
      fontSize: 12,
      ...fontWeight('700'),
      color: theme.colors.primary,
      textAlign: contentAlign,
      flexShrink: 1,
    },
    mainTitle: {
      ...typography('h2'),
      fontSize: 21,
      lineHeight: 28,
      ...fontWeight('800'),
      color: theme.colors.text,
      textAlign: contentAlign,
      width: '100%',
      marginTop: spacing.xs,
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
      marginStart: spacing.sm,
      marginEnd: spacing.sm,
      color: theme.colors.text,
    },
    videoSection: {
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: '#000',
      ...layout.shadow,
    },
    interactionRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: spacing.sectionGap,
    },
    interactionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      gap: 8,
    },
    interactionButtonDefault: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    interactionButtonLikeActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    interactionButtonDislikeActive: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.error,
    },
    interactionText: {
      ...typography('caption'),
      ...fontWeight('600'),
    },
    summaryText: {
      ...typography('bodyLarge'),
      lineHeight: 24,
      color: theme.colors.text,
      textAlign: contentAlign,
    },
    noContentText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: contentAlign,
    },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.border,
      marginBottom: spacing.md,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    tabText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
    },
    tabTextActive: {
      color: theme.colors.primary,
    },
    tabUnderline: {
      position: 'absolute',
      bottom: -2,
      left: 0,
      right: 0,
      height: 2,
      borderRadius: 99,
      backgroundColor: theme.colors.primary,
    },
    tabUnderlineHidden: {
      backgroundColor: 'transparent',
    },
    notesTab: {
      gap: spacing.sm,
    },
    notesEmpty: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    noteCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    noteCardTitle: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: contentAlign,
    },
    noteCardBubble: {
      flexDirection: contentRowDirection,
      alignItems: 'flex-start',
      gap: 6,
      backgroundColor: theme.colors.primary + '0D',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
    },
    noteCardText: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      flex: 1,
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
      marginStart: spacing.sm,
      color: theme.colors.text,
      textAlign: contentAlign,
      fontWeight: '600',
    },
    explanationContainer: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginStart: 28,
      marginEnd: 28,
    },
    explanationText: {
      ...typography('caption'),
      fontSize: 14,
      lineHeight: 19,
      color: theme.colors.textSecondary,
      textAlign: contentAlign,
    },
    // Mockup-style key-point cards
    kpCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStartWidth: 3.5,
      borderStartColor: theme.colors.border,
      padding: spacing.md,
      ...layout.shadow,
    },
    kpCardDone: {
      backgroundColor: theme.colors.success + '0D',
      borderStartColor: theme.colors.success,
    },
    kpCardHighlight: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
      borderStartColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '0D',
    },
    kpTop: {
      flexDirection: contentRowDirection,
      alignItems: 'flex-start',
      gap: 10,
    },
    kpCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
      flexShrink: 0,
    },
    kpCheckDone: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
    kpText: {
      flex: 1,
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: contentAlign,
      lineHeight: 21,
    },
    kpTextDone: {
      color: theme.colors.textSecondary,
    },
    kpChevron: {
      marginTop: 2,
      flexShrink: 0,
    },
    noteBubble: {
      flexDirection: contentRowDirection,
      alignItems: 'flex-start',
      gap: 6,
      backgroundColor: '#FEF9C3',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      marginTop: spacing.sm,
    },
    noteBubbleText: {
      flex: 1,
      ...typography('caption'),
      color: '#78350F',
      textAlign: contentAlign,
    },
    kpActions: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    kpActionBtn: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
    },
    kpActionBtnSaved: {
      backgroundColor: theme.colors.warning + '1A',
    },
    kpActionBtnNote: {
      backgroundColor: theme.colors.primary + '14',
    },
    kpActionText: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    kpNum: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
      marginStart: 'auto',
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
    dodPill: {
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 999,
    },
    dodPillText: {
      ...typography('label'),
      ...fontWeight('bold'),
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
};

const videoStyles = (theme: any, spacing: any, borderRadius: any, typography: any) =>
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
      ...typography('label'),
      color: '#fff',
    },
    mainButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
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
    bottomActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    actionIconButton: {
      padding: 6,
    },
  });

export default StudyLessonScreen;
