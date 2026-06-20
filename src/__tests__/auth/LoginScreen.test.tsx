import React from 'react';
import { fireEvent, screen, act } from '@testing-library/react-native';
import LoginScreen from '../../screens/LoginScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { tryFetchWithFallback } from '../../config/api';
import { mockNavigate } from '../__mocks__/navigation';

// Mock API
jest.mock('../../config/api', () => {
  const actual = jest.requireActual('../../config/api');
  return {
    ...actual,
    tryFetchWithFallback: jest.fn(),
  };
});

// Mock Modal Context
const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({
    showConfirm: mockShowConfirm,
  }),
  ModalProvider: ({ children }: any) => children,
}));

describe('LoginScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form inputs and submit buttons', () => {
    renderWithProviders(<LoginScreen />);

    expect(screen.getByTestId('login-mobile-input')).toBeDefined();
    expect(screen.getByTestId('login-password-input')).toBeDefined();
    expect(screen.getByTestId('login-submit-button')).toBeDefined();
    expect(screen.getByTestId('login-forgot-password')).toBeDefined();
    expect(screen.getByTestId('login-register-link')).toBeDefined();
  });

  it('triggers alert modal when attempting to login with empty inputs', async () => {
    renderWithProviders(<LoginScreen />);

    const submitBtn = screen.getByTestId('login-submit-button');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'common.error',
        message: 'auth.fill_all_fields',
      }),
    );
  });

  it('triggers error modal when Egyptian mobile format is incorrect', async () => {
    renderWithProviders(<LoginScreen />);

    const mobileInput = screen.getByTestId('login-mobile-input');
    const passwordInput = screen.getByTestId('login-password-input');
    const submitBtn = screen.getByTestId('login-submit-button');

    fireEvent.changeText(mobileInput, '012345'); // invalid length
    fireEvent.changeText(passwordInput, 'Password123!');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'common.error',
        message: 'auth.invalid_egyptian_mobile',
      }),
    );
  });

  it('calls login mutation on successful validation and submission', async () => {
    (tryFetchWithFallback as jest.Mock).mockResolvedValueOnce({
      data: {
        login: {
          access_token: 'student-token',
          user: { id: '1', name: 'Ali', mobile: '01007867184', mobile_verified_at: '2026-06-10' },
        },
      },
    });

    renderWithProviders(<LoginScreen />);

    const mobileInput = screen.getByTestId('login-mobile-input');
    const passwordInput = screen.getByTestId('login-password-input');
    const submitBtn = screen.getByTestId('login-submit-button');

    fireEvent.changeText(mobileInput, '01007867184');
    fireEvent.changeText(passwordInput, 'Password123!');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    // Should call API to log in
    expect(tryFetchWithFallback).toHaveBeenCalled();
  });

  it('navigates to ForgotPassword when forgot link is tapped', () => {
    renderWithProviders(<LoginScreen />);

    const forgotBtn = screen.getByTestId('login-forgot-password');
    fireEvent.press(forgotBtn);

    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('navigates to Register when register link is tapped', () => {
    renderWithProviders(<LoginScreen />);

    const registerLink = screen.getByTestId('login-register-link');
    fireEvent.press(registerLink);

    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });
});
