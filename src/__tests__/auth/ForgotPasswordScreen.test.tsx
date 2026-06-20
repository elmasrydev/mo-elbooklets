import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { tryFetchWithFallback } from '../../config/api';

// Mock API
jest.mock('../../config/api', () => {
  const actual = jest.requireActual('../../config/api');
  return {
    ...actual,
    tryFetchWithFallback: jest.fn(),
  };
});

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
    (tryFetchWithFallback as jest.Mock).mockResolvedValueOnce({
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

    expect(tryFetchWithFallback).toHaveBeenCalled();
  });
});
