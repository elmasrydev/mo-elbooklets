import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import BokiChatScreen from '../../screens/boki/BokiChatScreen';
import { sendMessage, BokiApiError } from '../../services/bokiApi';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { analytics } from '../../lib/analytics';

// Keep the real BokiApiError (so `instanceof` works in the hook); mock only the call.
jest.mock('../../services/bokiApi', () => {
  const actual = jest.requireActual('../../services/bokiApi');
  return { __esModule: true, ...actual, sendMessage: jest.fn() };
});

jest.mock('../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({ isConnected: true })),
}));

const mockedSend = sendMessage as jest.Mock;
const mockedNetwork = useNetworkStatus as jest.Mock;

const answer = (text: string, overrides = {}) => ({
  chatLogId: '1',
  answer: text,
  sources: [],
  confidenceScore: 0.9,
  conversationId: '42',
  ...overrides,
});

describe('BokiChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNetwork.mockReturnValue({ isConnected: true });
  });

  it('renders the empty state, input and send button', () => {
    renderWithProviders(<BokiChatScreen />);
    expect(screen.getByTestId('boki-chat-input')).toBeTruthy();
    expect(screen.getByTestId('boki-send-button')).toBeTruthy();
    expect(screen.getByText('boki.empty_title')).toBeTruthy();
  });

  it('sends a message, shows the answer, and tracks send + response', async () => {
    mockedSend.mockResolvedValueOnce(answer('Plants make food from sunlight.'));
    const sentSpy = jest.spyOn(analytics, 'trackBokiMessageSent');
    const responseSpy = jest.spyOn(analytics, 'trackBokiResponseReceived');

    renderWithProviders(<BokiChatScreen />);
    fireEvent.changeText(screen.getByTestId('boki-chat-input'), 'What is photosynthesis?');
    await act(async () => {
      fireEvent.press(screen.getByTestId('boki-send-button'));
    });

    expect(screen.getByText('What is photosynthesis?')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Plants make food from sunlight.')).toBeTruthy());

    expect(mockedSend).toHaveBeenCalledWith({
      message: 'What is photosynthesis?',
      conversationId: null,
    });
    expect(sentSpy).toHaveBeenCalled();
    expect(responseSpy).toHaveBeenCalled();
  });

  it('shows a connection error without calling the backend when offline', async () => {
    mockedNetwork.mockReturnValue({ isConnected: false });
    const connSpy = jest.spyOn(analytics, 'trackBokiConnectionError');

    renderWithProviders(<BokiChatScreen />);
    fireEvent.changeText(screen.getByTestId('boki-chat-input'), 'hello');
    await act(async () => {
      fireEvent.press(screen.getByTestId('boki-send-button'));
    });

    await waitFor(() => expect(screen.getByText('boki.error_connection')).toBeTruthy());
    expect(mockedSend).not.toHaveBeenCalled();
    expect(connSpy).toHaveBeenCalled();
    expect(screen.getByTestId('boki-retry-button')).toBeTruthy();
  });

  it('shows a backend error then recovers on retry', async () => {
    mockedSend.mockRejectedValueOnce(new BokiApiError({ kind: 'backend' }));
    const backendSpy = jest.spyOn(analytics, 'trackBokiBackendError');

    renderWithProviders(<BokiChatScreen />);
    fireEvent.changeText(screen.getByTestId('boki-chat-input'), 'hello');
    await act(async () => {
      fireEvent.press(screen.getByTestId('boki-send-button'));
    });
    await waitFor(() => expect(screen.getByText('boki.error_backend')).toBeTruthy());
    expect(backendSpy).toHaveBeenCalled();

    mockedSend.mockResolvedValueOnce(answer('Here is the recovered answer.'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('boki-retry-button'));
    });

    await waitFor(() => expect(screen.getByText('Here is the recovered answer.')).toBeTruthy());
    expect(mockedSend).toHaveBeenCalledTimes(2);
  });
});
