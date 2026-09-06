import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import BokiChatScreen from '../../screens/boki/BokiChatScreen';
import { sendMessage, submitFeedback, BokiApiError } from '../../services/bokiApi';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { analytics } from '../../lib/analytics';
import { BokiLessonByIdDocument } from '../../generated/graphql';
import { mockNavigate } from '../__mocks__/navigation';

// Keep the real BokiApiError (so `instanceof` works in the hook); mock only the calls.
jest.mock('../../services/bokiApi', () => {
  const actual = jest.requireActual('../../services/bokiApi');
  return { __esModule: true, ...actual, sendMessage: jest.fn(), submitFeedback: jest.fn() };
});

jest.mock('../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({ isConnected: true })),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const navigationMock = jest.requireActual('../__mocks__/navigation');
  return {
    ...actual,
    useNavigation: navigationMock.useNavigation,
    useRoute: navigationMock.useRoute,
  };
});

const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({ showConfirm: mockShowConfirm }),
  ModalProvider: ({ children }: any) => children,
}));

const mockedSend = sendMessage as jest.Mock;
const mockedFeedback = submitFeedback as jest.Mock;
const mockedNetwork = useNetworkStatus as jest.Mock;

const lessonSource = (lessonId: string, title: string) => ({
  lessonId,
  title,
  similarityScore: 0.8,
});

// Must mirror BokiLessonById's full selection set — a missing field makes Apollo
// drop the whole normalized result and the screen sees nothing, which is exactly
// the failure mode this suite exists to catch.
const lessonPayload = (id: string, overrides = {}) => ({
  id,
  name: `Lesson ${id}`,
  summary: null,
  points: null,
  videoUrl: null,
  mindMapUrl: null,
  mindMapMimeType: null,
  myInteraction: null,
  isLocked: false,
  lessonPoints: [],
  chapter: { id: 'c1', name: 'Chapter 1', subject: { id: 's1', name: 'Science', language: 'en' } },
  ...overrides,
});

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

  it('rates an answer as helpful via the like button', async () => {
    mockedSend.mockResolvedValueOnce(answer('Plants make food.'));
    mockedFeedback.mockResolvedValueOnce({ success: true, feedback: 'LIKE' });

    renderWithProviders(<BokiChatScreen />);
    fireEvent.changeText(screen.getByTestId('boki-chat-input'), 'hi');
    await act(async () => {
      fireEvent.press(screen.getByTestId('boki-send-button'));
    });
    await waitFor(() => expect(screen.getByText('Plants make food.')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('boki-like-button'));
    });

    expect(mockedFeedback).toHaveBeenCalledWith('1', 'LIKE');
  });

  describe('reference-link navigation (BKLT-314)', () => {
    const sendAnswerWithSource = async (lessonId = '162', title = 'Lesson 1') => {
      mockedSend.mockResolvedValueOnce(
        answer('Here is your answer.', { sources: [lessonSource(lessonId, title)] }),
      );
      fireEvent.changeText(screen.getByTestId('boki-chat-input'), 'question');
      await act(async () => {
        fireEvent.press(screen.getByTestId('boki-send-button'));
      });
      await waitFor(() => expect(screen.getByTestId('boki-source-link')).toBeTruthy());
    };

    it('navigates to StudyLesson once the lesson resolves', async () => {
      const lesson = lessonPayload('162');
      const apolloMocks = [
        {
          request: { query: BokiLessonByIdDocument, variables: { id: '162' } },
          result: { data: { lesson } },
        },
      ];
      renderWithProviders(<BokiChatScreen />, { apolloMocks });
      await sendAnswerWithSource();

      await act(async () => {
        fireEvent.press(screen.getByTestId('boki-source-link'));
      });

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('StudyLesson', {
          lesson,
          subject: lesson.chapter.subject,
          fromBoki: true,
        }),
      );
    });

    // Same premium notice the lesson lists raise — a locked source chip is a
    // locked lesson, not a Boki failure.
    it('shows the premium notice and does not navigate when the lesson is locked', async () => {
      const lesson = lessonPayload('162', { isLocked: true });
      const apolloMocks = [
        {
          request: { query: BokiLessonByIdDocument, variables: { id: '162' } },
          result: { data: { lesson } },
        },
      ];
      renderWithProviders(<BokiChatScreen />, { apolloMocks });
      await sendAnswerWithSource();

      await act(async () => {
        fireEvent.press(screen.getByTestId('boki-source-link'));
      });

      await waitFor(() =>
        expect(mockShowConfirm).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'subscription.required_title',
            message: 'subscription.required_message',
          }),
        ),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it.each([
      ['the lesson is not found', { result: { data: { lesson: null } } }],
      ['the lookup fails', { error: new Error('network error') }],
    ])('shows an error message and does not navigate when %s', async (_scenario, response) => {
      const apolloMocks = [
        { request: { query: BokiLessonByIdDocument, variables: { id: '162' } }, ...response },
      ];
      renderWithProviders(<BokiChatScreen />, { apolloMocks });
      await sendAnswerWithSource();

      await act(async () => {
        fireEvent.press(screen.getByTestId('boki-source-link'));
      });

      await waitFor(() =>
        expect(mockShowConfirm).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'boki.source_open_error' }),
        ),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('ignores a second source tap while the first is still resolving', async () => {
      const lessonA = lessonPayload('162');
      const apolloMocks = [
        {
          request: { query: BokiLessonByIdDocument, variables: { id: '162' } },
          result: { data: { lesson: lessonA } },
          delay: 20,
        },
      ];
      mockedSend.mockResolvedValueOnce(
        answer('Here is your answer.', {
          sources: [lessonSource('162', 'Lesson A'), lessonSource('163', 'Lesson B')],
        }),
      );
      const clickSpy = jest.spyOn(analytics, 'trackBokiReferenceLinkClicked');
      renderWithProviders(<BokiChatScreen />, { apolloMocks });
      fireEvent.changeText(screen.getByTestId('boki-chat-input'), 'question');
      await act(async () => {
        fireEvent.press(screen.getByTestId('boki-send-button'));
      });
      const chips = await waitFor(() => screen.getAllByTestId('boki-source-link'));
      expect(chips).toHaveLength(2);

      await act(async () => {
        fireEvent.press(chips[0]);
      });
      // The second chip is disabled (not just internally no-op'd) — it must
      // never even fire onPress, or the click would still be tracked despite
      // producing no visible action.
      fireEvent.press(chips[1]);
      expect(clickSpy).toHaveBeenCalledTimes(1);

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
      expect(mockNavigate).toHaveBeenCalledWith('StudyLesson', {
        lesson: lessonA,
        subject: lessonA.chapter.subject,
        fromBoki: true,
      });
    });
  });
});
