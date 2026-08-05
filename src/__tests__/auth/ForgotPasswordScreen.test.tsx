import React from 'react';
import { fireEvent, screen, act, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apolloClient } from '../../lib/apollo';
import { mockNavigate } from '../__mocks__/navigation';
import {
  SendPasswordResetOtpDocument,
  SendParentPasswordResetOtpDocument,
  ResetPasswordWithOtpDocument,
  ResetParentPasswordWithOtpDocument,
} from '../../generated/graphql';

// AuthContext talks to the server through Apollo; clearStore runs on logout.
jest.mock('../../lib/apollo', () => ({
  apolloClient: { mutate: jest.fn(), query: jest.fn(), clearStore: jest.fn() },
}));

const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({ showConfirm: mockShowConfirm }),
  ModalProvider: ({ children }: any) => children,
}));

const mockLogout = jest.fn();
const mockForgotPassword = jest.fn();
const mockParentForgotPassword = jest.fn();
const mockAuthState: any = {
  user: null,
  parentUser: null,
  logout: mockLogout,
  forgotPassword: mockForgotPassword,
  parentForgotPassword: mockParentForgotPassword,
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

const VALID_MOBILE = '01039890331';

/**
 * Fills the mobile step and sends, leaving the screen on the code step.
 *
 * The response carries only the field the chosen audience's operation returns —
 * a mock answering both would let the screen advance even if it read the wrong
 * one, which is precisely the bug these tests exist to catch.
 */
const reachCodeStep = async (audience: 'student' | 'parent' = 'student', expiresIn = 600) => {
  const field = audience === 'parent' ? 'sendParentPasswordResetOtp' : 'sendPasswordResetOtp';
  (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
    data: { [field]: { success: true, expires_in: expiresIn } },
  });

  fireEvent.changeText(screen.getByTestId('forgot-mobile-input'), VALID_MOBILE);
  await act(async () => {
    fireEvent.press(screen.getByTestId('forgot-send-button'));
  });
};

describe('ForgotPasswordScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // useOtpTimer persists the send stamp, so without this a code sent by one
    // test is still "live" in the next and the screen reuses it instead of
    // sending — which silently swallows that test's mutation.
    await AsyncStorage.clear();
    mockRouteParams = {};
    mockAuthState.user = null;
    mockAuthState.parentUser = null;
  });

  describe('mobile step', () => {
    it('leads with the WhatsApp code and offers email as the secondary option', () => {
      renderWithProviders(<ForgotPasswordScreen />);

      expect(screen.getByTestId('forgot-mobile-input')).toBeDefined();
      expect(screen.getByTestId('forgot-send-button')).toBeDefined();
      expect(screen.getByTestId('forgot-email-link')).toBeDefined();
    });

    it('blocks an invalid Egyptian mobile before spending a message', async () => {
      renderWithProviders(<ForgotPasswordScreen />);

      fireEvent.changeText(screen.getByTestId('forgot-mobile-input'), '12345');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-send-button'));
      });

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'auth.invalid_egyptian_mobile' }),
      );
      expect(apolloClient.mutate).not.toHaveBeenCalled();
    });

    it('normalizes an Arabic-Indic mobile number so it validates', async () => {
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: { sendPasswordResetOtp: { success: true, expires_in: 600 } },
      });

      renderWithProviders(<ForgotPasswordScreen />);

      fireEvent.changeText(screen.getByTestId('forgot-mobile-input'), '٠١٠٣٩٨٩٠٣٣١');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-send-button'));
      });

      expect(mockShowConfirm).not.toHaveBeenCalled();
      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          mutation: SendPasswordResetOtpDocument,
          variables: { mobile: VALID_MOBILE, country_code: '+2' },
        }),
      );
    });

    it('advances to the code step for an unknown number, revealing nothing', async () => {
      renderWithProviders(<ForgotPasswordScreen />);
      await reachCodeStep();

      // The API returns the same payload whether or not the account exists, so
      // the UI must not branch on it.
      expect(screen.getByTestId('forgot-reset-button')).toBeDefined();
      expect(mockShowConfirm).not.toHaveBeenCalled();
    });

    it('shows the server message and stays put when rate limited', async () => {
      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: { sendPasswordResetOtp: { success: false, message: 'auth.otp_daily_limit_reached' } },
      });

      renderWithProviders(<ForgotPasswordScreen />);
      fireEvent.changeText(screen.getByTestId('forgot-mobile-input'), VALID_MOBILE);
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-send-button'));
      });

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'auth.otp_daily_limit_reached' }),
      );
      expect(screen.queryByTestId('forgot-reset-button')).toBeNull();
    });

    it('uses the parent send operation for the parent audience', async () => {
      mockRouteParams = { audience: 'parent' };

      renderWithProviders(<ForgotPasswordScreen />);
      await reachCodeStep('parent');

      // Codes are scoped per audience, so sending the student operation here
      // would issue a code the parent reset can never consume.
      expect(apolloClient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          mutation: SendParentPasswordResetOtpDocument,
          variables: { mobile: VALID_MOBILE, country_code: '+2' },
        }),
      );
      expect(screen.getByTestId('forgot-reset-button')).toBeDefined();
    });
  });

  describe('resend', () => {
    it('actually sends a new code, even while the current one is still alive', async () => {
      jest.useFakeTimers();
      try {
        renderWithProviders(<ForgotPasswordScreen />);
        await reachCodeStep();

        // Past the 60s resend lock, but well inside the code's 10-minute life —
        // the window where the reuse shortcut used to make this button dead.
        await act(async () => {
          jest.advanceTimersByTime(61_000);
        });

        (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
          data: { sendPasswordResetOtp: { success: true, expires_in: 600 } },
        });

        await act(async () => {
          fireEvent.press(screen.getByTestId('forgot-resend-button'));
        });

        // The whole point of resend is the message that never arrived. Routing
        // it through the mobile-step "reuse the live code" shortcut makes it a
        // silent no-op for ten minutes.
        expect(apolloClient.mutate).toHaveBeenCalledTimes(2);
        expect(apolloClient.mutate).toHaveBeenLastCalledWith(
          expect.objectContaining({ mutation: SendPasswordResetOtpDocument }),
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('reuses a live code rather than spending a message when Continue is re-tapped', async () => {
      renderWithProviders(<ForgotPasswordScreen />);
      await reachCodeStep();

      // Step back to the mobile screen and continue again with the same number.
      fireEvent.press(screen.getByTestId('forgot-back-button'));
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-send-button'));
      });

      expect(apolloClient.mutate).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('forgot-reset-button')).toBeDefined();
    });
  });

  describe('reset step', () => {
    const fillNewPassword = (pwd: string, confirm = pwd) => {
      fireEvent.changeText(screen.getByTestId('forgot-otp-hidden-input'), '123456');
      fireEvent.changeText(screen.getByTestId('forgot-new-password-input'), pwd);
      fireEvent.changeText(screen.getByTestId('forgot-confirm-password-input'), confirm);
    };

    it('rejects a password shorter than the 8-character policy', async () => {
      renderWithProviders(<ForgotPasswordScreen />);
      await reachCodeStep();

      fillNewPassword('short');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-reset-button'));
      });

      expect(screen.getByText('auth.password_min_8')).toBeDefined();
      // Only the send call — no reset attempt was made.
      expect(apolloClient.mutate).toHaveBeenCalledTimes(1);
    });

    it('rejects mismatched passwords', async () => {
      renderWithProviders(<ForgotPasswordScreen />);
      await reachCodeStep();

      fillNewPassword('DemoPass1!', 'DemoPass2!');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-reset-button'));
      });

      expect(screen.getByText('auth.passwords_not_match')).toBeDefined();
      expect(apolloClient.mutate).toHaveBeenCalledTimes(1);
    });

    it('routes to Login after a successful student reset instead of auto-logging in', async () => {
      renderWithProviders(<ForgotPasswordScreen />);
      await reachCodeStep();

      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: { resetPasswordWithOtp: { success: true, message: 'ok' } },
      });

      fillNewPassword('DemoPass1!');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-reset-button'));
      });

      expect(apolloClient.mutate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          mutation: ResetPasswordWithOtpDocument,
          variables: expect.objectContaining({
            mobile: VALID_MOBILE,
            country_code: '+2',
            otp: '123456',
            password: 'DemoPass1!',
            password_confirmation: 'DemoPass1!',
          }),
        }),
      );

      const confirmCall = mockShowConfirm.mock.calls.at(-1)?.[0];
      expect(confirmCall).toEqual(expect.objectContaining({ title: 'auth.reset_success_title' }));

      await act(async () => {
        await confirmCall.onConfirm();
      });
      expect(mockNavigate).toHaveBeenCalledWith('Login');
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it('routes to ParentLogin after a successful parent reset', async () => {
      mockRouteParams = { audience: 'parent' };
      renderWithProviders(<ForgotPasswordScreen />);
      await reachCodeStep('parent');

      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: { resetParentPasswordWithOtp: { success: true } },
      });

      fillNewPassword('DemoPass1!');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-reset-button'));
      });

      expect(apolloClient.mutate).toHaveBeenLastCalledWith(
        expect.objectContaining({ mutation: ResetParentPasswordWithOtpDocument }),
      );

      await act(async () => {
        await mockShowConfirm.mock.calls.at(-1)?.[0].onConfirm();
      });
      expect(mockNavigate).toHaveBeenCalledWith('ParentLogin');
    });

    it('signs the user out when the reset was started from their profile', async () => {
      mockRouteParams = { audience: 'student', fromProfile: true };
      mockAuthState.user = { id: '1', mobile: VALID_MOBILE, email: 'a@b.com' };

      renderWithProviders(<ForgotPasswordScreen />);
      await reachCodeStep();

      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: { resetPasswordWithOtp: { success: true } },
      });

      fillNewPassword('DemoPass1!');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-reset-button'));
      });

      await act(async () => {
        await mockShowConfirm.mock.calls.at(-1)?.[0].onConfirm();
      });
      // The server revoked this session's token along with the rest.
      expect(mockLogout).toHaveBeenCalled();
    });

    it('surfaces a failed reset message inline', async () => {
      renderWithProviders(<ForgotPasswordScreen />);
      await reachCodeStep();

      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: { resetPasswordWithOtp: { success: false, message: 'otp.invalid_code' } },
      });

      fillNewPassword('DemoPass1!');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-reset-button'));
      });

      expect(screen.getByText('otp.invalid_code')).toBeDefined();
    });

    it('surfaces a top-level GraphQL error from the reset', async () => {
      renderWithProviders(<ForgotPasswordScreen />);
      await reachCodeStep();

      (apolloClient.mutate as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'The password must be at least 8 characters.' },
      });

      fillNewPassword('DemoPass1!');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-reset-button'));
      });

      expect(screen.getByText('The password must be at least 8 characters.')).toBeDefined();
    });
  });

  describe('email fallback', () => {
    it('still sends the email link from the secondary step', async () => {
      mockForgotPassword.mockResolvedValueOnce({ success: true });

      renderWithProviders(<ForgotPasswordScreen />);
      fireEvent.press(screen.getByTestId('forgot-email-link'));

      fireEvent.changeText(screen.getByTestId('forgot-email-input'), 'student@test.com');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-submit-button'));
      });

      expect(mockForgotPassword).toHaveBeenCalledWith('student@test.com');
    });

    it('validates the email format before sending', async () => {
      renderWithProviders(<ForgotPasswordScreen />);
      fireEvent.press(screen.getByTestId('forgot-email-link'));

      fireEvent.changeText(screen.getByTestId('forgot-email-input'), 'invalid-email');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-submit-button'));
      });

      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'auth.invalid_email_format' }),
      );
      expect(mockForgotPassword).not.toHaveBeenCalled();
    });

    it('uses the parent email mutation for the parent audience', async () => {
      mockRouteParams = { audience: 'parent' };
      mockParentForgotPassword.mockResolvedValueOnce({ success: true });

      renderWithProviders(<ForgotPasswordScreen />);
      fireEvent.press(screen.getByTestId('forgot-email-link'));

      fireEvent.changeText(screen.getByTestId('forgot-email-input'), 'parent@test.com');
      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-submit-button'));
      });

      expect(mockParentForgotPassword).toHaveBeenCalledWith('parent@test.com');
    });

    it('hides the email option in the profile flow when no email is on file', async () => {
      mockRouteParams = { audience: 'student', fromProfile: true };
      mockAuthState.user = { id: '1', mobile: VALID_MOBILE, email: null };

      renderWithProviders(<ForgotPasswordScreen />);

      await waitFor(() => expect(screen.queryByTestId('forgot-email-link')).toBeNull());
    });
  });
});
