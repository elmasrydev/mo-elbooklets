import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLazyQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useModal } from '../../context/ModalContext';
import { useSubscriptionGate } from '../../hooks/useSubscriptionGate';
import UnifiedHeader from '../../components/UnifiedHeader';
import RetryView from '../../components/RetryView';
import BokiMessageBubble from '../../components/boki/BokiMessageBubble';
import BokiReportSheet from '../../components/boki/BokiReportSheet';
import { useBokiChat } from '../../hooks/useBokiChat';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { analytics } from '../../lib/analytics';
import { spacing, borderRadius } from '../../config/spacing';
import { layout } from '../../config/layout';
import { AiChatSource, BokiTurn } from '../../types/boki';
import { BokiLessonByIdDocument } from '../../generated/graphql';
import { INPUT_TEXT_ALIGN } from '../../lib/rtl';
import { KEYBOARD_AVOIDING_BEHAVIOR } from '../../lib/keyboard';

/**
 * Boki chat thread (BKLT-221, Phases 1–3).
 *
 * The message list is an inverted FlatList — turns are stored newest-first, so
 * index 0 sits at the bottom and the newest message is always in view, while
 * `onEndReached` pages in older history at the top. Opened with a
 * `conversationId` route param, it loads that conversation; otherwise it starts
 * an empty thread (a new conversation is created on the first send).
 */
const BokiChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { typography } = useTypography();
  const common = useCommonStyles();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showConfirm } = useModal();
  const { checkSubscription, showPremiumNotice } = useSubscriptionGate();
  const { isConnected } = useNetworkStatus();
  const [fetchLesson, { loading: lessonLoading }] = useLazyQuery(BokiLessonByIdDocument, {
    fetchPolicy: 'network-only',
  });
  const [resolvingLessonId, setResolvingLessonId] = useState<string | null>(null);

  const conversationIdParam = route.params?.conversationId as string | undefined;
  const {
    turns,
    send,
    retry,
    submitFeedback,
    loadingHistory,
    loadingMore,
    loadOlder,
    historyError,
    reloadHistory,
    loadConversation,
    startNewConversation,
  } = useBokiChat();

  const [input, setInput] = useState('');
  const [reportChatLogId, setReportChatLogId] = useState<string | null>(null);
  const canSend = input.trim().length > 0;

  // Opening a conversation from history navigates back here and updates this
  // param; load it into the existing thread (also covers a param at first mount).
  useEffect(() => {
    if (conversationIdParam) loadConversation(conversationIdParam);
  }, [conversationIdParam, loadConversation]);

  const handleSend = useCallback(() => {
    if (!canSend) return;
    send(input);
    setInput('');
  }, [canSend, input, send]);

  const handleOpenHistory = useCallback(() => {
    navigation.navigate('BokiConversations');
  }, [navigation]);

  const handleNewConversation = useCallback(() => {
    startNewConversation();
    navigation.setParams({ conversationId: undefined });
  }, [startNewConversation, navigation]);

  const handleReport = useCallback((chatLogId: string) => {
    analytics.trackBokiReportButtonClicked();
    setReportChatLogId(chatLogId);
  }, []);

  // Offline gets the same connection message the chat send flow already
  // shows (ERROR_KEY_BY_KIND in BokiMessageBubble) instead of the generic
  // lookup-failed one, so a student isn't told "something's wrong with this
  // lesson" when it's actually their connection.
  const showSourceOpenError = useCallback(() => {
    showConfirm({
      title: t('boki.source_info_title'),
      message: t(isConnected ? 'boki.source_open_error' : 'boki.error_connection'),
      showCancel: false,
      onConfirm: () => {},
    });
  }, [showConfirm, t, isConnected]);

  // Reference-link tap (BKLT-314): resolve the source's lessonId to a full
  // lesson via `lesson(id)` and open StudyLesson — mirrors the gating
  // StudyChaptersScreen applies before opening a lesson from the chapter list.
  const handleSourcePress = useCallback(
    async (source: AiChatSource) => {
      analytics.trackBokiReferenceLinkClicked({ lesson_id: source.lessonId });
      if (!checkSubscription()) return;
      // Guard on Apollo's own in-flight flag rather than a second hand-rolled
      // boolean — resolvingLessonId only needs to track *which* chip to show
      // as loading, not whether a lookup is running.
      if (lessonLoading) return;

      setResolvingLessonId(source.lessonId);
      try {
        const { data } = await fetchLesson({ variables: { id: source.lessonId } });
        const lesson = data?.lesson;
        if (!lesson) {
          showSourceOpenError();
          return;
        }
        if (lesson.isLocked) {
          // Same paywall the lesson lists raise — a source chip pointing at a
          // lesson outside the student's plan is a locked lesson, not a Boki failure.
          showPremiumNotice();
          return;
        }
        navigation.navigate('StudyLesson', {
          lesson,
          subject: lesson.chapter?.subject,
          fromBoki: true,
        });
      } catch {
        showSourceOpenError();
      } finally {
        setResolvingLessonId(null);
      }
    },
    [
      checkSubscription,
      lessonLoading,
      fetchLesson,
      showSourceOpenError,
      showPremiumNotice,
      navigation,
    ],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<BokiTurn>) => (
      <BokiMessageBubble
        turn={item}
        onRetry={retry}
        onSourcePress={handleSourcePress}
        onReport={handleReport}
        onFeedback={submitFeedback}
        resolvingLessonId={resolvingLessonId}
      />
    ),
    [retry, handleSourcePress, handleReport, submitFeedback, resolvingLessonId],
  );

  const keyExtractor = useCallback((item: BokiTurn) => item.id, []);

  const headerActions = (
    <View style={styles.headerActions}>
      <TouchableOpacity
        testID="boki-history-button"
        onPress={handleOpenHistory}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="time-outline" size={spacing.icon.lg} color={theme.colors.headerText} />
      </TouchableOpacity>
      <TouchableOpacity
        testID="boki-new-conversation"
        onPress={handleNewConversation}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.newButton}
      >
        <Ionicons name="create-outline" size={spacing.icon.lg} color={theme.colors.headerText} />
      </TouchableOpacity>
    </View>
  );

  const renderBody = () => {
    if (loadingHistory && turns.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    if (historyError && turns.length === 0) {
      return <RetryView onRetry={reloadHistory} message={t('boki.load_error')} />;
    }
    if (turns.length === 0) {
      return (
        <View style={styles.empty}>
          <Ionicons name="sparkles-outline" size={48} color={theme.colors.primary} />
          <Text style={[typography('h2'), styles.emptyTitle, { color: theme.colors.text }]}>
            {t('boki.empty_title')}
          </Text>
          <Text
            style={[
              typography('bodySmall'),
              styles.emptyText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {t('boki.empty_subtitle')}
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        testID="boki-message-list"
        data={turns}
        inverted
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews={Platform.OS === 'android'}
        onEndReached={loadOlder}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footer} color={theme.colors.primary} />
          ) : null
        }
      />
    );
  };

  return (
    <View style={[common.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader title={t('boki.title')} showBackButton rightContent={headerActions} />
      <KeyboardAvoidingView style={styles.flex} behavior={KEYBOARD_AVOIDING_BEHAVIOR}>
        {renderBody()}

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: keyboardVisible ? spacing.sm : Math.max(insets.bottom, spacing.sm),
            },
          ]}
        >
          <TextInput
            testID="boki-chat-input"
            style={[
              typography('body'),
              styles.input,
              { color: theme.colors.text, backgroundColor: theme.colors.background },
            ]}
            textAlign={INPUT_TEXT_ALIGN}
            value={input}
            onChangeText={setInput}
            placeholder={t('boki.input_placeholder')}
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            testID="boki-send-button"
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
            style={[
              styles.sendButton,
              { backgroundColor: canSend ? theme.colors.primary : theme.colors.buttonDisabled },
            ]}
          >
            <Ionicons name="send" size={spacing.icon.md} color={theme.colors.textOnDark} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <BokiReportSheet
        visible={!!reportChatLogId}
        chatLogId={reportChatLogId}
        onClose={() => setReportChatLogId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newButton: {
    marginStart: spacing.md,
  },
  listContent: {
    padding: layout.screenPadding,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  footer: {
    marginVertical: spacing.md,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: spacing.ssm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: spacing.sm,
  },
});

export default BokiChatScreen;
