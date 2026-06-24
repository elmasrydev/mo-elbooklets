import { useCallback, useEffect, useRef, useState } from 'react';
import { analytics } from '../lib/analytics';
import { sendMessage, fetchConversationMessages, BokiApiError } from '../services/bokiApi';
import { BokiErrorKind, BokiTurn } from '../types/boki';
import {
  applyAnswer,
  makePendingTurn,
  markTurnError,
  markTurnPending,
  messagesToTurns,
} from '../utils/bokiMessages';
import { useNetworkStatus } from './useNetworkStatus';

const HISTORY_PER_PAGE = 20;

/**
 * Boki chat state machine (BKLT-221, Phases 1–2).
 *
 * Owns the list of turns (newest-first, rendered by an inverted FlatList) and
 * the active conversation id. Sending is optimistic. When opened with an
 * `initialConversationId`, it loads that conversation's history (page 1 =
 * newest) and pages in older messages via `loadOlder`. `startNewConversation`
 * resets to an empty thread.
 */
export const useBokiChat = (initialConversationId?: string | null) => {
  const { isConnected } = useNetworkStatus();
  const [turns, setTurns] = useState<BokiTurn[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const conversationIdRef = useRef<string | null>(initialConversationId ?? null);
  const tempIdRef = useRef(0);
  const historyPageRef = useRef(1);
  const isFetchingHistoryRef = useRef(false);
  // Mirrors used inside async callbacks so we always read the latest value.
  const isConnectedRef = useRef(isConnected);
  const turnsRef = useRef<BokiTurn[]>(turns);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);
  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

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

      try {
        const response = await sendMessage({
          message: userText,
          conversationId: conversationIdRef.current,
        });
        conversationIdRef.current = response.conversationId;
        updateTurn(turnId, (turn) => applyAnswer(turn, response));
        analytics.trackBokiResponseReceived({ source_count: response.sources?.length ?? 0 });
      } catch (error) {
        const kind: BokiErrorKind = error instanceof BokiApiError ? error.kind : 'backend';
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

  // --- History ---

  const fetchHistoryPage = useCallback(async (page: number, mode: 'initial' | 'more') => {
    const conversationId = conversationIdRef.current;
    if (!conversationId || isFetchingHistoryRef.current) return;

    const isInitial = mode === 'initial';
    isFetchingHistoryRef.current = true;
    if (isInitial) {
      setLoadingHistory(true);
      setHistoryError(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await fetchConversationMessages(conversationId, page, HISTORY_PER_PAGE);
      const olderTurns = messagesToTurns(result.data);
      setTurns((prev) => (isInitial ? olderTurns : [...prev, ...olderTurns]));
      setHasMoreHistory(result.hasMore);
      historyPageRef.current = page;
    } catch {
      // bokiApi already logs the underlying error; surface a retryable state.
      if (isInitial) setHistoryError(true);
    } finally {
      setLoadingHistory(false);
      setLoadingMore(false);
      isFetchingHistoryRef.current = false;
    }
  }, []);

  const loadOlder = useCallback(() => {
    if (!hasMoreHistory || loadingMore || loadingHistory) return;
    void fetchHistoryPage(historyPageRef.current + 1, 'more');
  }, [hasMoreHistory, loadingMore, loadingHistory, fetchHistoryPage]);

  const reloadHistory = useCallback(() => {
    historyPageRef.current = 1;
    void fetchHistoryPage(1, 'initial');
  }, [fetchHistoryPage]);

  const startNewConversation = useCallback(() => {
    conversationIdRef.current = null;
    historyPageRef.current = 1;
    setTurns([]);
    setHasMoreHistory(false);
    setHistoryError(false);
    setLoadingHistory(false);
    analytics.trackBokiNewConversation();
  }, []);

  useEffect(() => {
    if (initialConversationId) {
      conversationIdRef.current = initialConversationId;
      void fetchHistoryPage(1, 'initial');
    }
  }, [initialConversationId, fetchHistoryPage]);

  return {
    turns,
    send,
    retry,
    loadingHistory,
    loadingMore,
    loadOlder,
    historyError,
    reloadHistory,
    startNewConversation,
  };
};
