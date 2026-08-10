import { useCallback, useRef, useState } from 'react';
import { analytics } from '../lib/analytics';
import {
  sendMessage,
  fetchConversationMessages,
  submitFeedback as submitFeedbackApi,
  BokiApiError,
} from '../services/bokiApi';
import { AiChatFeedbackType, BokiErrorKind, BokiTurn } from '../types/boki';
import {
  applyAnswer,
  makePendingTurn,
  markTurnError,
  markTurnPending,
  messagesToTurns,
  withFeedback,
} from '../utils/bokiMessages';
import { useNetworkStatus } from './useNetworkStatus';

const HISTORY_PER_PAGE = 20;

/**
 * Boki chat state machine (BKLT-221, Phases 1–3).
 *
 * Owns the list of turns (newest-first, rendered by an inverted FlatList) and
 * the active conversation id. Sending is optimistic; `submitFeedback` toggles
 * like/dislike on an answer. `loadConversation` swaps
 * the thread to an existing conversation in place (page 1 = newest, older pages
 * via `loadOlder`); `startNewConversation` resets to an empty thread.
 */
export const useBokiChat = () => {
  const { isConnected } = useNetworkStatus();
  const [turns, setTurns] = useState<BokiTurn[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const conversationIdRef = useRef<string | null>(null);
  const tempIdRef = useRef(0);
  const historyPageRef = useRef(1);
  const isFetchingHistoryRef = useRef(false);
  // Mirrors used inside async callbacks so we always read the latest value.
  // Assigned directly in the render body, not an effect — refs don't trigger
  // renders, so there's no risk of a stray extra render, and it avoids the
  // one-tick lag between a commit and an effect-based mirror update.
  const isConnectedRef = useRef(isConnected);
  isConnectedRef.current = isConnected;
  const turnsRef = useRef<BokiTurn[]>(turns);
  turnsRef.current = turns;
  // Bumped every time the visible thread is replaced (history pick, new
  // conversation, reload). Async work captures the value at kick-off and drops
  // its result if the thread moved on meanwhile — otherwise a slow older-page
  // fetch appends the previous conversation's messages into the new one, and a
  // late `aiChat` response re-points conversationIdRef at a thread the student
  // has already left.
  const threadEpochRef = useRef(0);

  const updateTurn = useCallback((id: string, transform: (turn: BokiTurn) => BokiTurn) => {
    setTurns((prev) => prev.map((turn) => (turn.id === id ? transform(turn) : turn)));
  }, []);

  // --- Sending ---

  const deliver = useCallback(
    async (turnId: string, userText: string) => {
      updateTurn(turnId, markTurnPending);

      if (!isConnectedRef.current) {
        updateTurn(turnId, (turn) => markTurnError(turn, 'offline'));
        analytics.trackBokiConnectionError();
        return;
      }

      const epoch = threadEpochRef.current;

      try {
        const response = await sendMessage({
          message: userText,
          conversationId: conversationIdRef.current,
        });
        // The student switched threads while this was in flight; the turn is no
        // longer on screen and the id belongs to the conversation they left.
        if (threadEpochRef.current !== epoch) return;
        conversationIdRef.current = response.conversationId;
        updateTurn(turnId, (turn) => applyAnswer(turn, response));
        analytics.trackBokiResponseReceived({ source_count: response.sources?.length ?? 0 });
      } catch (error) {
        if (threadEpochRef.current !== epoch) return;
        // Connectivity is checked before sending, but a request can also lose the
        // connection in flight — that is an offline failure, not a backend one,
        // and the two surface different copy and different retry advice.
        const kind: BokiErrorKind = !isConnectedRef.current
          ? 'offline'
          : error instanceof BokiApiError
            ? error.kind
            : 'backend';
        updateTurn(turnId, (turn) => markTurnError(turn, kind));
        if (kind === 'offline') {
          analytics.trackBokiConnectionError();
        } else {
          analytics.trackBokiBackendError({ kind });
        }
      }
    },
    [updateTurn],
  );

  const send = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text) return;

      const id = `local-${(tempIdRef.current += 1)}`;
      const createdAt = new Date().toISOString();
      setTurns((prev) => [makePendingTurn(id, text, createdAt), ...prev]);
      analytics.trackBokiMessageSent({ length: text.length });
      void deliver(id, text);
    },
    [deliver],
  );

  const retry = useCallback(
    (turnId: string) => {
      const turn = turnsRef.current.find((item) => item.id === turnId);
      if (!turn) return;
      analytics.trackBokiMessageSent({ length: turn.userText.length, retry: true });
      void deliver(turnId, turn.userText);
    },
    [deliver],
  );

  // --- Feedback (like / dislike) ---

  const setFeedbackByChatLogId = useCallback(
    (chatLogId: string, feedback: 'like' | 'dislike' | null) => {
      setTurns((prev) =>
        prev.map((turn) => (turn.chatLogId === chatLogId ? withFeedback(turn, feedback) : turn)),
      );
    },
    [],
  );

  const submitFeedback = useCallback(
    (chatLogId: string, next: 'like' | 'dislike') => {
      const current =
        turnsRef.current.find((turn) => turn.chatLogId === chatLogId)?.feedback ?? null;
      // Tapping the active rating clears it (toggle off → NONE).
      const target = current === next ? null : next;
      const enumValue: AiChatFeedbackType =
        target === 'like' ? 'LIKE' : target === 'dislike' ? 'DISLIKE' : 'NONE';

      setFeedbackByChatLogId(chatLogId, target); // optimistic
      submitFeedbackApi(chatLogId, enumValue).catch(() => {
        setFeedbackByChatLogId(chatLogId, current); // revert on failure
      });
    },
    [setFeedbackByChatLogId],
  );

  // --- History ---

  const fetchHistoryPage = useCallback(async (page: number, mode: 'initial' | 'more') => {
    const conversationId = conversationIdRef.current;
    if (!conversationId) return;

    const isInitial = mode === 'initial';
    // Pagination dedupes against itself, but opening a conversation must never
    // be dropped just because an older-page request is still in flight — that
    // left the student looking at the previous thread's messages.
    if (!isInitial && isFetchingHistoryRef.current) return;

    const epoch = threadEpochRef.current;
    isFetchingHistoryRef.current = true;
    if (isInitial) {
      setLoadingHistory(true);
      setHistoryError(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await fetchConversationMessages(conversationId, page, HISTORY_PER_PAGE);
      if (threadEpochRef.current !== epoch) return;
      const olderTurns = messagesToTurns(result.data);
      setTurns((prev) => {
        if (isInitial) return olderTurns;
        // Paging by page NUMBER shifts as soon as a new message is sent, so a
        // later page can repeat turns already on screen — which React renders
        // as duplicate keys. Drop anything we already hold.
        const seen = new Set(prev.map((turn) => turn.id));
        return [...prev, ...olderTurns.filter((turn) => !seen.has(turn.id))];
      });
      setHasMoreHistory(result.hasMore);
      historyPageRef.current = page;
    } catch {
      // bokiApi already logs the underlying error; surface a retryable state.
      if (threadEpochRef.current === epoch && isInitial) setHistoryError(true);
    } finally {
      // A newer thread owns these flags now — it reset them when it took over.
      if (threadEpochRef.current === epoch) {
        setLoadingHistory(false);
        setLoadingMore(false);
        isFetchingHistoryRef.current = false;
      }
    }
  }, []);

  const loadOlder = useCallback(() => {
    if (!hasMoreHistory || loadingMore || loadingHistory) return;
    void fetchHistoryPage(historyPageRef.current + 1, 'more');
  }, [hasMoreHistory, loadingMore, loadingHistory, fetchHistoryPage]);

  /** Take over the thread: invalidate in-flight work and reset its flags. */
  const claimThread = useCallback(() => {
    threadEpochRef.current += 1;
    isFetchingHistoryRef.current = false;
    historyPageRef.current = 1;
    setTurns([]);
    setHasMoreHistory(false);
    setHistoryError(false);
    setLoadingMore(false);
  }, []);

  const reloadHistory = useCallback(() => {
    claimThread();
    void fetchHistoryPage(1, 'initial');
  }, [claimThread, fetchHistoryPage]);

  /** Swap the thread to an existing conversation, replacing the current state. */
  const loadConversation = useCallback(
    (conversationId: string) => {
      claimThread();
      conversationIdRef.current = conversationId;
      void fetchHistoryPage(1, 'initial');
    },
    [claimThread, fetchHistoryPage],
  );

  const startNewConversation = useCallback(() => {
    claimThread();
    conversationIdRef.current = null;
    setLoadingHistory(false);
    analytics.trackBokiNewConversation();
  }, [claimThread]);

  return {
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
  };
};
