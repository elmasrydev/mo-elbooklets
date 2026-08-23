import { isDocumentRejection, isTransportError } from '../../utils/graphqlErrors';

const combined = (errors: object[]) => ({ name: 'CombinedGraphQLErrors', errors });

// The trial query is dropped for the session when the backend rejects the
// document, so this test is what stands between "this environment lacks the
// fields" and "one bad response froze the student's plan state until they
// force-quit the app".
describe('isDocumentRejection', () => {
  // Validation-phase errors carry no `path` (verified against PRS + production).
  it('recognises a rejected document by its missing path', () => {
    expect(
      isDocumentRejection(combined([{ message: 'Cannot query field "on_trial" on type "User".' }])),
    ).toBe(true);
  });

  it('does not latch on a failure that happened while running the query', () => {
    expect(
      isDocumentRejection(combined([{ message: 'Internal server error', path: ['me'] }])),
    ).toBe(false);
  });

  it('does not latch when only some errors are validation-shaped', () => {
    expect(
      isDocumentRejection(
        combined([{ message: 'Cannot query field "x".' }, { message: 'boom', path: ['me'] }]),
      ),
    ).toBe(false);
  });

  it('does not latch on a transport failure, which carries no GraphQL errors', () => {
    const dropped = new Error('Network request failed');
    expect(isDocumentRejection(dropped)).toBe(false);
    expect(isTransportError(dropped)).toBe(true);
  });
});
