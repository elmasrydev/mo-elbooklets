import { classifyQuizStartError } from '../../utils/quizStartErrors';

const graphqlError = (error: Record<string, unknown>) => ({
  name: 'CombinedGraphQLErrors',
  errors: [error],
});

describe('classifyQuizStartError', () => {
  // §4b — the locked-lesson refusal arrives as a validation error on lessonIds,
  // and is the one failure the client can recover from (refetch the list).
  it('reads a locked lesson out of the lessonIds validation entry', () => {
    const failure = classifyQuizStartError(
      graphqlError({
        message: 'Validation failed for the field [startQuiz].',
        extensions: {
          validation: {
            lessonIds: ["Lesson 'A Day at the Riverbank' is locked. Please upgrade your plan."],
          },
        },
      }),
    );

    expect(failure).toEqual({
      kind: 'lockedLesson',
      message: "Lesson 'A Day at the Riverbank' is locked. Please upgrade your plan.",
    });
  });

  // §4a — the daily cap. No error code exists to match on, so it must land in
  // the generic server bucket and be displayed verbatim.
  it('treats the daily-limit refusal as a server message to show as-is', () => {
    const failure = classifyQuizStartError(
      graphqlError({
        message: "You've reached your daily quiz limit. Upgrade for unlimited practice!",
      }),
    );

    expect(failure).toEqual({
      kind: 'server',
      message: "You've reached your daily quiz limit. Upgrade for unlimited practice!",
    });
  });

  it('keeps a validation error on another field out of the locked-lesson branch', () => {
    const failure = classifyQuizStartError(
      graphqlError({
        message: 'Validation failed for the field [startQuiz].',
        extensions: { validation: { subjectId: ['The subject is invalid.'] } },
      }),
    );

    expect(failure.kind).toBe('server');
  });

  it('reports a transport failure as unknown so the caller uses its own copy', () => {
    expect(classifyQuizStartError(new Error('Network request failed'))).toEqual({
      kind: 'unknown',
    });
  });
});
