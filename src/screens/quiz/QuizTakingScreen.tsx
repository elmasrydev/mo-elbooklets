import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useModal } from '../../context/ModalContext';
import { useQuery, useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { loadFailureMessage } from '../../utils/queryError';
import { QuizDocument, SubmitQuizAnswersDocument } from '../../generated/graphql';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import useAndroidBack from '../../hooks/useAndroidBack';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';
import { useTypography } from '../../hooks/useTypography';
import { layout } from '../../config/layout';
import UnifiedHeader from '../../components/UnifiedHeader';
import RetryView from '../../components/RetryView';
import { QuizScreenSkeleton } from '../../components/SkeletonLoader';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';
import { analytics } from '../../lib/analytics';
import ReportQuestionModal from '../../components/ReportQuestionModal';
import ChoiceOptions from '../../components/quiz/ChoiceOptions';
import QuestionImage from '../../components/quiz/QuestionImage';
import MatchQuestion from '../../components/quiz/MatchQuestion';
import ParagraphQuestion from '../../components/quiz/ParagraphQuestion';
import QuizBottomSheet from '../../components/quiz/QuizBottomSheet';
import {
  buildSubmitPayload,
  isQuestionComplete,
  countIncompleteQuestions,
  type QuizDraft,
} from '../../utils/quizAnswers';
import {
  isDescriptiveType,
  isMatchType,
  isParagraphType,
  isChoiceType,
} from '../../utils/quizQuestionTypes';
import { isArabicText } from '../../config/fonts';
import { QUIZ_COLORS } from '../../config/colors';
import { SUBMIT_QUIZ_TIMEOUT_MS } from '../../config/api';
import { INPUT_TEXT_ALIGN } from '../../lib/rtl';
import { KEYBOARD_AVOIDING_BEHAVIOR } from '../../lib/keyboard';

const QuizTakingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { quizId, isTimed } = route.params || {};

  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [draft, setDraft] = useState<QuizDraft>({});
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [passageSheetOpen, setPassageSheetOpen] = useState(false);

  // Reset scroll to the top on every question change, so a new question never
  // opens mid-scroll from where the previous one was left.
  const scrollRef = React.useRef<ScrollView>(null);
  // Whether the free-text answer has focus. Reset on every question change:
  // the input is remounted per question (see its `key`), and a focused input
  // that unmounts is not guaranteed to report `onBlur` — left stale, the
  // keyboard closing would scroll the new question to its end.
  const descriptiveFocused = React.useRef(false);
  useEffect(() => {
    descriptiveFocused.current = false;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentQuestionIndex]);

  // Bring the free-text answer above the keyboard (BKLT-393). It is the last
  // element of the scroll content, so scrolling to the end is enough.
  //
  // Driven by the ScrollView's own layout, not by a keyboard event. On Android
  // KeyboardAvoidingView pads *asynchronously* in response to the same
  // `keyboardDidShow`, so a listener there scrolls before the ScrollView has
  // shrunk and lands short. A layout change while the answer field is focused
  // is exactly "the visible area just moved for the keyboard" — on both
  // platforms, and whether or not the window itself resizes.
  const handleScrollLayout = useCallback(() => {
    if (descriptiveFocused.current) scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimed && !isTimerPaused) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimed, isTimerPaused]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleBackPress = useCallback(() => {
    showConfirm({
      title: t('quiz_taking.leave_quiz_title'),
      message: t('quiz_taking.leave_quiz_message'),
      confirmLabel: t('common.yes'),
      cancelLabel: t('common.no'),
      confirmVariant: 'danger',
      onConfirm: () => navigation.goBack(),
    });
    // Return true so Android doesn't run its default back action
    return true;
  }, [showConfirm, t, navigation]);

  // Android hardware back → same leave-quiz popup
  useAndroidBack(handleBackPress);

  const {
    data: quizData,
    loading,
    error: quizQueryError,
    refetch: refetchQuiz,
  } = useQuery(QuizDocument, {
    variables: { quizId },
    skip: !quizId,
    // An in-progress attempt must never be served from cache after e.g. a
    // remount — the server owns the attempt state.
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });
  const quiz = quizData?.quiz ?? null;
  const error = !quizId
    ? t('common.error')
    : loadFailureMessage(quizData?.quiz, quizQueryError, t('quiz_taking.error_loading_quiz'));

  const trackedQuizIdRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!quiz || trackedQuizIdRef.current === quiz.id) return;
    trackedQuizIdRef.current = quiz.id;
    analytics.trackQuizStarted({
      quiz_id: quiz.id,
      quiz_title: quiz.name,
      subject_id: quiz.subject?.id,
      lesson_count: quiz.questions.length,
    });
  }, [quiz]);

  const setTextAnswer = (questionId: string, value: string) => {
    setDraft((prev) => ({ ...prev, [questionId]: { kind: 'text', value } }));
  };

  const setMatchPairs = (questionId: string, pairs: Record<string, string>) => {
    setDraft((prev) => ({ ...prev, [questionId]: { kind: 'match', pairs } }));
  };

  const setChildAnswer = (questionId: string, childId: string, value: string) => {
    setDraft((prev) => {
      const entry = prev[questionId];
      const children = entry?.kind === 'paragraph' ? entry.children : {};
      return {
        ...prev,
        [questionId]: { kind: 'paragraph', children: { ...children, [childId]: value } },
      };
    });
  };

  const textValueOf = (questionId: string): string => {
    const entry = draft[questionId];
    return entry?.kind === 'text' ? entry.value : '';
  };

  const matchPairsOf = (questionId: string): Record<string, string> => {
    const entry = draft[questionId];
    return entry?.kind === 'match' ? entry.pairs : {};
  };

  const childAnswersOf = (questionId: string): Record<string, string> => {
    const entry = draft[questionId];
    return entry?.kind === 'paragraph' ? entry.children : {};
  };

  const handleNextQuestion = () => {
    if (!quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];

    if (!isQuestionComplete(currentQuestion, draft)) {
      showConfirm({
        title: t('quiz_taking.answer_required'),
        message: t('quiz_taking.select_answer_first'),
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];

    if (!isQuestionComplete(currentQuestion, draft)) {
      showConfirm({
        title: t('quiz_taking.answer_required'),
        message: t('quiz_taking.select_answer_last'),
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    const incompleteCount = countIncompleteQuestions(quiz.questions, draft);
    if (incompleteCount > 0) {
      showConfirm({
        title: t('quiz_taking.incomplete_quiz'),
        message: t('quiz_taking.unanswered_questions', { count: incompleteCount }),
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    if (isTimed) {
      setIsTimerPaused(true);
    }

    submitAnswers();
  };

  const [submitQuizAnswers] = useMutation(SubmitQuizAnswersDocument);

  // Post-completion navigation: the Quiz tab picks up `completedQuizId` on focus
  // and forwards to QuizResults. Shared by the submit success path, the
  // already-completed guard, and the on-load redirect for a finished attempt.
  const redirectToResults = useCallback(
    (completedQuizId: string, timeTaken?: number) => {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            params: { screen: 'Quiz', params: { completedQuizId, timeTaken } },
          },
        ],
      });
    },
    [navigation],
  );

  const submitAnswers = async () => {
    if (!quiz || submitting) return;

    try {
      setSubmitting(true);

      const answers = buildSubmitPayload(quiz.questions, draft);

      const result = await submitQuizAnswers({
        variables: { quizId: quiz.id, answers },
        // Descriptive questions are AI-graded synchronously inside the mutation,
        // so allow far longer than the default 10s transport cap.
        context: { fetchOptions: { timeoutMs: SUBMIT_QUIZ_TIMEOUT_MS } },
      });

      if (result.data?.submitQuizAnswers) {
        redirectToResults(quiz.id, isTimed ? elapsedSeconds : undefined);
      } else {
        showConfirm({
          title: t('common.error'),
          message: t('common.unexpected_error'),
          showCancel: false,
          onConfirm: () => {},
        });
      }
    } catch (err: any) {
      console.error('Submit quiz error:', err);
      const message: string = err?.message ?? '';
      // A completed attempt can't be resubmitted; send the student to their
      // results instead of surfacing the raw backend error.
      if (message.includes('quiz_already_completed')) {
        redirectToResults(quiz.id);
        return;
      }
      showConfirm({
        title: t('common.error'),
        message: message || t('common.unexpected_error'),
        showCancel: false,
        onConfirm: () => {},
      });
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
        // Only a successful submit navigates away. On failure the student stays
        // on the quiz and may retry minutes later, so the clock has to resume —
        // left paused it freezes the badge and under-reports the time taken.
        if (isTimed) {
          setIsTimerPaused(false);
        }
      }
    }
  };

  // Ref to track mount status for async state updates
  const mountedRef = React.useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // A finished attempt must never render as answerable (e.g. navigating back
  // into a completed quiz, or a stale back-stack entry) — forward to results.
  const redirectedRef = React.useRef(false);
  useEffect(() => {
    if (quiz?.isCompleted && !redirectedRef.current) {
      redirectedRef.current = true;
      redirectToResults(quiz.id);
    }
  }, [quiz?.isCompleted, quiz?.id, redirectToResults]);

  const { contentAlign, contentRowDirection } = useSubjectTextAlign(
    quiz?.subject?.language,
    quiz?.subject?.name,
  );
  // Rebuilt on every render before this — and a timed quiz re-renders once a
  // second, so the entire stylesheet was recreated 60x/minute mid-question.
  const currentStyles = useMemo(
    () => styles(theme, typography, fontWeight, spacing, borderRadius, common, contentAlign),
    [theme, typography, fontWeight, spacing, borderRadius, common, contentAlign],
  );

  // The render path clamps the index, but the handlers, the progress label and
  // the report modal read the raw value — so after a refetch returning fewer
  // questions, Next/Finish could act on a different question than the one on
  // screen. Clamp the state itself so every consumer agrees.
  useEffect(() => {
    if (!quiz?.questions?.length) return;
    const max = quiz.questions.length - 1;
    if (currentQuestionIndex > max) setCurrentQuestionIndex(Math.max(0, max));
  }, [quiz, currentQuestionIndex]);

  if (loading) {
    return (
      <View style={common.container}>
        <UnifiedHeader title={t('quiz_taking.loading_quiz')} />
        <View style={{ paddingTop: 16 }}>
          <QuizScreenSkeleton />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={common.container}>
        <UnifiedHeader showBackButton title={t('quiz_taking.quiz_error')} />
        <RetryView message={error} onRetry={() => refetchQuiz()} />
      </View>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <View style={common.container}>
        <UnifiedHeader showBackButton title={t('quiz_taking.no_questions')} />
        <View style={currentStyles.errorContainer}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={theme.colors.textSecondary}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={currentStyles.errorTitle}>{t('quiz_taking.no_questions_available')}</Text>
          <Text style={currentStyles.errorText}>{t('quiz_taking.no_questions_yet')}</Text>
        </View>
      </View>
    );
  }

  // Clamped: `currentQuestionIndex` is not reset when the quiz re-resolves, so a
  // refetch returning fewer questions would leave it out of range and crash the
  // render on the very next line.
  const safeIndex = Math.min(currentQuestionIndex, quiz.questions.length - 1);
  const currentQuestion = quiz.questions[safeIndex];
  const progress = ((safeIndex + 1) / quiz.questions.length) * 100;
  const isDescriptive = isDescriptiveType(currentQuestion.type);
  const isMatch = isMatchType(currentQuestion.type);
  const isParagraph = isParagraphType(currentQuestion.type);
  const currentComplete = isQuestionComplete(currentQuestion, draft);

  const unsupportedCard = (
    <View style={currentStyles.unsupportedCard} testID="quiz-unsupported-card">
      <Ionicons name="alert-circle-outline" size={22} color={QUIZ_COLORS.muted} />
      <Text style={currentStyles.unsupportedTitle}>
        {t('quiz_taking.unsupported_question', "This question type isn't supported yet")}
      </Text>
      <Text style={currentStyles.unsupportedHint}>
        {t('quiz_taking.unsupported_question_hint', 'Please update the app to answer it.')}
      </Text>
    </View>
  );

  return (
    <View style={[common.container, currentStyles.screenContainer]}>
      {/* Header */}
      <UnifiedHeader
        showBackButton
        onBackPress={handleBackPress}
        title={
          <Text style={common.headerTitle} numberOfLines={1}>
            {t('quiz_taking.quiz')} - {quiz.subject?.name}
          </Text>
        }
      />

      {/* Progress Section */}
      <View style={currentStyles.progressSection}>
        <View style={currentStyles.progressRow}>
          <View>
            <Text style={currentStyles.progressLabel}>
              {t('quiz_taking.progress', 'PROGRESS').toUpperCase()}
            </Text>
            <Text style={currentStyles.progressSteps}>
              <Text style={currentStyles.progressCurrentStep}>
                {t('quiz_taking.question', 'Question')}{' '}
                {(safeIndex + 1).toString().padStart(2, '0')}
              </Text>{' '}
              {t('quiz_taking.of', 'of')} {quiz.questions.length}
            </Text>
          </View>
          {isTimed ? (
            <View
              style={[currentStyles.timerBadge, isTimerPaused && currentStyles.timerBadgePaused]}
            >
              <Ionicons
                name="timer-outline"
                size={16}
                color={isTimerPaused ? '#9CA3AF' : '#284196'}
              />
              <Text
                style={[currentStyles.timerText, isTimerPaused && currentStyles.timerTextPaused]}
              >
                {formatTime(elapsedSeconds)}
              </Text>
            </View>
          ) : (
            <View />
          )}
        </View>
        <View style={currentStyles.progressBarBackground}>
          <View style={[currentStyles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* The answer area and the Prev/Next footer both have to clear the
          keyboard (BKLT-393). iOS never resizes the window, so without this the
          keyboard sat on top of the free-text field and the footer. The header
          and progress bar stay outside — they are above the keyboard anyway,
          and keeping them out means no `keyboardVerticalOffset` is needed (the
          stack renders with `headerShown: false`). Android needs it too: the
          app is edge-to-edge, so the window no longer resizes for the keyboard
          (see KEYBOARD_AVOIDING_BEHAVIOR). */}
      <KeyboardAvoidingView
        style={currentStyles.keyboardFlex}
        behavior={KEYBOARD_AVOIDING_BEHAVIOR}
      >
        <ScrollView
          ref={scrollRef}
          style={currentStyles.content}
          contentContainerStyle={currentStyles.contentContainer}
          showsVerticalScrollIndicator={false}
          onLayout={handleScrollLayout}
          // Let a tap reach Next/Previous while the keyboard is open, instead of
          // spending the first tap on dismissing it.
          keyboardShouldPersistTaps="handled"
        >
          <View style={currentStyles.questionWrapper}>
            {isDescriptive && (
              <View style={currentStyles.descriptiveBadge}>
                <Ionicons name="create-outline" size={14} color={theme.colors.primary} />
                <Text style={currentStyles.descriptiveBadgeText}>
                  {currentQuestion.type === 'what_happens'
                    ? t('quiz_taking.what_happens', 'What Happens?')
                    : t('quiz_taking.give_a_reason', 'Give a Reason')}
                </Text>
              </View>
            )}

            {/* Image attachment — orthogonal to type; may sit on any question. */}
            {currentQuestion.imageUrl && (
              <QuestionImage uri={currentQuestion.imageUrl} testID="question-image" />
            )}

            {/* Paragraph renders its own passage card, so skip the top prompt. */}
            {!isParagraph && (
              <Text
                style={[
                  currentStyles.questionText,
                  typography('h1', 'bold', isArabicText(currentQuestion.question)),
                ]}
              >
                {currentQuestion.question}
              </Text>
            )}

            {/* Report button */}
            <TouchableOpacity
              style={[currentStyles.reportBtn, { borderColor: theme.colors.border }]}
              onPress={() => setShowReportModal(true)}
              activeOpacity={0.75}
              testID="quiz-report-button"
            >
              <Ionicons name="flag" size={15} color={theme.colors.error} />
              <Text style={[currentStyles.reportBtnText, { color: theme.colors.textSecondary }]}>
                {t('report_question.report_btn', 'Report')}
              </Text>
            </TouchableOpacity>

            {isDescriptive ? (
              /* Descriptive answer: multi-line text input */
              <View style={currentStyles.descriptiveContainer}>
                <TextInput
                  // One input per question. Reused across two free-text
                  // questions in a row, it would stay focused with the keyboard
                  // up, and no event would bring the next field into view.
                  // Remounting drops focus, so the next question opens at the
                  // top like every other question does.
                  key={currentQuestion.id}
                  // INPUT_TEXT_ALIGN, not contentAlign: `left`/`right` stay
                  // physical on TextInput, so the subject-derived value would pin
                  // Arabic answers to the wrong edge (BKLT-312).
                  style={[currentStyles.descriptiveInput, { textAlign: INPUT_TEXT_ALIGN }]}
                  value={textValueOf(currentQuestion.id)}
                  onChangeText={(text) => setTextAnswer(currentQuestion.id, text)}
                  placeholder={t('quiz_taking.write_your_answer', 'Write your answer here...')}
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  textAlignVertical="top"
                  maxLength={2000}
                  // Only this field asks to be scrolled into view; the choice,
                  // match and paragraph layouts never open a keyboard. The
                  // scroll itself happens in `handleScrollLayout`, once the
                  // keyboard has actually shrunk the ScrollView.
                  onFocus={() => {
                    descriptiveFocused.current = true;
                  }}
                  onBlur={() => {
                    descriptiveFocused.current = false;
                  }}
                  testID="quiz-descriptive-input"
                />
                <Text style={currentStyles.charCount}>
                  {textValueOf(currentQuestion.id).length} / 2000
                </Text>
              </View>
            ) : isMatch ? (
              currentQuestion.matchPairs ? (
                // Key by question id so the armed-card (`pending`) state can't leak
                // into the next match question — each question remounts fresh.
                <MatchQuestion
                  key={currentQuestion.id}
                  matchPairs={currentQuestion.matchPairs}
                  pairs={matchPairsOf(currentQuestion.id)}
                  onChange={(pairs) => setMatchPairs(currentQuestion.id, pairs)}
                  contentAlign={contentAlign}
                />
              ) : (
                unsupportedCard
              )
            ) : isParagraph ? (
              // Key by question id so the passage-collapse state resets per question.
              <ParagraphQuestion
                key={currentQuestion.id}
                passage={currentQuestion.question}
                childQuestions={currentQuestion.subQuestions ?? []}
                answers={childAnswersOf(currentQuestion.id)}
                onChildChange={(childId, value) =>
                  setChildAnswer(currentQuestion.id, childId, value)
                }
                contentAlign={contentAlign}
                contentRowDirection={contentRowDirection}
              />
            ) : isChoiceType(currentQuestion.type) ? (
              <ChoiceOptions
                questionType={currentQuestion.type}
                options={currentQuestion.answers}
                selectedAnswer={textValueOf(currentQuestion.id)}
                onSelect={(answer) => setTextAnswer(currentQuestion.id, answer)}
                contentAlign={contentAlign}
                contentRowDirection={contentRowDirection}
                testIDPrefix="quiz-answer"
              />
            ) : (
              unsupportedCard
            )}
          </View>
        </ScrollView>

        {/* Paragraph passage stays one tap away via a floating pill + sheet. */}
        {isParagraph && (
          <TouchableOpacity
            style={[currentStyles.passageFab, { bottom: Math.max(insets.bottom, 24) + 78 }]}
            onPress={() => setPassageSheetOpen(true)}
            activeOpacity={0.9}
            testID="paragraph-passage-fab"
          >
            <Ionicons name="book" size={16} color="#FFFFFF" />
            <Text style={currentStyles.passageFabText}>
              {t('quiz_taking.passage_fab', 'Passage')}
            </Text>
          </TouchableOpacity>
        )}

        {isParagraph && (
          <QuizBottomSheet
            visible={passageSheetOpen}
            onClose={() => setPassageSheetOpen(false)}
            chipIcon="book-outline"
            chipLabel={t('quiz_taking.passage', 'Reading passage')}
            testID="paragraph-passage-sheet"
          >
            <Text
              style={[
                currentStyles.passageSheetText,
                typography('bodySmall', '600', isArabicText(currentQuestion.question)),
                { textAlign: contentAlign },
              ]}
            >
              {currentQuestion.question}
            </Text>
          </QuizBottomSheet>
        )}

        {/* Navigation Footer */}
        <View
          style={[
            currentStyles.footerContainer,
            // The home-indicator inset is dead space once the keyboard covers it,
            // so hand that room back to the answer field while typing.
            { paddingBottom: keyboardVisible ? spacing.sm : Math.max(insets.bottom, 24) },
          ]}
        >
          <TouchableOpacity
            style={[
              currentStyles.navButton,
              currentStyles.prevButton,
              currentQuestionIndex === 0 && currentStyles.navButtonDisabled,
            ]}
            onPress={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={20}
              color={currentQuestionIndex === 0 ? '#9CA3AF' : '#374151'}
            />
            <Text
              style={[
                currentStyles.navButtonText,
                currentStyles.prevButtonText,
                currentQuestionIndex === 0 && currentStyles.navButtonTextDisabled,
              ]}
            >
              {t('common.previous', 'Previous')}
            </Text>
          </TouchableOpacity>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <TouchableOpacity
              style={[
                currentStyles.navButton,
                currentStyles.nextButton,
                !currentComplete && currentStyles.navButtonIdle,
                submitting && currentStyles.navButtonDisabled,
              ]}
              onPress={handleSubmitQuiz}
              disabled={submitting}
              testID="quiz-finish-button"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={[currentStyles.navButtonText, currentStyles.nextButtonText]}>
                    {t('quiz_taking.finish_quiz', 'Finish Quiz')}
                  </Text>
                  <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                currentStyles.navButton,
                currentStyles.nextButton,
                !currentComplete && currentStyles.navButtonIdle,
              ]}
              onPress={handleNextQuestion}
              testID="quiz-next-button"
            >
              <Text style={[currentStyles.navButtonText, currentStyles.nextButtonText]}>
                {t('common.next', 'Next')}
              </Text>
              <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Report Question Modal */}
      {quiz && (
        <ReportQuestionModal
          visible={showReportModal}
          questionId={quiz.questions[currentQuestionIndex]?.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </View>
  );
};

const styles = (
  theme: any,
  typography: any,
  fontWeight: any,
  spacing: any,
  borderRadius: any,
  common: any,
  contentAlign: 'left' | 'right',
) =>
  StyleSheet.create({
    screenContainer: {
      backgroundColor: '#FFFFFF',
    },
    // Holds the scrollable question area and the nav footer, so the keyboard
    // lifts both together.
    keyboardFlex: {
      flex: 1,
    },
    // Progress Area
    progressSection: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: 14,
      paddingBottom: 14,
      backgroundColor: '#FFFFFF',
    },
    progressRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    progressLabel: {
      ...typography('caption'),
      color: '#6B7280',
      ...fontWeight('700'),
      marginBottom: 4,
      textAlign: contentAlign,
    },
    progressSteps: {
      ...typography('body'),
      color: '#6B7280',
      textAlign: contentAlign,
    },
    progressCurrentStep: {
      color: '#111827',
      ...fontWeight('bold'),
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 16,
      gap: 6,
    },
    timerBadgePaused: {
      backgroundColor: '#F3F4F6',
    },
    timerText: {
      ...typography('label'),
      ...fontWeight('bold'),
      color: '#284196',
    },
    timerTextPaused: {
      color: '#9CA3AF',
    },
    progressBarBackground: {
      height: 6,
      borderRadius: 3,
      backgroundColor: '#F3F4F6',
      width: '100%',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: '#284196',
    },
    // Content Area
    content: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    contentContainer: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: 40,
    },
    questionWrapper: {
      paddingTop: 12,
    },
    questionText: {
      ...typography('h1'),
      color: '#111827',
      ...fontWeight('bold'),
      marginBottom: 24,
      lineHeight: 34,
      textAlign: contentAlign,
    },
    // Descriptive answers styling
    descriptiveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      alignSelf: 'flex-start',
      marginBottom: 16,
      gap: 6,
    },
    descriptiveBadgeText: {
      ...typography('caption'),
      ...fontWeight('700'),
      color: theme.colors.primary,
    },
    descriptiveContainer: {
      gap: 8,
    },
    descriptiveInput: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1.5,
      borderColor: '#CBD5E1',
      borderRadius: 16,
      padding: 16,
      minHeight: 180,
      ...typography('body'),
      color: '#1E293B',
      lineHeight: 24,
    },
    charCount: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    // Footer Navigation
    footerContainer: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingTop: 12,
      backgroundColor: '#FFFFFF',
      gap: 16,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    navButton: {
      flex: 1,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 24,
      gap: 8,
    },
    prevButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    nextButton: {
      backgroundColor: '#284196',
    },
    navButtonIdle: {
      // Muted look while the current question isn't fully answered yet.
      backgroundColor: '#9AA7C7',
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
    navButtonText: {
      ...typography('button'),
      ...fontWeight('bold'),
    },
    prevButtonText: {
      color: '#374151',
    },
    nextButtonText: {
      color: '#FFFFFF',
    },
    navButtonTextDisabled: {
      color: '#9CA3AF',
    },
    passageFab: {
      position: 'absolute',
      insetInlineEnd: 18,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 6,
      backgroundColor: QUIZ_COLORS.navy,
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 999,
      shadowColor: QUIZ_COLORS.navy,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    passageFabText: {
      ...typography('label', '700'),
      color: '#FFFFFF',
    },
    passageSheetText: {
      color: QUIZ_COLORS.ink,
      lineHeight: 26,
      paddingBottom: 8,
    },
    unsupportedCard: {
      alignItems: 'center',
      gap: 8,
      backgroundColor: QUIZ_COLORS.cardBg,
      borderWidth: 1.5,
      borderColor: QUIZ_COLORS.line,
      borderRadius: 18,
      paddingVertical: 28,
      paddingHorizontal: 20,
    },
    unsupportedTitle: {
      ...typography('body', '700'),
      color: QUIZ_COLORS.ink,
      textAlign: 'center',
    },
    unsupportedHint: {
      ...typography('caption'),
      color: QUIZ_COLORS.secondary,
      textAlign: 'center',
    },

    // Legacy placeholders to ensure no crash if common uses them
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.lg,
      ...typography('body'),
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorTitle: {
      ...typography('h2'),
      ...fontWeight('bold'),
      marginBottom: spacing.sm,
      color: theme.colors.text,
    },
    errorText: {
      ...typography('caption'),
      textAlign: 'center',
      marginBottom: 20,
      color: theme.colors.textSecondary,
    },
    reportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
      gap: 5,
      marginBottom: 20,
    },
    reportBtnText: {
      ...typography('caption'),
      ...fontWeight('600'),
    },
  });

export default QuizTakingScreen;
