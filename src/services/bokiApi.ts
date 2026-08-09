/**
 * Boki AI Assistant — data layer.
 *
 * The single seam between the app and the Boki backend. Every operation goes
 * through the Apollo client (generated typed documents; the client links add
 * the auth header, app language, timeout and retry) and surfaces failures as
 * a typed `BokiApiError`. Connectivity ("offline") is decided by callers via
 * NetInfo; this layer only distinguishes rate-limit vs generic backend
 * failures.
 */

import type { TypedDocumentNode } from '@apollo/client';

import {
  AiChatDocument,
  AiChatFeedbackDocument,
  AiChatReportDocument,
  ConversationMessagesDocument,
  ConversationsDocument,
} from '../generated/graphql';
import { apolloClient } from '../lib/apollo';
import { AI_CHAT_TIMEOUT_MS } from '../config/api';
import {
  AiChatFeedbackResult,
  AiChatFeedbackType,
  AiChatInput,
  AiChatResponse,
  AiChatReportResult,
  BokiReportReason,
  ChatMessage,
  Conversation,
  PaginatedResult,
} from '../types/boki';
import { BokiApiError, classifyBokiError } from '../utils/bokiErrors';
import { logError } from '../utils/logger';

export { BokiApiError } from '../utils/bokiErrors';

/**
 * GraphQL errors arrive as `error.errors` (CombinedGraphQLErrors); transport
 * failures only carry a message. classifyBokiError needs a list either way.
 */
const toErrorList = (error: unknown): { message?: string }[] => {
  const errors = (error as { errors?: { message?: string }[] } | null)?.errors;
  if (errors?.length) return errors;
  return [{ message: (error as Error | null)?.message }];
};

const fail = (error: unknown): never => {
  logError('[bokiApi] request failed', error);
  throw new BokiApiError(classifyBokiError({ errors: toErrorList(error) }));
};

// Chat state lives on the screens and history is paginated newest-first, so a
// cached page would only ever be stale — every call goes straight to the
// network.
const runQuery = async <TData, TVariables extends Record<string, unknown>>(
  query: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
): Promise<TData> => {
  let result;
  try {
    result = await apolloClient.query({ query, variables, fetchPolicy: 'no-cache' });
  } catch (error) {
    return fail(error);
  }
  if (result.error || !result.data) return fail(result.error);
  return result.data;
};

const runMutation = async <TData, TVariables extends Record<string, unknown>>(
  mutation: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  context?: Record<string, unknown>,
): Promise<TData> => {
  let result;
  try {
    result = await apolloClient.mutate({ mutation, variables, fetchPolicy: 'no-cache', context });
  } catch (error) {
    return fail(error);
  }
  if (result.error || !result.data) return fail(result.error);
  return result.data;
};

/**
 * Send a message to Boki and return the answer. Omit `conversationId` to start a
 * new conversation (the backend creates one and returns its id).
 */
export const sendMessage = async (input: AiChatInput): Promise<AiChatResponse> => {
  const data = await runMutation(
    AiChatDocument,
    { input },
    { fetchOptions: { timeoutMs: AI_CHAT_TIMEOUT_MS } },
  );
  return data.aiChat as AiChatResponse;
};

/** Load a page of the user's conversation history (newest first). */
export const fetchConversations = async (
  page = 1,
  perPage = 15,
): Promise<PaginatedResult<Conversation>> => {
  const data = await runQuery(ConversationsDocument, { page, perPage });
  return data.conversations as PaginatedResult<Conversation>;
};

/** Load a page of messages within a conversation (newest first). */
export const fetchConversationMessages = async (
  conversationId: string,
  page = 1,
  perPage = 20,
): Promise<PaginatedResult<ChatMessage>> => {
  const data = await runQuery(ConversationMessagesDocument, { conversationId, page, perPage });
  return data.conversationMessages as PaginatedResult<ChatMessage>;
};

/** Report an answer as incorrect/irrelevant/etc., with optional notes. */
export const reportAnswer = async (
  chatLogId: string,
  reason: BokiReportReason,
  description?: string,
): Promise<AiChatReportResult> => {
  const data = await runMutation(AiChatReportDocument, {
    chatLogId,
    reason,
    description: description?.trim() ? description.trim() : null,
  });
  return data.aiChatReport as AiChatReportResult;
};

/** Rate an answer (LIKE / DISLIKE / NONE). */
export const submitFeedback = async (
  chatLogId: string,
  feedback: AiChatFeedbackType,
): Promise<AiChatFeedbackResult> => {
  const data = await runMutation(AiChatFeedbackDocument, { chatLogId, feedback });
  return data.aiChatFeedback as AiChatFeedbackResult;
};
