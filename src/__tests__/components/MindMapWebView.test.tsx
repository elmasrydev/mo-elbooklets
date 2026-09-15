import React from 'react';
import { AppState, Platform } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';

import MindMapWebView from '../../components/study/MindMapWebView';

const mockWebViewMounted = jest.fn();
jest.mock('react-native-webview', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  function MockWebView(props: Record<string, unknown>) {
    React.useEffect(() => mockWebViewMounted(), []);
    return React.createElement(View, props);
  }
  return { WebView: MockWebView };
});

const setAppState = (state: 'active' | 'background' | 'inactive') =>
  act(() => {
    Object.assign(AppState, { currentState: state });
    (
      global as unknown as { simulateAppStateChange: (next: string) => void }
    ).simulateAppStateChange(state);
  });

const killContentProcess = () =>
  act(() => {
    screen.getByTestId('map').props.onContentProcessDidTerminate();
  });

const renderMap = () => {
  const onError = jest.fn();
  render(
    <MindMapWebView
      html="<svg></svg>"
      mode="preview"
      onLoad={jest.fn()}
      onError={onError}
      testID="map"
    />,
  );
  return onError;
};

describe('MindMapWebView', () => {
  beforeEach(() => {
    mockWebViewMounted.mockClear();
  });

  afterEach(() => {
    Object.assign(AppState, { currentState: 'active' });
    jest.restoreAllMocks();
  });

  it('brings the map back twice, then shows the retry card for a map that keeps killing its WebView', () => {
    const onError = renderMap();
    killContentProcess();
    killContentProcess();
    // The first mount and two restarts.
    expect(mockWebViewMounted).toHaveBeenCalledTimes(3);
    expect(onError).not.toHaveBeenCalled();

    killContentProcess();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  // Regression (code review, 2026-09-15): a kill in the background restarted the WebView right
  // there, iOS reclaimed each new process too, and the student came back to the retry card.
  it('brings a WebView killed in the background back when the app returns, without counting it', () => {
    const onError = renderMap();
    setAppState('background');
    killContentProcess();
    killContentProcess();
    killContentProcess();
    expect(mockWebViewMounted).toHaveBeenCalledTimes(1);

    setAppState('active');
    expect(mockWebViewMounted).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });

  // Regression (code review, 2026-09-16): a kill reported during iOS's inactive step on the way
  // back counted as a foreground kill, so a used-up allowance ended on the retry card.
  it('treats a kill reported on the way back from the background as a background kill', () => {
    const onError = renderMap();
    killContentProcess();
    killContentProcess();
    setAppState('background');
    setAppState('inactive');
    killContentProcess();
    setAppState('active');

    expect(onError).not.toHaveBeenCalled();
    // The first mount, two restarts, and the one on return.
    expect(mockWebViewMounted).toHaveBeenCalledTimes(4);
  });

  // Regression (code review, 2026-09-16): the background wait also held back Android, which
  // requires a WebView whose renderer is gone to be replaced straight away.
  it('restarts at once on Android, even in the background', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const onError = renderMap();
    setAppState('background');
    act(() => {
      screen.getByTestId('map').props.onRenderProcessGone();
    });
    expect(mockWebViewMounted).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });

  it('refills the allowance on every return from the background', () => {
    const onError = renderMap();
    killContentProcess();
    killContentProcess();
    setAppState('background');
    setAppState('active');

    killContentProcess();
    expect(onError).not.toHaveBeenCalled();
  });
});
