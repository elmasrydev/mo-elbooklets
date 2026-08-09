import {
  BokiApiError,
  classifyBokiError,
  isRateLimitError,
  parseRetryAfterSeconds,
} from '../../utils/bokiErrors';

describe('parseRetryAfterSeconds', () => {
  it('extracts the seconds from a rate-limit message', () => {
    expect(parseRetryAfterSeconds('Too many requests. Please try again in 30 seconds.')).toBe(30);
  });

  test.each([['no number here'], [''], [null], [undefined]])(
    'returns undefined for %p',
    (message) => {
      expect(parseRetryAfterSeconds(message as string | null | undefined)).toBeUndefined();
    },
  );
});

describe('isRateLimitError', () => {
  it('detects the "Too many requests" message (case-insensitive)', () => {
    expect(isRateLimitError([{ message: 'TOO MANY REQUESTS, slow down' }])).toBe(true);
  });

  test.each([[[]], [null], [undefined], [[{ message: 'Something else' }]]])(
    'returns false for %p',
    (errors) => {
      expect(isRateLimitError(errors as { message?: string }[] | null)).toBe(false);
    },
  );
});

describe('classifyBokiError', () => {
  it('classifies offline first, regardless of errors', () => {
    expect(
      classifyBokiError({ isConnected: false, errors: [{ message: 'Too many requests' }] }),
    ).toEqual({ kind: 'offline' });
  });

  it('classifies a rate-limit error with its retry-after hint', () => {
    expect(
      classifyBokiError({
        errors: [{ message: 'Too many requests. Please try again in 12 seconds.' }],
      }),
    ).toEqual({ kind: 'rateLimit', retryAfterSeconds: 12 });
  });

  it('classifies any other GraphQL error as backend', () => {
    expect(classifyBokiError({ errors: [{ message: 'Validation failed' }] })).toEqual({
      kind: 'backend',
    });
  });

  it('defaults to backend when there is no error detail', () => {
    expect(classifyBokiError({})).toEqual({ kind: 'backend' });
  });
});

describe('BokiApiError', () => {
  it('carries the kind and retry-after, and is an Error instance', () => {
    const error = new BokiApiError({ kind: 'rateLimit', retryAfterSeconds: 5 });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BokiApiError');
    expect(error.kind).toBe('rateLimit');
    expect(error.retryAfterSeconds).toBe(5);
  });
});
