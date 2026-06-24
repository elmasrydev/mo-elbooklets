/**
 * Boki AI Assistant — data layer.
 *
 * The single seam between the app and the Boki backend. Every operation goes
 * through `tryFetchWithFallback` (raw GraphQL + URL fallback + auth handling)
 * and surfaces failures as a typed `BokiApiError`. Connectivity ("offline") is
 * decided by callers via NetInfo; this layer only distinguishes rate-limit vs
 * generic backend failures.
 *
 * Phase 1 exposes `sendMessage` only; history/report/feedback are added later.
 */

import { tryFetchWithFallback } from '../config/api';
import {
  AI_CHAT_MUTATION,
  CONVERSATIONS_MUTATION,
  CONVERSATION_MESSAGES_MUTATION,
} from '../graphql/boki';
import {
  AiChatInput,
  AiChatResponse,
  ChatMessage,
  Conversation,
  PaginatedResult,
} from '../types/boki';
import { BokiApiError, classifyBokiError } from '../utils/bokiErrors';
import { logError } from '../utils/logger';

export { BokiApiError } from '../utils/bokiErrors';

/** Run an operation and normalize transport/GraphQL failures into BokiApiError. */
const execute = async (query: string, variables: Record<string, unknown>): Promise<any> => {
  let response: any;
  try {
    response = await tryFetchWithFallback(query, variables);
  } catch (error) {
    // All fallback URLs failed (transport-level). NetInfo already gates true
    // "offline"; reaching here while connected means the server is unreachable.
    logError('[bokiApi] request failed', error);
    throw new BokiApiError({ kind: 'backend' });
  }

  if (response?.errors?.length) {
    logError('[bokiApi] GraphQL error', response.errors);
    throw new BokiApiError(classifyBokiError({ errors: response.errors }));
  }

  return response?.data;
};

/**
 * Send a message to Boki and return the answer. Omit `conversationId` to start a
 * new conversation (the backend creates one and returns its id).
 */
export const sendMessage = async (input: AiChatInput): Promise<AiChatResponse> => {
  const data = await execute(AI_CHAT_MUTATION, { input });
  return data.aiChat as AiChatResponse;
};

/** Load a page of the user's conversation history (newest first). */
export const fetchConversations = async (
  page = 1,
  perPage = 15,
): Promise<PaginatedResult<Conversation>> => {
  const data = await execute(CONVERSATIONS_MUTATION, { page, perPage });
  return data.conversations as PaginatedResult<Conversation>;
};

/** Load a page of messages within a conversation (newest first). */
export const fetchConversationMessages = async (
  conversationId: string,
  page = 1,
  perPage = 20,
): Promise<PaginatedResult<ChatMessage>> => {
  const data = await execute(CONVERSATION_MESSAGES_MUTATION, { conversationId, page, perPage });
  return data.conversationMessages as PaginatedResult<ChatMessage>;
};
