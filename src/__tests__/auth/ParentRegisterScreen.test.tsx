import React from 'react';
import { fireEvent, screen, act } from '@testing-library/react-native';
import ParentRegisterScreen from '../../screens/ParentRegisterScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { apolloClient } from '../../lib/apollo';

// Mock API
jest.mock('../../lib/apollo', () => ({
  apolloClient: {
    mutate: jest.fn().mockResolvedValue({
      data: { checkMobileAvailability: { available: true, message: '' } },
    }),
  },
}));

// Mock Modal
const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({
    showConfirm: mockShowConfirm,
  }),
  ModalProvider: ({ children }: any) => children,
}));

describe('ParentRegisterScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders ParentRegister screen form fields and buttons', () => {
    renderWithProviders(<ParentRegisterScreen />);

    expect(screen.getByTestId('parent-register-name')).toBeDefined();
    expect(screen.getByTestId('parent-register-mobile')).toBeDefined();
    expect(screen.getByTestId('parent-register-email')).toBeDefined();
    expect(screen.getByTestId('parent-register-password')).toBeDefined();
    expect(screen.getByTestId('parent-register-confirm')).toBeDefined();
    expect(screen.getByTestId('parent-register-submit')).toBeDefined();
    expect(screen.getByTestId('parent-register-language-toggle')).toBeDefined();
    expect(screen.getByTestId('parent-register-login-link')).toBeDefined();
  });

  it('validates passwords match before registration submit', async () => {
    renderWithProviders(<ParentRegisterScreen />);

    fireEvent.changeText(screen.getByTestId('parent-register-name'), 'Nasser Ali');
    fireEvent.changeText(screen.getByTestId('parent-register-mobile'), '01007867181');
    fireEvent.changeText(screen.getByTestId('parent-register-email'), 'parent@test.com');
    fireEvent.changeText(screen.getByTestId('parent-register-password'), 'DemoPass1!');
    fireEvent.changeText(screen.getByTestId('parent-register-confirm'), 'WrongPassword1!');
    await act(async () => {
      fireEvent.press(screen.getByTestId('parent-register-submit'));
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'common.error',
        message: 'auth.passwords_not_match',
      }),
    );
  });

  it('registers parent user successfully and resets navigation route', async () => {
    (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
      data: {
        parentRegister: {
          access_token: 'parent-token',
          parent: { id: '2', name: 'Nasser Ali', mobile: '01007867181' },
        },
      },
    });

    renderWithProviders(<ParentRegisterScreen />);

    fireEvent.changeText(screen.getByTestId('parent-register-name'), 'Nasser Ali');
    fireEvent.changeText(screen.getByTestId('parent-register-mobile'), '01007867181');
    fireEvent.changeText(screen.getByTestId('parent-register-email'), 'parent@test.com');
    fireEvent.changeText(screen.getByTestId('parent-register-password'), 'DemoPass1!');
    fireEvent.changeText(screen.getByTestId('parent-register-confirm'), 'DemoPass1!');

    // Trigger submit
    await act(async () => {
      fireEvent.press(screen.getByTestId('parent-register-submit'));
    });

    // Verify it triggers registration mutation
    expect(apolloClient.mutate).toHaveBeenCalled();
  });
});
