import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useApolloClient, useMutation } from '@apollo/client/react';
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
import { LessonsForSubjectDocument, StartQuizDocument } from '../../generated/graphql';
import { ConfirmModal } from '../../components/ConfirmModal';
import { classifyQuizStartError, QuizStartFailure } from '../../utils/quizStartErrors';
import { logError, logInfo } from '../../utils/logger';
import { useTrialStatus } from '../../context/TrialStatusContext';
import { hasQuizAttemptsLeft, isLockedOut } from '../../utils/trialStatus';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type StepStatus = 'pending' | 'loading' | 'done';

const QuizGeneratingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { subject, selectedLessonIds, selectedTypeId, timedMode, questionCount, questionTypes } =
    route.params || {};

  const { theme, spacing, fontSizes } = useTheme();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();

  const [localModalVisible, setLocalModalVisible] = useState(false);
  const [localModalError, setLocalModalError] = useState<string | null>(null);
  const { status: trialStatus, refresh: refreshTrialStatus } = useTrialStatus();
  const client = useApolloClient();

  // Animation shared values
  const transitionProgress = useSharedValue(0);
  const logoScale = useSharedValue(1);
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
  // Which kind of refusal this was — it decides both the recovery and which
  // message the student sees (a dropped request is not an access problem).
  const [failureKind, setFailureKind] = useState<QuizStartFailure['kind'] | null>(null);
  const [apiCompleted, setApiCompleted] = useState(false);
  const [startQuizMutation] = useMutation(StartQuizDocument);

  /**
   * Leave the failed attempt.
   *
   * A locked lesson means the picker we came from is showing locks the server
   * disagrees with (§4b), so the list is refetched *and* the student is sent
   * back to the picker itself — not to the settings screen, whose route params
   * still carry the rejected lesson and would fail again identically.
   */
  const leaveFailedAttempt = useCallback(() => {
    setLocalModalVisible(false);
    if (failureKind === 'lockedLesson') {
      // `include` only touches lists currently mounted, so this is a no-op if
      // the picker was unmounted behind us. On failure the picker keeps the
      // rejected lesson ticked and Start fails the same way again — worth a
      // log line, since nothing else would explain the loop.
      void client
        .refetchQueries({ include: [LessonsForSubjectDocument] })
        .catch((refetchError) => logError('Lesson list refetch failed', refetchError));
      navigation.popTo('QuizFlowLessons');
      return;
    }
    navigation.goBack();
  }, [failureKind, client, navigation]);

  /**
   * Is this refusal about access, or did something just break?
   *
   * A locked lesson always is. Anything else the server refuses is only an
   * access problem if the student's own state says so — `classifyQuizStartError`
   * returns `server` for *any* messaged error, so treating that alone as the
   * daily cap would answer an internal server error with "Subscription
   * Required" for a paid student with unlimited quizzes. The counter is re-read
   * as soon as the attempt settles, so by the time this modal appears the
   * status reflects the attempt that just failed.
   */
  const isAccessFailure =
    failureKind === 'lockedLesson' ||
    (failureKind === 'server' && (!hasQuizAttemptsLeft(trialStatus) || isLockedOut(trialStatus)));

  // Start breathing (pulse) animations
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
  }, []);

  // API Call: mutation StartQuiz
  useEffect(() => {
    // `active` keeps a late response from writing state after the user backed
    // out of the generating screen mid-flight.
    let active = true;
    const startQuizApi = async () => {
      // Guard against arriving here without route params (deep link / fast
      // refresh). Sits outside the try so no attempt — and so no counter
      // re-read — is reported for a request that was never sent.
      if (!subject?.id) {
        if (active) {
          setApiError(t('quiz_screen.error_loading_history'));
          setApiCompleted(true);
        }
        return;
      }
      try {
        const { data } = await startQuizMutation({
          variables: {
            subjectId: subject.id,
            lessonIds: selectedLessonIds,
            quizTypeId: selectedTypeId,
            // Undefined for the default mix — omitting the argument is what
            // asks for "every type", and it keeps the stored selection honest.
            questionTypes,
          },
        });
        if (!active) return;
        if (data?.startQuiz) {
          setQuizId(data.startQuiz.id);
        } else {
          setApiError(t('quiz_screen.error_loading_history'));
        }
      } catch (err) {
        if (!active) return;
        // Branch on the error's *shape*, never its wording: the server tags
        // neither trial failure with a code (§4a, §4b), so matching on text
        // would break the moment the backend rephrases anything.
        const failure = classifyQuizStartError(err);
        setFailureKind(failure.kind);
        // Hold the server's own (already translated) sentence. An access
        // refusal is answered with the app's premium notice instead — see the
        // modal below — but anything else still shows what the server said,
        // which is what this screen has always done.
        if (failure.kind !== 'unknown') logInfo(`startQuiz refused: ${failure.message}`);
        setApiError(
          failure.kind === 'unknown' ? t('quiz_screen.error_loading_history') : failure.message,
        );
      } finally {
        if (active) {
          setApiCompleted(true);
          // An attempt is spent on start, not on submit — and a resume spends
          // nothing. Rather than track that here, re-read the counter the
          // server already keeps (§4, "cheapest correct approach"). Nothing on
          // this screen waits for it.
          void refreshTrialStatus();
        }
      }
    };
    startQuizApi();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.id, selectedLessonIds, selectedTypeId, questionTypes]);

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
      transform: [{ translateY }, { scale: logoScale.value }],
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
                <Text style={[styles.readyBadgeText, fontWeight('800')]}>
                  {t('quiz_flow.quiz_ready')}
                </Text>
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
        title={isAccessFailure ? t('subscription.required_title') : t('common.error')}
        message={
          isAccessFailure ? t('subscription.required_message') : localModalError || undefined
        }
        showCancel={false}
        confirmLabel={t('common.ok', 'OK')}
        onConfirm={leaveFailedAttempt}
        onCancel={leaveFailedAttempt}
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
