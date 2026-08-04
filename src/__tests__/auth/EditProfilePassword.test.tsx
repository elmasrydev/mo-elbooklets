import React from 'react';
import { fireEvent, screen, act, waitFor } from '@testing-library/react-native';
import EditProfileScreen from '../../screens/EditProfileScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mockNavigate } from '../__mocks__/navigation';
import { UpdatePasswordDocument } from '../../generated/graphql';

const mockUpdatePassword = jest.fn();
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useLazyQuery: () => [jest.fn().mockResolvedValue({ data: {} })],
  useMutation: (document: unknown) => [
    (variables: unknown) => mockUpdatePassword(document, variables),
  ],
}));

const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({ showConfirm: mockShowConfirm }),
  ModalProvider: ({ children }: any) => children,
}));

const mockRefreshUser = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Ali', mobile: '01039890331', email: 'ali@test.com' },
    refreshUser: mockRefreshUser,
    updateUser: jest.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const navigationMock = jest.requireActual('../__mocks__/navigation');
  return {
    ...actual,
    useNavigation: navigationMock.useNavigation,
    useRoute: () => ({ params: {} }),
  };
});

const openPasswordSection = () => {
  fireEvent.press(screen.getByTestId('profile-change-password-toggle'));
};

const fillPasswords = (current: string, next: string, confirm = next) => {
  fireEvent.changeText(screen.getByTestId('profile-old-password-input'), current);
  fireEvent.changeText(screen.getByTestId('profile-new-password-input'), next);
  fireEvent.changeText(screen.getByTestId('profile-confirm-password-input'), confirm);
};

describe('EditProfileScreen — password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdatePassword.mockResolvedValue({
      data: { updatePassword: { success: true, message: 'done' } },
    });
  });

  it('re-validates the session after a successful password change', async () => {
    renderWithProviders(<EditProfileScreen />);
    openPasswordSection();
    fillPasswords('OldPass1!', 'DemoPass1!');

    await act(async () => {
      fireEvent.press(screen.getByTestId('profile-update-password-button'));
    });

    // updatePassword returns no replacement token, so the only way to learn this
    // device's token survived is to spend one authenticated request on it.
    // The screen holds two mutation handles (updateProfile and updatePassword);
    // assert this went through the password one, or a slip between them would
    // leave the password unchanged with every test still green.
    expect(mockUpdatePassword).toHaveBeenCalledWith(
      UpdatePasswordDocument,
      expect.objectContaining({
        variables: {
          input: {
            current_password: 'OldPass1!',
            password: 'DemoPass1!',
            password_confirmation: 'DemoPass1!',
          },
        },
      }),
    );

    await waitFor(() => expect(mockRefreshUser).toHaveBeenCalled());
    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'common.success' }),
    );
  });

  it('surfaces the server message and does not refresh when the change fails', async () => {
    mockUpdatePassword.mockResolvedValue({
      data: { updatePassword: { success: false, message: 'auth.incorrect_password' } },
    });

    renderWithProviders(<EditProfileScreen />);
    openPasswordSection();
    fillPasswords('WrongPass1!', 'DemoPass1!');

    await act(async () => {
      fireEvent.press(screen.getByTestId('profile-update-password-button'));
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'auth.incorrect_password' }),
    );
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });

  it('sends the forgot-password path to the OTP reset flow, not this form', () => {
    renderWithProviders(<EditProfileScreen />);

    fireEvent.press(screen.getByTestId('profile-reset-password-button'));

    expect(mockNavigate).toHaveBeenCalledWith('ResetPassword');
  });
});
