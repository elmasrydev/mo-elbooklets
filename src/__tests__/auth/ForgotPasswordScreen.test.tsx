import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { apolloClient } from '../../lib/apollo';

// Mock API
// AuthContext talks to the server through Apollo; clearStore runs on logout.
jest.mock('../../lib/apollo', () => ({
  apolloClient: { mutate: jest.fn(), query: jest.fn(), clearStore: jest.fn() },
}));

// Mock Modal
const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({
    showConfirm: mockShowConfirm,
  }),
  ModalProvider: ({ children }: any) => children,
}));

describe('ForgotPasswordScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ForgotPassword screen fields and buttons', () => {
    renderWithProviders(<ForgotPasswordScreen />);

    expect(screen.getByTestId('forgot-email-input')).toBeDefined();
    expect(screen.getByTestId('forgot-submit-button')).toBeDefined();
  });

  it('validates email format before triggering reset', () => {
    renderWithProviders(<ForgotPasswordScreen />);

    const emailInput = screen.getByTestId('forgot-email-input');
    const submitBtn = screen.getByTestId('forgot-submit-button');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(submitBtn);

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'common.error',
        message: 'auth.invalid_email_format',
      }),
    );
  });

  it('submits forgotPassword mutation successfully on valid email', () => {
    (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
      data: {
        forgotPassword: {
          status: 'Email Sent',
        },
      },
    });

    renderWithProviders(<ForgotPasswordScreen />);

    const emailInput = screen.getByTestId('forgot-email-input');
    const submitBtn = screen.getByTestId('forgot-submit-button');

    fireEvent.changeText(emailInput, 'student@test.com');
    fireEvent.press(submitBtn);

    expect(apolloClient.mutate).toHaveBeenCalled();
  });
});
