import React from 'react';
import { fireEvent, screen, act, waitFor } from '@testing-library/react-native';
import OTPVerificationScreen from '../../screens/OTPVerificationScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { apolloClient } from '../../lib/apollo';
import { SendMobileOtpDocument, SendParentMobileOtpDocument } from '../../generated/graphql';

jest.mock('../../lib/apollo', () => ({
  apolloClient: { mutate: jest.fn() },
}));

const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({ showConfirm: mockShowConfirm }),
  ModalProvider: ({ children }: any) => children,
}));

const mockRefreshUser = jest.fn();
const mockClearOtpAutoSent = jest.fn();
const mockAuthState = {
  user: { id: '1', name: 'Ali', mobile: '01039890331', country_code: '+2' },
  parentUser: null as any,
  refreshUser: mockRefreshUser,
  logout: jest.fn(),
  skipVerification: jest.fn(),
  otpWasAutoSent: false,
  clearOtpAutoSent: mockClearOtpAutoSent,
  otpShouldAutoRequest: false,
  clearOtpShouldAutoRequest: jest.fn(),
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: any) => children,
}));

let mockRouteParams: Record<string, unknown> = {};
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const navigationMock = jest.requireActual('../__mocks__/navigation');
  return {
    ...actual,
    useNavigation: navigationMock.useNavigation,
    useRoute: () => ({ params: mockRouteParams }),
  };
});

/** Walks the screen from the send phase to the code-entry phase. */
const sendCode = async () => {
  await act(async () => {
    fireEvent.press(screen.getByTestId('otp-send-button'));
  });
};

describe('OTPVerificationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
    mockAuthState.otpWasAutoSent = false;
    mockAuthState.otpShouldAutoRequest = false;
    mockAuthState.parentUser = null;
  });

  it('keeps an Arabic-Indic code instead of silently deleting it', async () => {
    (apolloClient.mutate as jest.Mock)
      .mockResolvedValueOnce({ data: { sendMobileOtp: { success: true, expires_in: 600 } } })
      .mockResolvedValueOnce({ data: { verifyMobileOtp: { success: true } } });

    renderWithProviders(<OTPVerificationScreen />);
    await sendCode();

    fireEvent.changeText(screen.getByTestId('otp-hidden-input'), '٢٥٨٩٦٣');

    await act(async () => {
      fireEvent.press(screen.getByTestId('otp-verify-button'));
    });

    expect(apolloClient.mutate).toHaveBeenLastCalledWith(
      expect.objectContaining({ variables: { otp: '258963' } }),
    );
    expect(apolloClient.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ mutation: SendMobileOtpDocument }),
    );
  });

  it('shows the server message and stays put when a send is rate limited', async () => {
    (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
      data: {
        sendMobileOtp: { success: false, message: 'auth.otp_hourly_limit_reached' },
      },
    });

    renderWithProviders(<OTPVerificationScreen />);
    await sendCode();

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'auth.otp_hourly_limit_reached' }),
    );
    // Still on the send phase — no code was issued to enter.
    expect(screen.queryByTestId('otp-verify-button')).toBeNull();
  });

  it('surfaces the server message and clears the field on a wrong code', async () => {
    (apolloClient.mutate as jest.Mock)
      .mockResolvedValueOnce({ data: { sendMobileOtp: { success: true, expires_in: 600 } } })
      .mockResolvedValueOnce({
        data: { verifyMobileOtp: { success: false, message: 'otp.invalid_code' } },
      });

    renderWithProviders(<OTPVerificationScreen />);
    await sendCode();

    fireEvent.changeText(screen.getByTestId('otp-hidden-input'), '111111');
    await act(async () => {
      fireEvent.press(screen.getByTestId('otp-verify-button'));
    });

    expect(screen.getByText('otp.invalid_code')).toBeDefined();
    expect(screen.getByTestId('otp-hidden-input').props.value).toBe('');
  });

  it('refreshes the account after a successful verification', async () => {
    (apolloClient.mutate as jest.Mock)
      .mockResolvedValueOnce({ data: { sendMobileOtp: { success: true, expires_in: 600 } } })
      .mockResolvedValueOnce({ data: { verifyMobileOtp: { success: true } } });

    renderWithProviders(<OTPVerificationScreen />);
    await sendCode();

    fireEvent.changeText(screen.getByTestId('otp-hidden-input'), '123456');
    await act(async () => {
      fireEvent.press(screen.getByTestId('otp-verify-button'));
    });

    await waitFor(() => expect(mockRefreshUser).toHaveBeenCalled());
  });

  it('lands straight on the code entry step when the backend already sent one', async () => {
    mockAuthState.otpWasAutoSent = true;

    renderWithProviders(<OTPVerificationScreen />);

    await waitFor(() => expect(screen.getByTestId('otp-verify-button')).toBeDefined());
    expect(mockClearOtpAutoSent).toHaveBeenCalled();
    // No second send — that would burn the user's hourly budget.
    expect(apolloClient.mutate).not.toHaveBeenCalled();
  });

  it('uses the parent operations when the route says the audience is a parent', async () => {
    mockRouteParams = { audience: 'parent' };
    mockAuthState.parentUser = {
      id: '2',
      name: 'Nasser',
      mobile: '01007867181',
      country_code: '+2',
      mobile_verified_at: null,
    };
    (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
      data: { sendParentMobileOtp: { success: true, expires_in: 600 } },
    });

    renderWithProviders(<OTPVerificationScreen />);
    await sendCode();

    // Asserting the document, not just the variables: codes are scoped per
    // audience, so sending the student operation here would issue a code that
    // verifyParentMobileOtp can never consume.
    expect(apolloClient.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        mutation: SendParentMobileOtpDocument,
        variables: { mobile: '01007867181', country_code: '+2' },
      }),
    );
    // The parent send response was read, so the code step is reachable.
    await waitFor(() => expect(screen.getByTestId('otp-verify-button')).toBeDefined());
  });
});
