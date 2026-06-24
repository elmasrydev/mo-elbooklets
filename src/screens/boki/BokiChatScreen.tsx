import React, { useCallback, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useModal } from '../../context/ModalContext';
import UnifiedHeader from '../../components/UnifiedHeader';
import RetryView from '../../components/RetryView';
import BokiMessageBubble from '../../components/boki/BokiMessageBubble';
import { useBokiChat } from '../../hooks/useBokiChat';
import { analytics } from '../../lib/analytics';
import { spacing, borderRadius } from '../../config/spacing';
import { layout } from '../../config/layout';
import { AiChatSource, BokiTurn } from '../../types/boki';

/**
 * Boki chat thread (BKLT-221, Phases 1–2).
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
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showConfirm } = useModal();

  const conversationId = route.params?.conversationId as string | undefined;
  const {
    turns,
    send,
    retry,
    loadingHistory,
    loadingMore,
    loadOlder,
    historyError,
    reloadHistory,
    startNewConversation,
  } = useBokiChat(conversationId);

  const [input, setInput] = useState('');
  const canSend = input.trim().length > 0;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    send(input);
    setInput('');
  }, [canSend, input, send]);

  const handleOpenHistory = useCallback(() => {
    navigation.navigate('BokiConversations');
  }, [navigation]);

  // Reference-link tap: exact-lesson navigation needs a backend `lesson(id)`
  // query that doesn't exist yet (see BKLT-221 known gaps), so for now we
  // surface the referenced lesson and record the analytics event.
  const handleSourcePress = useCallback(
    (source: AiChatSource) => {
      analytics.trackBokiReferenceLinkClicked({ lesson_id: source.lessonId });
      showConfirm({
        title: t('boki.source_info_title'),
        message: t('boki.source_info_message', { title: source.title }),
        showCancel: false,
        onConfirm: () => {},
      });
    },
    [showConfirm, t],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<BokiTurn>) => (
      <BokiMessageBubble turn={item} onRetry={retry} onSourcePress={handleSourcePress} />
    ),
    [retry, handleSourcePress],
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
        onPress={startNewConversation}
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 54 : 0}
      >
        {renderBody()}

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, spacing.sm),
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
    textAlign: 'left',
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
