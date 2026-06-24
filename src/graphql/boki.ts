/**
 * Boki AI Assistant — GraphQL operation strings.
 *
 * Raw strings (not codegen) passed to `tryFetchWithFallback`, matching the
 * dominant API idiom in this codebase (see ContactUsScreen / AvatarPickerModal).
 *
 * NOTE: the backend exposes `conversations` and `conversationMessages` as
 * GraphQL **mutations**, not queries (verified by schema introspection), even
 * though they are reads. The `booki-graphql-api.md` contract doc lists them
 * under `query` — it's inaccurate on that point.
 * Report/feedback operations are added in Phase 3.
 */

export const AI_CHAT_MUTATION = `
  mutation AiChat($input: AiChatInput!) {
    aiChat(input: $input) {
      chatLogId
      answer
      sources {
        lessonId
        title
        similarityScore
      }
      confidenceScore
      conversationId
    }
  }
`;

export const CONVERSATIONS_MUTATION = `
  mutation Conversations($page: Int, $perPage: Int) {
    conversations(page: $page, perPage: $perPage) {
      data {
        id
        title
        messagesCount
        latestMessage {
          id
          message
          response
          createdAt
        }
        createdAt
        updatedAt
      }
      total
      perPage
      currentPage
      lastPage
      hasMore
    }
  }
`;

export const CONVERSATION_MESSAGES_MUTATION = `
  mutation ConversationMessages($conversationId: ID!, $page: Int, $perPage: Int) {
    conversationMessages(conversationId: $conversationId, page: $page, perPage: $perPage) {
      data {
        id
        conversationId
        message
        response
        sources {
          lessonId
          title
          similarityScore
        }
        confidenceScore
        subjectId
        lessonId
        createdAt
        updatedAt
      }
      total
      perPage
      currentPage
      lastPage
      hasMore
    }
  }
`;
