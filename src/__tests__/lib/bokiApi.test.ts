import {
  AiChatDocument,
  AiChatFeedbackDocument,
  AiChatReportDocument,
  ConversationMessagesDocument,
  ConversationsDocument,
} from '../../generated/graphql';
import { apolloClient } from '../../lib/apollo';
import {
  sendMessage,
  fetchConversations,
  fetchConversationMessages,
  reportAnswer,
  submitFeedback,
  BokiApiError,
} from '../../services/bokiApi';

jest.mock('../../lib/apollo', () => ({
  apolloClient: {
    query: jest.fn(),
    mutate: jest.fn(),
  },
}));

const mockedQuery = apolloClient.query as jest.Mock;
const mockedMutate = apolloClient.mutate as jest.Mock;

const aiChatResponse = {
  chatLogId: '123',
  answer: 'Photosynthesis is how plants make food.',
  sources: [{ lessonId: 'l1', title: 'Plants', similarityScore: 0.9 }],
  confidenceScore: 0.92,
  conversationId: '42',
};

describe('bokiApi.sendMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the message and returns the parsed answer', async () => {
    mockedMutate.mockResolvedValueOnce({ data: { aiChat: aiChatResponse } });

    const result = await sendMessage({ message: 'What is photosynthesis?', conversationId: null });

    expect(result).toEqual(aiChatResponse);
    const { mutation, variables } = mockedMutate.mock.calls[0][0];
    expect(mutation).toBe(AiChatDocument);
    expect(variables).toEqual({
      input: { message: 'What is photosynthesis?', conversationId: null },
    });
  });

  it('starts a new conversation by sending no conversationId, then captures the created id', async () => {
    mockedMutate.mockResolvedValueOnce({ data: { aiChat: aiChatResponse } });

    const result = await sendMessage({ message: 'Hi' });

    const { variables } = mockedMutate.mock.calls[0][0];
    expect(variables.input).toEqual({ message: 'Hi' });
    expect(result.conversationId).toBe('42');
  });

  it('throws a rate-limit BokiApiError on a 429-style response', async () => {
    mockedMutate.mockResolvedValueOnce({
      error: { errors: [{ message: 'Too many requests. Please try again in 30 seconds.' }] },
    });

    await expect(sendMessage({ message: 'Hi' })).rejects.toMatchObject({
      kind: 'rateLimit',
      retryAfterSeconds: 30,
    });
  });

  it('throws a backend BokiApiError on any other GraphQL error', async () => {
    mockedMutate.mockResolvedValueOnce({
      error: { errors: [{ message: 'Validation failed' }] },
    });

    await expect(sendMessage({ message: 'Hi' })).rejects.toMatchObject({ kind: 'backend' });
  });

  it('throws a backend BokiApiError when the transport fails', async () => {
    mockedMutate.mockRejectedValueOnce(new Error('Network request failed'));

    const error = await sendMessage({ message: 'Hi' }).catch((e) => e);
    expect(error).toBeInstanceOf(BokiApiError);
    expect(error.kind).toBe('backend');
  });
});

describe('bokiApi.fetchConversations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requests the given page and returns the pagination envelope', async () => {
    const page = {
      data: [{ id: '1', title: 'Algebra', messagesCount: 3 }],
      total: 1,
      perPage: 15,
      currentPage: 2,
      lastPage: 2,
      hasMore: false,
    };
    mockedQuery.mockResolvedValueOnce({ data: { conversations: page } });

    const result = await fetchConversations(2, 15);

    expect(result).toEqual(page);
    const { query, variables } = mockedQuery.mock.calls[0][0];
    expect(query).toBe(ConversationsDocument);
    expect(variables).toEqual({ page: 2, perPage: 15 });
  });

  it('surfaces a backend error as a BokiApiError', async () => {
    mockedQuery.mockResolvedValueOnce({ error: { errors: [{ message: 'boom' }] } });
    await expect(fetchConversations()).rejects.toBeInstanceOf(BokiApiError);
  });
});

describe('bokiApi.fetchConversationMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requests a conversation page and returns the messages envelope', async () => {
    const page = {
      data: [{ id: 'm1', conversationId: '42', message: 'hi', response: 'hello' }],
      total: 1,
      perPage: 20,
      currentPage: 1,
      lastPage: 1,
      hasMore: false,
    };
    mockedQuery.mockResolvedValueOnce({ data: { conversationMessages: page } });

    const result = await fetchConversationMessages('42', 1, 20);

    expect(result).toEqual(page);
    const { query, variables } = mockedQuery.mock.calls[0][0];
    expect(query).toBe(ConversationMessagesDocument);
    expect(variables).toEqual({ conversationId: '42', page: 1, perPage: 20 });
  });
});

describe('bokiApi.reportAnswer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the reason and trimmed notes', async () => {
    mockedMutate.mockResolvedValueOnce({
      data: { aiChatReport: { success: true, message: 'ok' } },
    });

    const result = await reportAnswer('123', 'incorrect', '  wrong  ');

    expect(result).toEqual({ success: true, message: 'ok' });
    const { mutation, variables } = mockedMutate.mock.calls[0][0];
    expect(mutation).toBe(AiChatReportDocument);
    expect(variables).toEqual({
      chatLogId: '123',
      reason: 'incorrect',
      description: 'wrong',
    });
  });

  it('sends null description when notes are empty', async () => {
    mockedMutate.mockResolvedValueOnce({
      data: { aiChatReport: { success: true, message: 'ok' } },
    });

    await reportAnswer('123', 'other');

    expect(mockedMutate.mock.calls[0][0].variables.description).toBeNull();
  });
});

describe('bokiApi.submitFeedback', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the chatLogId and feedback enum', async () => {
    mockedMutate.mockResolvedValueOnce({
      data: { aiChatFeedback: { success: true, feedback: 'LIKE' } },
    });

    const result = await submitFeedback('123', 'LIKE');

    expect(result).toEqual({ success: true, feedback: 'LIKE' });
    const { mutation, variables } = mockedMutate.mock.calls[0][0];
    expect(mutation).toBe(AiChatFeedbackDocument);
    expect(variables).toEqual({ chatLogId: '123', feedback: 'LIKE' });
  });
});
