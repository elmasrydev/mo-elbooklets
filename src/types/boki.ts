/**
 * Boki AI Assistant — domain types.
 *
 * Mirrors the backend GraphQL contract documented in `booki-graphql-api.md`.
 * Kept hand-written (not codegen) to match the project's raw-string API idiom
 * and to keep the whole Boki data layer swappable from a single place.
 * Feedback (like/dislike) types are added with their consumers in Phase 3.
 */

/** How an answer can fail to send/receive. Drives the error message shown. */
export type BokiErrorKind = 'offline' | 'rateLimit' | 'backend';

/** A RAG knowledge source the answer was drawn from. */
export interface AiChatSource {
  lessonId: string;
  title: string;
  similarityScore: number;
}

/** Result of the `aiChat` mutation (send a message, get an answer). */
export interface AiChatResponse {
  chatLogId: string | null;
  answer: string;
  sources: AiChatSource[];
  confidenceScore: number;
  conversationId: string;
}

/** Input for the `aiChat` mutation. */
export interface AiChatInput {
  message: string;
  subjectId?: string | null;
  lessonId?: string | null;
  conversationId?: string | null;
}

/** A persisted chat-log entry: one user question + Booki's answer. */
export interface ChatMessage {
  id: string;
  conversationId: string;
  message: string;
  response: string;
  sources: AiChatSource[];
  confidenceScore: number;
  subjectId?: string | null;
  lessonId?: string | null;
  feedback?: 'like' | 'dislike' | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSubject {
  id: string;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
}

/** A conversation summary as listed in history. */
export interface Conversation {
  id: string;
  title: string | null;
  subject?: ConversationSubject | null;
  messagesCount: number;
  latestMessage?: Pick<ChatMessage, 'id' | 'message' | 'response' | 'createdAt'> | null;
  createdAt: string;
  updatedAt: string;
}

/** Generic backend pagination envelope (matches the contract's page fields). */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  hasMore: boolean;
}

/** UI lifecycle of a chat turn. */
export type BokiTurnStatus = 'pending' | 'complete' | 'error';

/**
 * View-model for one rendered chat turn (a user bubble + an AI bubble).
 * Stored newest-first so the inverted FlatList renders it at the bottom.
 */
export interface BokiTurn {
  /** Stable local id (temp id while pending, chat-log id once known). */
  id: string;
  /** Backend chat-log id — needed for feedback/report. Null until the answer arrives. */
  chatLogId: string | null;
  userText: string;
  /** Null while awaiting the answer (typing indicator shown). */
  answer: string | null;
  sources: AiChatSource[];
  confidenceScore: number | null;
  status: BokiTurnStatus;
  /** Set when status is 'error' — selects which error message to show. */
  errorKind: BokiErrorKind | null;
  createdAt: string;
}
