import { tryFetchWithFallback } from '../../config/api';
import {
  sendMessage,
  fetchConversations,
  fetchConversationMessages,
  BokiApiError,
} from '../../services/bokiApi';

jest.mock('../../config/api', () => ({
  tryFetchWithFallback: jest.fn(),
}));

const mockedFetch = tryFetchWithFallback as jest.Mock;

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
    mockedFetch.mockResolvedValueOnce({ data: { aiChat: aiChatResponse } });

    const result = await sendMessage({ message: 'What is photosynthesis?', conversationId: null });

    expect(result).toEqual(aiChatResponse);
    const [query, variables] = mockedFetch.mock.calls[0];
    expect(query).toContain('aiChat');
    expect(variables).toEqual({
      input: { message: 'What is photosynthesis?', conversationId: null },
    });
  });

  it('starts a new conversation by sending no conversationId, then captures the created id', async () => {
    mockedFetch.mockResolvedValueOnce({ data: { aiChat: aiChatResponse } });

    const result = await sendMessage({ message: 'Hi' });

    const [, variables] = mockedFetch.mock.calls[0];
    expect(variables.input).toEqual({ message: 'Hi' });
    expect(result.conversationId).toBe('42');
  });

  it('throws a rate-limit BokiApiError on a 429-style response', async () => {
    mockedFetch.mockResolvedValueOnce({
      errors: [{ message: 'Too many requests. Please try again in 30 seconds.' }],
    });

    await expect(sendMessage({ message: 'Hi' })).rejects.toMatchObject({
      kind: 'rateLimit',
      retryAfterSeconds: 30,
    });
  });

  it('throws a backend BokiApiError on any other GraphQL error', async () => {
    mockedFetch.mockResolvedValueOnce({ errors: [{ message: 'Validation failed' }] });

    await expect(sendMessage({ message: 'Hi' })).rejects.toMatchObject({ kind: 'backend' });
  });

  it('throws a backend BokiApiError when the transport fails', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network request failed'));

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
    mockedFetch.mockResolvedValueOnce({ data: { conversations: page } });

    const result = await fetchConversations(2, 15);

    expect(result).toEqual(page);
    expect(mockedFetch.mock.calls[0][1]).toEqual({ page: 2, perPage: 15 });
  });

  it('surfaces a backend error as a BokiApiError', async () => {
    mockedFetch.mockResolvedValueOnce({ errors: [{ message: 'boom' }] });
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
    mockedFetch.mockResolvedValueOnce({ data: { conversationMessages: page } });

    const result = await fetchConversationMessages('42', 1, 20);

    expect(result).toEqual(page);
    expect(mockedFetch.mock.calls[0][1]).toEqual({ conversationId: '42', page: 1, perPage: 20 });
  });
});
