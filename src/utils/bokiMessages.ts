/**
 * Boki AI Assistant — message/turn transforms (pure, no React/Native deps).
 *
 * Turns are kept newest-first to match the inverted FlatList that renders the
 * chat (index 0 sits at the bottom).
 */

import { AiChatResponse, BokiErrorKind, BokiTurn } from '../types/boki';

/** Build the optimistic turn shown immediately after the user hits send. */
export const makePendingTurn = (id: string, userText: string, createdAt: string): BokiTurn => ({
  id,
  chatLogId: null,
  userText,
  answer: null,
  sources: [],
  confidenceScore: null,
  status: 'pending',
  errorKind: null,
  createdAt,
});

/** Fill a pending turn with the answer once the backend responds. */
export const applyAnswer = (turn: BokiTurn, response: AiChatResponse): BokiTurn => ({
  ...turn,
  chatLogId: response.chatLogId,
  answer: response.answer,
  sources: response.sources ?? [],
  confidenceScore: response.confidenceScore ?? null,
  status: 'complete',
  errorKind: null,
});

/** Mark a turn as failed, recording why so the UI can show the right message. */
export const markTurnError = (turn: BokiTurn, errorKind: BokiErrorKind): BokiTurn => ({
  ...turn,
  answer: null,
  status: 'error',
  errorKind,
});

/** Reset a failed turn back to pending before a retry. */
export const markTurnPending = (turn: BokiTurn): BokiTurn => ({
  ...turn,
  status: 'pending',
  errorKind: null,
});
