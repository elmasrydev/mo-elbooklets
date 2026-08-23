import { authFailureText, classifyAuthFailure } from '../../utils/authErrors';

// Shape Apollo 4 throws for a server-side rejection. The top-level message and
// the field-level one are deliberately different: Lighthouse is free to put a
// generic "Validation failed for the field [login]." on top, and the sentence
// worth showing the student lives under `validation`.
const combinedGraphQLErrors = (message: string) => ({
  name: 'CombinedGraphQLErrors',
  errors: [
    {
      message: 'Validation failed for the field [login].',
      path: ['login'],
      extensions: { validation: { mobile: [message] } },
    },
  ],
});

describe('classifyAuthFailure', () => {
  // The backend localizes by the request's `lang` header, so both answers must
  // reach the user as they were written — never swapped for a bundled string.
  it.each([
    ['English', 'The provided credentials are incorrect.'],
    ['Arabic', 'بيانات الدخول مش صح.'],
  ])('passes the %s server message through untouched', (_language, message) => {
    const failure = classifyAuthFailure(combinedGraphQLErrors(message), 'auth.invalid_credentials');

    expect(failure).toEqual({ errorMessage: message });
  });

  it('reports a transport failure separately from bad credentials', () => {
    expect(
      classifyAuthFailure(new Error('Network request failed'), 'auth.invalid_credentials'),
    ).toEqual({ errorKey: 'common.unexpected_error' });
  });

  // "network" inside a *server* message is still a credentials answer, not a
  // dropped request — the presence of GraphQL errors decides, not the wording.
  it('does not mistake a server message mentioning the network for a transport failure', () => {
    const failure = classifyAuthFailure(
      combinedGraphQLErrors('Your network provider blocked this login.'),
      'auth.invalid_credentials',
    );

    expect(failure).toEqual({ errorMessage: 'Your network provider blocked this login.' });
  });

  // Not every rejection is a validation error; then the top-level message is
  // all there is.
  it('falls back to the top-level message when no field carried one', () => {
    const failure = classifyAuthFailure(
      {
        name: 'CombinedGraphQLErrors',
        errors: [{ message: 'This account has been disabled.', path: ['login'] }],
      },
      'auth.invalid_credentials',
    );

    expect(failure).toEqual({ errorMessage: 'This account has been disabled.' });
  });

  it('falls back to the caller key when the server explained nothing', () => {
    expect(classifyAuthFailure(new Error(''), 'auth.registration_error')).toEqual({
      errorKey: 'auth.registration_error',
    });
  });
});

describe('authFailureText', () => {
  const translate = (key: string) => `translated:${key}`;

  it('prefers the server message over any translation', () => {
    expect(authFailureText({ errorMessage: 'Server says no' }, translate, 'auth.x')).toBe(
      'Server says no',
    );
  });

  it('translates the key when there is no server message', () => {
    expect(authFailureText({ errorKey: 'common.unexpected_error' }, translate, 'auth.x')).toBe(
      'translated:common.unexpected_error',
    );
  });

  it('translates the caller fallback when the failure carries neither', () => {
    expect(authFailureText({}, translate, 'auth.invalid_credentials')).toBe(
      'translated:auth.invalid_credentials',
    );
  });
});
