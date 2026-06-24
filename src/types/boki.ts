/**
 * Boki AI Assistant — domain types (Phase 1).
 *
 * Mirrors the backend GraphQL contract documented in `booki-graphql-api.md`.
 * Kept hand-written (not codegen) to match the project's raw-string API idiom
 * and to keep the whole Boki data layer swappable from a single place.
 * Conversation/history/feedback types are added with their consumers in later phases.
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
