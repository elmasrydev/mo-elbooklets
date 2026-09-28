import React from 'react';
import { act, render, screen } from '@testing-library/react-native';

import WebViewWarmup from '../../components/WebViewWarmup';

jest.mock('react-native-webview', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    WebView: (props: Record<string, unknown>) =>
      React.createElement(View, { ...props, testID: 'warmup-webview' }),
  };
});

// The app starts with the stored session still being read.
const READING_SESSION = {
  isAuthenticated: false,
  isLoading: true,
  userRole: null as 'student' | 'parent' | null,
};
const mockAuth = { ...READING_SESSION };
jest.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));

// The warm-up hides itself from accessibility, and the default queries skip hidden elements.
const HIDDEN = { includeHiddenElements: true };
const findWarmup = () => screen.queryByTestId('warmup-webview', HIDDEN);

/** Starts the app, then finishes reading the stored session with `session`. */
const startApp = (session: Partial<typeof mockAuth>) => {
  const view = render(<WebViewWarmup />);
  Object.assign(mockAuth, { isLoading: false }, session);
  view.rerender(<WebViewWarmup />);
  return view;
};

describe('WebViewWarmup', () => {
  beforeEach(() => {
    Object.assign(mockAuth, READING_SESSION);
  });

  it('warms WebKit up for a returning student while the splash screen is still up', () => {
    startApp({ isAuthenticated: true, userRole: 'student' });
    expect(findWarmup()).not.toBeNull();
  });

  it('unmounts once the empty document has loaded', () => {
    startApp({ isAuthenticated: true, userRole: 'student' });
    act(() => {
      screen.getByTestId('warmup-webview', HIDDEN).props.onLoad();
    });
    expect(findWarmup()).toBeNull();
  });

  // Regression (code review, 2026-09-15): warming up at a fresh sign-in put the 0.4 s stall on
  // the move to Home or on typing the code, and a failed sign-in warmed up for a signed-out user.
  it('does not warm up for a student who signs in later in the session', () => {
    const view = startApp({ isAuthenticated: false });
    Object.assign(mockAuth, { isAuthenticated: true, userRole: 'student' });
    view.rerender(<WebViewWarmup />);
    expect(findWarmup()).toBeNull();
  });

  it('never builds a WebView for a returning parent', () => {
    startApp({ isAuthenticated: true, userRole: 'parent' });
    expect(findWarmup()).toBeNull();
  });
});
