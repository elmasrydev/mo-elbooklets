import {
  applyAnswer,
  makePendingTurn,
  markTurnError,
  markTurnPending,
} from '../../utils/bokiMessages';
import { AiChatResponse } from '../../types/boki';

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
