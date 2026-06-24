import { useCallback, useEffect, useRef, useState } from 'react';
import { analytics } from '../lib/analytics';
import { sendMessage, BokiApiError } from '../services/bokiApi';
import { BokiErrorKind, BokiTurn } from '../types/boki';
import {
  applyAnswer,
  makePendingTurn,
  markTurnError,
  markTurnPending,
} from '../utils/bokiMessages';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Boki chat state machine (BKLT-221, Phase 1).
 *
 * Owns the list of turns (newest-first, rendered by an inverted FlatList) and
 * the active conversation id. Sending is optimistic: a pending turn appears
 * immediately, then resolves to the answer or to an error (offline / backend /
 * rate-limit) that the user can retry. Analytics for the send/receive/error
 * events are fired here so every entry point is covered.
 */
export const useBokiChat = () => {
  const { isConnected } = useNetworkStatus();
  const [turns, setTurns] = useState<BokiTurn[]>([]);

  const conversationIdRef = useRef<string | null>(null);
  const tempIdRef = useRef(0);
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

  return { turns, send, retry, isConnected };
};
