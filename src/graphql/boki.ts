/**
 * Boki AI Assistant — GraphQL operation strings.
 *
 * Raw strings (not codegen) passed to `tryFetchWithFallback`, matching the
 * dominant API idiom in this codebase (see ContactUsScreen / AvatarPickerModal).
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

export const AI_CHAT_REPORT_MUTATION = `
  mutation AiChatReport($chatLogId: ID!, $reason: String!, $description: String) {
    aiChatReport(chatLogId: $chatLogId, reason: $reason, description: $description) {
      success
      message
    }
  }
`;

export const AI_CHAT_FEEDBACK_MUTATION = `
  mutation AiChatFeedback($chatLogId: ID!, $feedback: AiChatFeedbackType!) {
    aiChatFeedback(chatLogId: $chatLogId, feedback: $feedback) {
      success
      feedback
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
