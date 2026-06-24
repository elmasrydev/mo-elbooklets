/**
 * Boki AI Assistant — GraphQL operation strings.
 *
 * Raw strings (not codegen) passed to `tryFetchWithFallback`, matching the
 * dominant API idiom in this codebase (see ContactUsScreen / AvatarPickerModal).
 * Phase 1 only needs `aiChat`; history/report/feedback operations are added in
 * their respective phases.
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
