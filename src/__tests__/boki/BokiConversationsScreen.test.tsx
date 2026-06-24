import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mockNavigate } from '../__mocks__/navigation';
import BokiConversationsScreen from '../../screens/boki/BokiConversationsScreen';
import { fetchConversations, BokiApiError } from '../../services/bokiApi';
import { analytics } from '../../lib/analytics';

jest.mock('../../services/bokiApi', () => {
  const actual = jest.requireActual('../../services/bokiApi');
  return { __esModule: true, ...actual, fetchConversations: jest.fn() };
});

const mockedFetch = fetchConversations as jest.Mock;

const page = (data: any[], hasMore = false) => ({
  data,
  total: data.length,
  perPage: 15,
  currentPage: 1,
  lastPage: 1,
  hasMore,
});

describe('BokiConversationsScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists conversations and opens one (push + analytics)', async () => {
    mockedFetch.mockResolvedValueOnce(
      page([
        {
          id: '42',
          title: 'Algebra basics',
          messagesCount: 3,
          latestMessage: {
            id: 'm1',
            message: 'What is algebra?',
            response: 'Math…',
            createdAt: '',
          },
          createdAt: '',
          updatedAt: '',
        },
      ]),
    );
    const openedSpy = jest.spyOn(analytics, 'trackBokiConversationOpened');

    renderWithProviders(<BokiConversationsScreen />);

    await waitFor(() => expect(screen.getByText('Algebra basics')).toBeTruthy());
    fireEvent.press(screen.getByTestId('boki-conversation-42'));

    expect(openedSpy).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('BokiChat', { conversationId: '42' });
  });

  it('shows the empty state when there are no conversations', async () => {
    mockedFetch.mockResolvedValueOnce(page([]));

    renderWithProviders(<BokiConversationsScreen />);

    await waitFor(() => expect(screen.getByText('boki.history_empty_title')).toBeTruthy());
  });

  it('shows a retry view when the initial load fails', async () => {
    mockedFetch.mockRejectedValueOnce(new BokiApiError({ kind: 'backend' }));

    renderWithProviders(<BokiConversationsScreen />);

    await waitFor(() => expect(screen.getByText('boki.history_error')).toBeTruthy());
  });
});
