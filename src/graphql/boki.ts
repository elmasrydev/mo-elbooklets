/**
 * Boki AI Assistant — GraphQL operation strings.
 *
 * Raw strings (not codegen) passed to `tryFetchWithFallback`, matching the
 * dominant API idiom in this codebase (see ContactUsScreen / AvatarPickerModal).
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

export const CONVERSATIONS_QUERY = `
  query Conversations($page: Int, $perPage: Int) {
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

export const CONVERSATION_MESSAGES_QUERY = `
  query ConversationMessages($conversationId: ID!, $page: Int, $perPage: Int) {
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
