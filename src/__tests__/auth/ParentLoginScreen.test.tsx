import React from 'react';
import { fireEvent, screen, act } from '@testing-library/react-native';
import ParentLoginScreen from '../../screens/ParentLoginScreen';
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

// Mock Modal
const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({
    showConfirm: mockShowConfirm,
  }),
  ModalProvider: ({ children }: any) => children,
}));

describe('ParentLoginScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ParentLogin screen inputs and submit button', () => {
    renderWithProviders(<ParentLoginScreen />);

    expect(screen.getByTestId('parent-login-mobile')).toBeDefined();
    expect(screen.getByTestId('parent-login-password')).toBeDefined();
    expect(screen.getByTestId('parent-login-submit')).toBeDefined();
    expect(screen.getByTestId('parent-login-forgot-password')).toBeDefined();
    expect(screen.getByTestId('parent-login-register-link')).toBeDefined();
  });

  it('validates minimum password length of 6 for parent logins', async () => {
    renderWithProviders(<ParentLoginScreen />);

    const mobileInput = screen.getByTestId('parent-login-mobile');
    const passwordInput = screen.getByTestId('parent-login-password');
    const submitBtn = screen.getByTestId('parent-login-submit');

    fireEvent.changeText(mobileInput, '01007867181');
    fireEvent.changeText(passwordInput, '12345'); // < 6 characters
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'common.error',
        message: 'auth.password_min_6',
      }),
    );
  });

  it('calls parentLogin mutation successfully when correct credentials entered', async () => {
    (tryFetchWithFallback as jest.Mock).mockResolvedValueOnce({
      data: {
        parentLogin: {
          access_token: 'parent-token',
          parent: { id: '2', name: 'Nasser', mobile: '01007867181' },
        },
      },
    });

    renderWithProviders(<ParentLoginScreen />);

    const mobileInput = screen.getByTestId('parent-login-mobile');
    const passwordInput = screen.getByTestId('parent-login-password');
    const submitBtn = screen.getByTestId('parent-login-submit');

    fireEvent.changeText(mobileInput, '01007867181');
    fireEvent.changeText(passwordInput, 'Password123!');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(tryFetchWithFallback).toHaveBeenCalled();
  });

  it('navigates to ParentForgotPassword when forgot link is tapped', () => {
    renderWithProviders(<ParentLoginScreen />);

    const forgotBtn = screen.getByTestId('parent-login-forgot-password');
    fireEvent.press(forgotBtn);

    expect(mockNavigate).toHaveBeenCalledWith('ParentForgotPassword');
  });

  it('navigates to ParentRegister when sign up link is tapped', () => {
    renderWithProviders(<ParentLoginScreen />);

    const signUpBtn = screen.getByTestId('parent-login-register-link');
    fireEvent.press(signUpBtn);

    expect(mockNavigate).toHaveBeenCalledWith('ParentRegister');
  });
});
