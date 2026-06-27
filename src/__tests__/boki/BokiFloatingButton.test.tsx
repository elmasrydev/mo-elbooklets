import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import BokiFloatingButton from '../../components/boki/BokiFloatingButton';
import { useAuth } from '../../context/AuthContext';
import { analytics } from '../../lib/analytics';

// Keep the real AuthProvider (used by renderWithProviders) but control useAuth.
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;

const makeNavRef = (routeName: string) => {
  const navigate = jest.fn();
  return {
    ref: {
      current: {
        getCurrentRoute: () => ({ name: routeName }),
        addListener: jest.fn(() => jest.fn()),
        navigate,
      },
    } as any,
    navigate,
  };
};

describe('BokiFloatingButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ isAuthenticated: true, userRole: 'student' });
  });

  it('renders for an authenticated student on a supported screen and opens the chat', () => {
    const { ref, navigate } = makeNavRef('Home');
    const openedSpy = jest.spyOn(analytics, 'trackBokiOpened');

    renderWithProviders(<BokiFloatingButton navigationRef={ref} />);

    const fab = screen.getByTestId('boki-fab');
    fireEvent.press(fab);

    expect(openedSpy).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('BokiChat');
  });

  it('hides for a parent', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true, userRole: 'parent' });
    const { ref } = makeNavRef('ParentDashboard');
    renderWithProviders(<BokiFloatingButton navigationRef={ref} />);
    expect(screen.queryByTestId('boki-fab')).toBeNull();
  });

  it('hides when unauthenticated', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, userRole: null });
    const { ref } = makeNavRef('Onboarding');
    renderWithProviders(<BokiFloatingButton navigationRef={ref} />);
    expect(screen.queryByTestId('boki-fab')).toBeNull();
  });

  it('hides on an immersive denylisted route (StudyLesson)', async () => {
    const { ref } = makeNavRef('StudyLesson');
    renderWithProviders(<BokiFloatingButton navigationRef={ref} />);
    await waitFor(() => expect(screen.queryByTestId('boki-fab')).toBeNull());
  });
});
