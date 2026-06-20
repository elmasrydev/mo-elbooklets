import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import OnboardingScreen from '../../screens/OnboardingScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mockNavigate } from '../__mocks__/navigation';
import { isDebugMode } from '../../config/debug';

// Mock config/debug
jest.mock('../../config/debug', () => ({
  isDebugMode: jest.fn(() => true),
}));

describe('OnboardingScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders onboarding correctly with default student role selected', () => {
    renderWithProviders(<OnboardingScreen />);

    expect(screen.getByTestId('onboarding-student-tab')).toBeDefined();
    expect(screen.getByTestId('onboarding-parent-tab')).toBeDefined();
    expect(screen.getByTestId('onboarding-get-started')).toBeDefined();
    expect(screen.getByTestId('onboarding-sign-in')).toBeDefined();
  });

  it('navigates to Register when Get Started is tapped with Student role active', () => {
    renderWithProviders(<OnboardingScreen />);

    const getStartedBtn = screen.getByTestId('onboarding-get-started');
    fireEvent.press(getStartedBtn);

    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('navigates to ParentRegister when Get Started is tapped with Parent role active', () => {
    renderWithProviders(<OnboardingScreen />);

    // Switch role to parent first
    const parentTab = screen.getByTestId('onboarding-parent-tab');
    fireEvent.press(parentTab);

    const getStartedBtn = screen.getByTestId('onboarding-get-started');
    fireEvent.press(getStartedBtn);

    expect(mockNavigate).toHaveBeenCalledWith('ParentRegister');
  });

  it('navigates to Login when Sign In is tapped with Student role active', () => {
    renderWithProviders(<OnboardingScreen />);

    const signInLink = screen.getByTestId('onboarding-sign-in');
    fireEvent.press(signInLink);

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('navigates to ParentLogin when Sign In is tapped with Parent role active', () => {
    renderWithProviders(<OnboardingScreen />);

    // Switch role to parent
    const parentTab = screen.getByTestId('onboarding-parent-tab');
    fireEvent.press(parentTab);

    const signInLink = screen.getByTestId('onboarding-sign-in');
    fireEvent.press(signInLink);

    expect(mockNavigate).toHaveBeenCalledWith('ParentLogin');
  });

  it('shows API Switcher Modal when API chip is tapped (in debug mode)', () => {
    (isDebugMode as jest.Mock).mockReturnValue(true);
    renderWithProviders(<OnboardingScreen />);

    const apiChip = screen.getByTestId('onboarding-api-switcher-chip');
    fireEvent.press(apiChip);

    // API switcher modal title contains translation key or title string
    expect(screen.getByText('common.api_url_switcher_title')).toBeDefined();
  });
});
