import {
  applyAnswer,
  makePendingTurn,
  markTurnError,
  markTurnPending,
  messageToTurn,
  messagesToTurns,
} from '../../utils/bokiMessages';
import { AiChatResponse, ChatMessage } from '../../types/boki';

const buildMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm1',
  conversationId: 'c1',
  message: 'What is photosynthesis?',
  response: 'It is how plants make food.',
  sources: [{ lessonId: 'l1', title: 'Plants', similarityScore: 0.9 }],
  confidenceScore: 0.8,
  feedback: null,
  createdAt: '2026-06-24T10:00:00.000Z',
  updatedAt: '2026-06-24T10:00:00.000Z',
  ...overrides,
});

describe('messageToTurn', () => {
  it('maps a persisted chat-log entry into a completed turn (chatLogId = id)', () => {
    const turn = messageToTurn(buildMessage());
    expect(turn).toMatchObject({
      id: 'm1',
      chatLogId: 'm1',
      userText: 'What is photosynthesis?',
      answer: 'It is how plants make food.',
      status: 'complete',
      errorKind: null,
    });
    expect(turn.sources).toHaveLength(1);
  });

  it('defaults missing sources to an empty array', () => {
    const turn = messageToTurn(buildMessage({ sources: undefined as never }));
    expect(turn.sources).toEqual([]);
  });
});

describe('messagesToTurns', () => {
  it('preserves the backend (newest-first) order', () => {
    const turns = messagesToTurns([buildMessage({ id: 'newest' }), buildMessage({ id: 'older' })]);
    expect(turns.map((turn) => turn.id)).toEqual(['newest', 'older']);
  });
});

describe('makePendingTurn', () => {
  it('creates a pending turn with no answer yet', () => {
    const turn = makePendingTurn('local-1', 'hello', '2026-06-24T10:00:00.000Z');
    expect(turn).toEqual({
      id: 'local-1',
      chatLogId: null,
      userText: 'hello',
      answer: null,
      sources: [],
      confidenceScore: null,
      status: 'pending',
      errorKind: null,
      createdAt: '2026-06-24T10:00:00.000Z',
    });
  });
});

describe('applyAnswer', () => {
  it('fills a pending turn with the backend response and completes it', () => {
    const pending = makePendingTurn('local-1', 'hi', '2026-06-24T10:00:00.000Z');
    const response: AiChatResponse = {
      chatLogId: '99',
      answer: 'Here is your answer.',
      sources: [{ lessonId: 'l2', title: 'Algebra', similarityScore: 0.7 }],
      confidenceScore: 0.95,
      conversationId: '42',
    };
    const next = applyAnswer(pending, response);
    expect(next).toMatchObject({
      id: 'local-1',
      chatLogId: '99',
      answer: 'Here is your answer.',
      confidenceScore: 0.95,
      status: 'complete',
      errorKind: null,
    });
    expect(next.sources).toEqual(response.sources);
  });
});

describe('markTurnError / markTurnPending', () => {
  it('marks a pending turn as errored with the given kind and clears the answer', () => {
    const pending = makePendingTurn('local-1', 'hi', '2026-06-24T10:00:00.000Z');
    const errored = markTurnError({ ...pending, answer: 'partial' }, 'rateLimit');
    expect(errored.status).toBe('error');
    expect(errored.errorKind).toBe('rateLimit');
    expect(errored.answer).toBeNull();
  });

  it('resets an errored turn back to pending', () => {
    const errored = markTurnError(
      makePendingTurn('local-1', 'hi', '2026-06-24T10:00:00.000Z'),
      'backend',
    );
    const pendingAgain = markTurnPending(errored);
    expect(pendingAgain.status).toBe('pending');
    expect(pendingAgain.errorKind).toBeNull();
  });
});
