import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import ParentSettingsScreen from '../../screens/ParentSettingsScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { ParentDeleteAccountDocument } from '../../generated/graphql';

/**
 * BKLT-323: the parent screen called the STUDENT `deleteAccount`, which resolves
 * against the student guard and 500s for a parent token — the confirmation flow
 * completed and the account stayed live, with the failure swallowed into
 * console.error so nobody could tell.
 *
 * These assert the two things that made it invisible: the right mutation is
 * used, and a rejection actually reaches the parent.
 */

const mockDeleteAccount = jest.fn();
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useLazyQuery: () => [jest.fn().mockResolvedValue({ data: {} })],
  useMutation: (document: unknown) => [
    (variables: unknown) => mockDeleteAccount(document, variables),
    { loading: false },
  ],
}));

const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({ showConfirm: mockShowConfirm }),
  ModalProvider: ({ children }: any) => children,
}));

const mockLogout = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    parentUser: { id: '7', name: 'Sara', mobile: '01001234567', mobile_verified_at: null },
    logout: mockLogout,
    requestVerification: jest.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

/** Tap Delete, then run the onConfirm handler the dialog was given. */
const confirmDeletion = async () => {
  fireEvent.press(screen.getByTestId('parent-settings-delete-account'));
  const deleteCall = mockShowConfirm.mock.calls.find(
    ([opts]) => typeof opts?.countdown === 'number',
  );
  expect(deleteCall).toBeDefined();
  await act(async () => {
    await deleteCall![0].onConfirm();
  });
};

describe('ParentSettingsScreen — delete account (BKLT-323)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the parent mutation, not the student one', async () => {
    mockDeleteAccount.mockResolvedValue({
      data: { parentDeleteAccount: { success: true, message: 'ok' } },
    });

    renderWithProviders(<ParentSettingsScreen />);
    await confirmDeletion();

    expect(mockDeleteAccount).toHaveBeenCalledWith(ParentDeleteAccountDocument, undefined);
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
  });

  it('tells the parent when the server refuses, instead of closing silently', async () => {
    mockDeleteAccount.mockResolvedValue({
      data: { parentDeleteAccount: { success: false, message: 'not allowed' } },
    });

    renderWithProviders(<ParentSettingsScreen />);
    await confirmDeletion();

    expect(mockLogout).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        mockShowConfirm.mock.calls.some(
          ([o]) => o?.message === 'profile_screen.delete_account_error',
        ),
      ).toBe(true),
    );
  });

  it('tells the parent when the request throws', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('Internal server error'));

    renderWithProviders(<ParentSettingsScreen />);
    await confirmDeletion();

    expect(mockLogout).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        mockShowConfirm.mock.calls.some(
          ([o]) => o?.message === 'profile_screen.delete_account_error',
        ),
      ).toBe(true),
    );
  });
});
