import React from 'react';
import { fireEvent, screen, act, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../../screens/RegisterScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { tryFetchWithFallback } from '../../config/api';

// Mock API
jest.mock('../../config/api', () => {
  const actual = jest.requireActual('../../config/api');
  return {
    ...actual,
    tryFetchWithFallback: jest.fn().mockResolvedValue({
      data: {
        grades: [
          { id: 'grade_1', name: 'Grade 10' },
          { id: 'grade_2', name: 'Grade 11' },
        ],
      },
    }),
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

describe('RegisterScreen Integration Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock the initial grades query fetched in useEffect
    (tryFetchWithFallback as jest.Mock).mockResolvedValue({
      data: {
        grades: [
          { id: 'grade_1', name: 'Grade 10' },
          { id: 'grade_2', name: 'Grade 11' },
        ],
      },
    });
  });

  it('renders Step 1 form fields correctly', async () => {
    renderWithProviders(<RegisterScreen />);
    await waitFor(() => {
      expect(tryFetchWithFallback).toHaveBeenCalled();
    });

    expect(screen.getByTestId('register-name-input')).toBeDefined();
    expect(screen.getByTestId('register-mobile-input')).toBeDefined();
    expect(screen.getByTestId('register-password-input')).toBeDefined();
    expect(screen.getByTestId('register-confirm-input')).toBeDefined();
    expect(screen.getByTestId('register-submit-button')).toBeDefined();
  });

  it('rejects empty inputs with confirmation error alert', async () => {
    renderWithProviders(<RegisterScreen />);
    await waitFor(() => {
      expect(tryFetchWithFallback).toHaveBeenCalled();
    });

    const nextBtn = screen.getByTestId('register-submit-button');
    await act(async () => {
      fireEvent.press(nextBtn);
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'common.error',
        message: 'auth.fill_all_fields',
      }),
    );
  });

  it('transitions from Step 1 to Step 2 upon valid credentials', async () => {
    renderWithProviders(<RegisterScreen />);
    await waitFor(() => {
      expect(tryFetchWithFallback).toHaveBeenCalled();
    });

    const nameInput = screen.getByTestId('register-name-input');
    const mobileInput = screen.getByTestId('register-mobile-input');
    const passwordInput = screen.getByTestId('register-password-input');
    const confirmInput = screen.getByTestId('register-confirm-input');
    const nextBtn = screen.getByTestId('register-submit-button');

    fireEvent.changeText(nameInput, 'Ahmed Ali');
    fireEvent.changeText(mobileInput, '01007867184');
    fireEvent.changeText(passwordInput, 'DemoPass1!');
    fireEvent.changeText(confirmInput, 'DemoPass1!');

    await act(async () => {
      fireEvent.press(nextBtn);
    });

    // Verify Step 2 is rendered by asserting select grade title/text
    expect(screen.getByText('auth.select_grade_title')).toBeDefined();
    expect(screen.getByText('auth.select_edu_system')).toBeDefined();
  });

  it('blocks final step registration if grade is not selected', async () => {
    renderWithProviders(<RegisterScreen />);
    await waitFor(() => {
      expect(tryFetchWithFallback).toHaveBeenCalled();
    });

    // Fill Step 1
    fireEvent.changeText(screen.getByTestId('register-name-input'), 'Ahmed Ali');
    fireEvent.changeText(screen.getByTestId('register-mobile-input'), '01007867184');
    fireEvent.changeText(screen.getByTestId('register-password-input'), 'DemoPass1!');
    fireEvent.changeText(screen.getByTestId('register-confirm-input'), 'DemoPass1!');

    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit-button'));
    });

    // Press Sign Up (Step 2 submit) without selecting a grade
    mockShowConfirm.mockClear();
    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit-button'));
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'common.error',
        message: 'auth.fill_all_fields',
      }),
    );
  });
});
