import { loadFailureMessage } from '../../utils/queryError';

// Regression: the study/chapters screen went blank behind a "Connection Error"
// wall because the backend returned partial data plus one field-level error per
// lesson, and every error was being treated as fatal. With errorPolicy 'all',
// a payload that arrived must still render.
describe('loadFailureMessage', () => {
  const MESSAGE = 'screens.error_loading';

  it('stays silent when a payload arrived despite field-level errors', () => {
    const partial = [{ id: '1', name: 'Math' }];
    expect(loadFailureMessage(partial, new Error('Internal server error'), MESSAGE)).toBeNull();
  });

  it('treats an empty list as a real answer, not a failure', () => {
    expect(loadFailureMessage([], new Error('Internal server error'), MESSAGE)).toBeNull();
  });

  it('reports a failure when the response carried no data', () => {
    expect(loadFailureMessage(undefined, new Error('network down'), MESSAGE)).toBe(MESSAGE);
    expect(loadFailureMessage(null, new Error('network down'), MESSAGE)).toBe(MESSAGE);
  });

  it('stays silent when there is no error at all', () => {
    expect(loadFailureMessage(undefined, undefined, MESSAGE)).toBeNull();
    expect(loadFailureMessage(null, null, MESSAGE)).toBeNull();
  });
});
