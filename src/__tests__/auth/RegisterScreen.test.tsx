import React from 'react';
import { fireEvent, screen, act, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../../screens/RegisterScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { GetGradesDocument } from '../../generated/graphql';

// Answer the step-1 availability gate (BKLT-308) with "available" so Next
// isn't blocked.
jest.mock('../../lib/apollo', () => ({
  apolloClient: {
    mutate: jest.fn().mockResolvedValue({
      data: { checkMobileAvailability: { available: true, message: '' } },
    }),
  },
}));

// The screen loads its step-2 reference data through Apollo; step-1 behaviour
// (what these tests cover) does not depend on the result.
const apolloMocks = [
  {
    request: { query: GetGradesDocument },
    result: {
      data: {
        grades: [
          { id: 'grade_1', name: 'Grade 10' },
          { id: 'grade_2', name: 'Grade 11' },
        ],
      },
    },
  },
];

// Mock Modal
const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({
    showConfirm: mockShowConfirm,
  }),
  ModalProvider: ({ children }: any) => children,
}));

describe('RegisterScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = async () => {
    renderWithProviders(<RegisterScreen />, { apolloMocks });
    // Wait on what the user sees rather than on a fetch having happened.
    await waitFor(() => expect(screen.getByTestId('register-name-input')).toBeDefined());
  };

  it('renders Step 1 form fields correctly', async () => {
    await renderScreen();

    expect(screen.getByTestId('register-name-input')).toBeDefined();
    expect(screen.getByTestId('register-mobile-input')).toBeDefined();
    expect(screen.getByTestId('register-password-input')).toBeDefined();
    expect(screen.getByTestId('register-confirm-input')).toBeDefined();
    expect(screen.getByTestId('register-submit-button')).toBeDefined();
  });

  it('rejects empty inputs with confirmation error alert', async () => {
    await renderScreen();

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
    await renderScreen();

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
    await renderScreen();

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
