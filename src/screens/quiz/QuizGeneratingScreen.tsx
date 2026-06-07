import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../hooks/useTypography';
import { tryFetchWithFallback } from '../../config/api';
import { ConfirmModal } from '../../components/ConfirmModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type StepStatus = 'pending' | 'loading' | 'done';

const QuizGeneratingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { subject, selectedLessonIds, selectedTypeId, timedMode, questionCount } =
    route.params || {};

  const { theme, spacing, fontSizes } = useTheme();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const [localModalVisible, setLocalModalVisible] = useState(false);
  const [localModalError, setLocalModalError] = useState<string | null>(null);

  // Animation shared values
  const transitionProgress = useSharedValue(0);
  const logoScale = useSharedValue(1);
  const logoRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.6);
  const progressBarWidth = useSharedValue(0);

  // States
  const [phase, setPhase] = useState<'blue' | 'white'>('blue');
  const [step1, setStep1] = useState<StepStatus>('pending');
  const [step2, setStep2] = useState<StepStatus>('pending');
  const [step3, setStep3] = useState<StepStatus>('pending');
  const [timelineCompleted, setTimelineCompleted] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiCompleted, setApiCompleted] = useState(false);

  // Start breathing / spinning animations
  useEffect(() => {
    progressBarWidth.value = withTiming(1, {
      duration: 1800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.ease }),
        withTiming(1.0, { duration: 1000, easing: Easing.ease }),
      ),
      -1,
      true,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1000, easing: Easing.ease }),
        withTiming(0.4, { duration: 1000, easing: Easing.ease }),
      ),
      -1,
      true,
    );
    logoRotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // API Call: mutation StartQuiz
  useEffect(() => {
    let active = true;
    const startQuizApi = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          if (active) setApiError('No authentication token found');
          return;
        }
        const result = await tryFetchWithFallback(
          `mutation StartQuiz($subjectId: ID!, $lessonIds: [ID!]!, $quizTypeId: ID) { startQuiz(subjectId: $subjectId, lessonIds: $lessonIds, quizTypeId: $quizTypeId) { id } }`,
          { subjectId: subject.id, lessonIds: selectedLessonIds, quizTypeId: selectedTypeId },
          token,
        );
        if (!active) return;
        if (result.data?.startQuiz) {
          setQuizId(result.data.startQuiz.id);
        } else {
          setApiError(result.errors?.[0]?.message || t('quiz_screen.error_loading_history'));
        }
      } catch (err: any) {
        if (active) setApiError(err.message || t('quiz_screen.error_loading_history'));
      } finally {
        if (active) setApiCompleted(true);
      }
    };
    startQuizApi();
    return () => {
      active = false;
    };
  }, [subject?.id, selectedLessonIds, selectedTypeId]);

  // Combined timeline timer (exactly 6 seconds total: 4s animations + 2s pause)
  useEffect(() => {
    // Timeline checkpoints
    // 0.0s to 1.8s: Full-screen blue animation
    // 1.8s: Transition starts
    // 2.4s: Transition complete, Phase 2 starts, Step 1 loading
    // 2.9s: Step 1 done, Step 2 loading
    // 3.4s: Step 2 done, Step 3 loading
    // 4.0s: Step 3 done, complete animation timeline
    // 4.0s to 6.0s: Pause for 2 seconds
    // 6.0s: timelineCompleted triggers navigation

    const t1 = setTimeout(() => {
      // Start background shrink transition
      setPhase('white');
      transitionProgress.value = withTiming(1, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, 1800);

    const t2 = setTimeout(() => {
      setStep1('loading');
    }, 2400);

    const t3 = setTimeout(() => {
      setStep1('done');
      setStep2('loading');
    }, 2900);

    const t4 = setTimeout(() => {
      setStep2('done');
      setStep3('loading');
    }, 3400);

    const t5 = setTimeout(() => {
      setStep3('done');
    }, 4000);

    const t6 = setTimeout(() => {
      setTimelineCompleted(true);
    }, 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  // Navigation controller once timeline completes AND API completes
  useEffect(() => {
    if (__DEV__) {
      console.log('[QuizGeneratingScreen] Navigation check:', {
        timelineCompleted,
        apiCompleted,
        quizId,
        apiError,
        timedMode,
      });
    }

    if (timelineCompleted && apiCompleted) {
      if (apiError || !quizId) {
        if (__DEV__)
          console.warn(
            '[QuizGeneratingScreen] Error occurred, setting local modal state:',
            apiError,
          );
        setLocalModalError(apiError || t('quiz_screen.error_loading_history'));
        setLocalModalVisible(true);
      } else {
        if (__DEV__)
          console.log(
            '[QuizGeneratingScreen] Success! Resetting stack with MainTabs and QuizTaking',
          );
        try {
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'MainTabs' },
                { name: 'QuizTaking', params: { quizId, isTimed: timedMode } },
              ],
            }),
          );
        } catch (e: any) {
          if (__DEV__)
            console.error(
              '[QuizGeneratingScreen] Atomic reset failed, using fallback navigation:',
              e,
            );
          navigation.navigate('QuizTaking', { quizId, isTimed: timedMode });
        }
      }
    }
  }, [timelineCompleted, apiCompleted, quizId, apiError]);

  // Reanimated style for shifting background (GPU accelerated opacity)
  const animatedBgStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - transitionProgress.value,
    };
  });

  const animatedPhase1ContentStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - transitionProgress.value,
    };
  });

  const animatedPhase2ContentStyle = useAnimatedStyle(() => {
    return {
      opacity: transitionProgress.value,
    };
  });

  const animatedLogoCardStyle = useAnimatedStyle(() => {
    const p = transitionProgress.value;
    const initialY = (SCREEN_HEIGHT - 76) / 2;
    const finalY = SCREEN_HEIGHT * 0.18;
    const translateY = (1 - p) * (initialY - finalY);

    return {
      transform: [
        { translateY },
        { scale: logoScale.value },
        { rotate: `${logoRotation.value}deg` },
      ],
    };
  });

  const animatedGreenDotStyle = useAnimatedStyle(() => {
    return {
      opacity: transitionProgress.value,
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value * (1 - transitionProgress.value),
    };
  });

  const animatedBarFillStyle = useAnimatedStyle(() => {
    return {
      width: `${progressBarWidth.value * 100}%`,
    };
  });

  const renderStepIcon = (status: StepStatus) => {
    if (status === 'done') {
      return (
        <View style={[styles.stepIconBox, styles.stepIconBoxDone]}>
          <Ionicons name="checkmark" size={12} color="#ffffff" />
        </View>
      );
    }
    if (status === 'loading') {
      return (
        <View style={styles.stepIconBox}>
          <ActivityIndicator size="small" color="#004A9A" />
        </View>
      );
    }
    return (
      <View style={[styles.stepIconBox, styles.stepIconBoxPending]}>
        <View style={styles.stepIconDot} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Phase 2: Fade in White Background behind shrinking blue square */}
      {phase === 'white' && (
        <Animated.View style={[styles.whiteBgContainer, animatedPhase2ContentStyle]}>
          <View style={[styles.checklistCard, { marginTop: SCREEN_HEIGHT * 0.18 + 110 }]}>
            <Text style={[styles.preparingTitle, { ...typography('h2'), ...fontWeight('900') }]}>
              {t('quiz_flow.generating_quiz')}
            </Text>
            <Text style={[styles.preparingSubtitle, { ...typography('caption') }]}>
              {t('quiz_flow.setting_up_subjects')}
            </Text>

            {/* Checklist */}
            <View style={styles.checklist}>
              <View style={styles.stepRow}>
                {renderStepIcon(step1)}
                <Text
                  style={[
                    styles.stepText,
                    { ...typography('button') },
                    step1 === 'done' && styles.stepTextDone,
                  ]}
                >
                  {t('quiz_flow.analyzing_progress')}
                </Text>
              </View>

              <View style={styles.stepRow}>
                {renderStepIcon(step2)}
                <Text
                  style={[
                    styles.stepText,
                    { ...typography('button') },
                    step2 === 'done' && styles.stepTextDone,
                  ]}
                >
                  {t('quiz_flow.personalizing_difficulty')}
                </Text>
              </View>

              <View style={styles.stepRow}>
                {renderStepIcon(step3)}
                <Text
                  style={[
                    styles.stepText,
                    { ...typography('button') },
                    step3 === 'done' && styles.stepTextDone,
                  ]}
                >
                  {t('quiz_flow.generating_questions', { count: questionCount })}
                </Text>
              </View>
            </View>

            {/* Ready badge */}
            {step3 === 'done' && (
              <Animated.View style={styles.readyBadge}>
                <Ionicons name="sparkles" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.readyBadgeText}>{t('quiz_flow.quiz_ready')}</Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}

      {/* Full-screen Blue Gradient Container (Overlay) */}
      <Animated.View
        style={[StyleSheet.absoluteFill, animatedBgStyle]}
        pointerEvents={phase === 'white' ? 'none' : 'auto'}
      >
        <LinearGradient
          colors={['#003B7A', '#004A9A', '#1E54B8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          {/* Phase 1 contents: Centered glowing logo */}
          <Animated.View style={[styles.phase1Centered, animatedPhase1ContentStyle]}>
            {/* Glow effect */}
            <Animated.View style={[styles.logoGlow, animatedGlowStyle]} />

            <View style={styles.phase1TextContainer}>
              <Text style={[styles.introTitle, typography('h2', '900'), { color: '#FFFFFF' }]}>
                {t('quiz_flow.generating_quiz')}
              </Text>
              <View style={styles.progressBarSection}>
                <Text
                  style={[
                    styles.generatingWithAiText,
                    typography('caption', 'bold'),
                    { color: '#FFFFFF', opacity: 0.8 },
                  ]}
                >
                  {t('quiz_flow.generating_with_ai')}
                </Text>

                <View style={styles.progressBarTrack}>
                  <Animated.View style={[styles.progressBarFill, animatedBarFillStyle]} />
                </View>
              </View>
            </View>

            {/* Orbiting sparkles simulation (pure CSS style) */}
            <View style={styles.particlesContainer}>
              <View style={[styles.particle, { top: -40, left: -50 }]} />
              <View style={[styles.particle, { top: 60, left: 80 }]} />
              <View style={[styles.particle, { top: -20, left: 90 }]} />
              <View style={[styles.particle, { top: 90, left: -60 }]} />
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Absolutely positioned Logo Card (slides up from center to top) */}
      <Animated.View style={[styles.logoCard, animatedLogoCardStyle]}>
        <Image
          source={require('../../../assets/logo-transparent.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Animated.View style={[styles.greenDot, animatedGreenDotStyle]} />
      </Animated.View>
      {/* Local Confirm Modal to bypass iOS fullScreenModal backdrop issues */}
      <ConfirmModal
        visible={localModalVisible}
        title={t('common.error')}
        message={localModalError || undefined}
        showCancel={false}
        confirmLabel={t('common.ok', 'OK')}
        onConfirm={() => {
          setLocalModalVisible(false);
          navigation.goBack();
        }}
        onCancel={() => {
          setLocalModalVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003B7A',
  },
  whiteBgContainer: {
    flex: 1,
    backgroundColor: '#F3F5FB',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
  },
  phase1Centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phase1TextContainer: {
    position: 'absolute',
    top: (SCREEN_HEIGHT - 76) / 2 + 76 + 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    top: (SCREEN_HEIGHT - 130) / 2,
    left: (SCREEN_WIDTH - 130) / 2,
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: '#004A9A',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  logoCard: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.18,
    left: SCREEN_WIDTH / 2 - 38,
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 100,
  },
  introTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  progressBarSection: {
    width: '70%',
    alignItems: 'center',
    marginTop: 24,
  },
  generatingWithAiText: {
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontSize: 11,
    marginBottom: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  particlesContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#93C5FD',
    opacity: 0.6,
  },
  phase2AvatarContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  checklistCard: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#004A9A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  preparingTitle: {
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  preparingSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  checklist: {
    width: '100%',
    gap: 16,
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  stepIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepIconBoxDone: {
    backgroundColor: '#16A34A',
  },
  stepIconBoxPending: {
    backgroundColor: '#F1F5F9',
  },
  stepIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  stepText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'left',
  },
  stepTextDone: {
    color: '#0F172A',
    textDecorationLine: 'none',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginTop: 20,
  },
  readyBadgeText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '800',
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  avatarLogoImage: {
    width: 40,
    height: 40,
  },
});

export default QuizGeneratingScreen;
