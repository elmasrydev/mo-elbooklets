import { act, renderHook } from '@testing-library/react-native';

import { TRANSITION_FALLBACK_MS, useAfterTransition } from '../../hooks/useAfterTransition';
import { mockAddListener } from '../__mocks__/navigation';

const endTransition = (closing: boolean) => {
  const call = mockAddListener.mock.calls.find(([event]) => event === 'transitionEnd');
  act(() => call?.[1]({ data: { closing } }));
};

describe('useAfterTransition', () => {
  beforeEach(() => {
    mockAddListener.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Regression (code review, 2026-09-14): the InteractionManager version flipped on the next
  // tick on React Native 0.81, so the lesson's video, map and key points mounted inside the
  // opening transition after all.
  it('stays false while the opening transition runs, and flips once it ends', () => {
    const { result } = renderHook(() => useAfterTransition());
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(false);

    endTransition(false);
    expect(result.current).toBe(true);
  });

  it('ignores the screen closing', () => {
    const { result } = renderHook(() => useAfterTransition());
    endTransition(true);
    expect(result.current).toBe(false);
  });

  it('stops waiting after the fallback, for a screen shown without an animation', () => {
    const { result } = renderHook(() => useAfterTransition());
    act(() => {
      jest.advanceTimersByTime(TRANSITION_FALLBACK_MS);
    });
    expect(result.current).toBe(true);
  });
});
