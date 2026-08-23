import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apolloClient } from '../lib/apollo';
import {
  ForgotPasswordDocument,
  LoginDocument,
  MeDocument,
  ParentForgotPasswordDocument,
  ParentLoginDocument,
  ParentMeDocument,
  ParentRegisterDocument,
  RegisterDocument,
} from '../generated/graphql';
import { setSessionRevokedHandler } from '../lib/session';
import { analytics } from '../lib/analytics';
import {
  configureCrashlyticsStudent,
  configureCrashlyticsParent,
  configureCrashlyticsGuest,
} from '../utils/crashlyticsHelper';
import { logError, logInfo } from '../utils/logger';
import { AuthFailure, classifyAuthFailure } from '../utils/authErrors';
import { useAppForeground } from '../hooks/useAppForeground';
import {
  triggerNotificationPrompt,
  clearNotificationPromptedFlag,
  registerDeviceToken,
  unregisterDeviceToken,
} from '../services/notificationService';
import i18n from '../i18n';

// Temporary types for testing
// Optional fields are `| null` because that is what the API returns; the app
// treats null and undefined alike ("not set").
export interface User {
  id: string;
  name: string;
  email?: string | null;
  mobile: string;
  country_code?: string | null;
  mobile_verified_at?: string | null;
  gender?: string | null;
  school_name?: string | null;
  parent_mobile?: string | null;
  grade_id?: string | null;
  grade?: { id: string; name: string } | null;
  educational_system_id?: string | null;
  educational_system?: { id: string; name: string } | null;
  governorate_id?: string | number | null;
  governorate?: { id: string; name_ar: string; name_en: string } | null;
  city_id?: string | number | null;
  city?: { id: string; name_ar: string; name_en: string } | null;
  is_subscribed?: boolean | null;
  role?: 'student' | 'parent';
  followers_count?: number;
  following_count?: number;
  selectedAvatar?: { id: string; name?: string | null; url: string; gender?: string | null } | null;
}

interface Parent {
  id: string;
  name: string | null;
  mobile: string;
  email?: string | null;
  country_code?: string | null;
  /** Null until the parent confirms the number with a WhatsApp code. */
  mobile_verified_at?: string | null;
}

interface ParentLoginInput {
  mobile: string;
  password: string;
}

interface ParentRegisterInput {
  name: string;
  mobile: string;
  email: string;
  password: string;
}

interface LoginInput {
  mobile: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email?: string;
  mobile: string;
  country_code?: string;
  gender?: string;
  school_name?: string;
  parent_mobile?: string;
  parent_country_code?: string;
  parent_mobile_2?: string;
  parent_country_code_2?: string;
  password: string;
  grade_id: string;
  educational_system_id?: string;
  promo_code?: string;
}

interface AuthContextType {
  user: User | null;
  parentUser: Parent | null;
  userRole: 'student' | 'parent' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<{ success: boolean; user?: User } & AuthFailure>;
  register: (input: RegisterInput) => Promise<{ success: boolean; user?: User } & AuthFailure>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string | null }>;
  parentLogin: (input: ParentLoginInput) => Promise<{ success: boolean } & AuthFailure>;
  parentRegister: (input: ParentRegisterInput) => Promise<{ success: boolean } & AuthFailure>;
  parentForgotPassword: (email: string) => Promise<{ success: boolean; message?: string | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  updateParentUser: (data: Partial<Parent>) => Promise<void>;
  isVerificationSkipped: boolean;
  skipVerification: () => void;
  requestVerification: () => void;
  otpWasAutoSent: boolean;
  markOtpAutoSent: () => void;
  clearOtpAutoSent: () => void;
  otpShouldAutoRequest: boolean;
  clearOtpShouldAutoRequest: () => void;
  showRegistrationSuccess: boolean;
  setRegistrationSuccessPending: (pending: boolean) => Promise<void>;
  onAuthStateChange?: (isAuthenticated: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [parentUser, setParentUser] = useState<Parent | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'parent' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerificationSkipped, setIsVerificationSkipped] = useState(false);
  const [otpWasAutoSent, setOtpWasAutoSent] = useState(false);
  const [otpShouldAutoRequest, setOtpShouldAutoRequest] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();

    // Create logout function to share between handlers
    // Callers invoke this without awaiting, so nothing observes a rejection here —
    // it has to contain its own failures or they surface as unhandled rejections.
    const handleSessionExpired = async (authToken?: string) => {
      try {
        logInfo('Session expired - logging out');
        // Drop the session first so the app redirects to login straight away. The
        // push-token cleanup below makes network calls with no timeout, which would
        // otherwise strand the user on an authenticated screen until they fail.
        setUser(null);
        setParentUser(null);
        setUserRole(null);
        // Clear persisted credentials too — otherwise the stale token/role are
        // restored on next launch and the app re-authenticates into a session the
        // server already rejected, looping back into 401s.
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_role');
        await SecureStore.deleteItemAsync('user_data');
        await SecureStore.deleteItemAsync('parent_data');
        // The Apollo cache still holds the revoked session's data (profile,
        // notifications, badges) — drop it so the next sign-in can't see it.
        await apolloClient.clearStore();
        // `authToken` comes from whichever handler caught the auth failure, which
        // captures it before revoking it. The trigger is often a still-valid session
        // (the matcher fires on any error containing "unauthenticated"), so the
        // unregister can genuinely succeed rather than silently failing auth.
        await unregisterDeviceToken(authToken);
        await clearNotificationPromptedFlag();
      } catch (error) {
        logError('Session expiry cleanup error', error);
      }
    };

    // Single registration point — both transports (the Apollo error link and
    // the raw transport) funnel auth failures through lib/session.
    setSessionRevokedHandler(handleSessionExpired);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const role = (await SecureStore.getItemAsync('user_role')) as 'student' | 'parent' | null;

      if (token && role) {
        setUserRole(role);
        if (role === 'student') {
          const userData = await SecureStore.getItemAsync('user_data');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            configureCrashlyticsStudent(parsedUser);
            analytics.identify(parsedUser.id, {
              grade: parsedUser.grade?.name,
            });
          }

          // The stored blob is a snapshot from the last sign-in, and
          // `is_subscribed` is the field the whole app gates content on — a
          // trial that lapsed overnight, or a plan support activated this
          // morning, is invisible until this lands. Deliberately not awaited:
          // the cached copy is good enough to paint with, and holding the
          // splash on a network round-trip is not.
          void refreshUser();

          // Check if registration success screen is pending
          const justRegistered = await AsyncStorage.getItem('just_registered_pending_success');
          const hasSeenSuccess = await AsyncStorage.getItem('has_seen_success_screen');
          if (justRegistered === 'true' && hasSeenSuccess !== 'true') {
            setShowRegistrationSuccess(true);
          }
        } else {
          const parentData = await SecureStore.getItemAsync('parent_data');
          if (parentData) {
            const parsedParent = JSON.parse(parentData);
            setParentUser(parsedParent);
            configureCrashlyticsParent(parsedParent);

            // Builds before the parent OTP gate never stored `mobile_verified_at`,
            // so a blob without the key says nothing about verification. Pull the
            // truth before the gate can act on the absence and strand an already
            // verified parent on the code screen.
            if (!('mobile_verified_at' in parsedParent)) {
              // Awaited: `checkAuthStatus` clears `isLoading` in its finally, and
              // letting that happen first renders the dashboard on the unknown
              // value, then yanks the parent to the OTP gate mid-interaction
              // when the backfill lands.
              await refreshParentFromServer();
            }
          }
        }

        // Register FCM token with backend and trigger notification prompt
        registerDeviceToken(role);
        setTimeout(() => triggerNotificationPrompt(), 10000);
      } else {
        configureCrashlyticsGuest();
      }
    } catch (error) {
      logError('Error checking auth status', error);
      configureCrashlyticsGuest();
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(
    async (input: LoginInput): Promise<{ success: boolean; user?: User } & AuthFailure> => {
      try {
        const result = await apolloClient.mutate({
          mutation: LoginDocument,
          variables: { input },
        });

        if (result.data?.login) {
          const authPayload = result.data.login;
          await SecureStore.setItemAsync('auth_token', authPayload.access_token);
          await SecureStore.setItemAsync('user_data', JSON.stringify(authPayload.user));
          await SecureStore.setItemAsync('user_role', 'student');
          setUser(authPayload.user);
          setUserRole('student');
          configureCrashlyticsStudent(authPayload.user);
          analytics.identify(authPayload.user.id, {
            grade: authPayload.user.grade?.name,
          });

          registerDeviceToken('student');
          setTimeout(() => triggerNotificationPrompt(), 10000);

          if (!authPayload.user.mobile_verified_at) {
            // `login` auto-sends a fresh code when the number is unverified
            // (mobile-otp-guide.md section 3), so the screen must not send a
            // second one — it would burn the user's 3-per-hour budget.
            setOtpWasAutoSent(true);
          }
          return { success: true, user: authPayload.user };
        }

        // A mutation that returns no payload without throwing means the
        // credentials were rejected but the server explained nothing.
        return { success: false, errorKey: 'auth.invalid_credentials' };
      } catch (error) {
        logError('Login error', error);
        return { success: false, ...classifyAuthFailure(error, 'auth.invalid_credentials') };
      }
    },
    [],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<{ success: boolean; user?: User } & AuthFailure> => {
      try {
        const result = await apolloClient.mutate({
          mutation: RegisterDocument,
          variables: { input },
        });

        if (result.data?.register) {
          const authPayload = result.data.register;
          await SecureStore.setItemAsync('auth_token', authPayload.access_token);
          await SecureStore.setItemAsync('user_data', JSON.stringify(authPayload.user));
          await SecureStore.setItemAsync('user_role', 'student');
          setUser(authPayload.user);
          setUserRole('student');
          configureCrashlyticsStudent(authPayload.user);
          analytics.identify(authPayload.user.id, {
            grade: authPayload.user.grade?.name,
          });

          registerDeviceToken('student');
          setTimeout(() => triggerNotificationPrompt(), 10000);

          if (!authPayload.user.mobile_verified_at) {
            setOtpWasAutoSent(true);
          }
          return { success: true, user: authPayload.user };
        }

        return { success: false, errorKey: 'auth.registration_error' };
      } catch (error) {
        logError('Registration error', error);
        return { success: false, ...classifyAuthFailure(error, 'auth.registration_error') };
      }
    },
    [],
  );

  const forgotPassword = useCallback(
    async (email: string): Promise<{ success: boolean; message?: string | null }> => {
      try {
        const result = await apolloClient.mutate({
          mutation: ForgotPasswordDocument,
          variables: { email },
        });

        if (result.data?.forgotPassword) {
          return {
            success: result.data.forgotPassword.success,
            message: result.data.forgotPassword.message,
          };
        }

        return {
          success: false,
          message: 'Forgot password failed',
        };
      } catch (error: any) {
        logError('Forgot password error', error);
        return { success: false, message: error.message };
      }
    },
    [],
  );

  const parentLogin = useCallback(
    async (input: ParentLoginInput): Promise<{ success: boolean } & AuthFailure> => {
      try {
        const result = await apolloClient.mutate({
          mutation: ParentLoginDocument,
          variables: { mobile: input.mobile, password: input.password },
        });

        if (result.data?.parentLogin) {
          const authPayload = result.data.parentLogin;
          await SecureStore.setItemAsync('auth_token', authPayload.access_token);
          await SecureStore.setItemAsync('parent_data', JSON.stringify(authPayload.parent));
          await SecureStore.setItemAsync('user_role', 'parent');
          setParentUser(authPayload.parent);
          setUserRole('parent');
          configureCrashlyticsParent(authPayload.parent);

          registerDeviceToken('parent');
          setTimeout(() => triggerNotificationPrompt(), 10000);

          // `=== null` rather than falsy, to match the navigator's gate exactly:
          // an absent field means "unknown", and flagging it here would strand a
          // 60s resend lock on a screen that never mounts to clear it.
          if (authPayload.parent.mobile_verified_at === null) {
            // `parentLogin` auto-sends a fresh code when the number is
            // unverified (mobile-otp-guide.md section 3).
            setOtpWasAutoSent(true);
          }
          return { success: true };
        }

        return { success: false, errorKey: 'auth.invalid_credentials' };
      } catch (error) {
        logError('Parent login error', error);
        return { success: false, ...classifyAuthFailure(error, 'auth.invalid_credentials') };
      }
    },
    [],
  );

  const parentRegister = useCallback(
    async (input: ParentRegisterInput): Promise<{ success: boolean } & AuthFailure> => {
      try {
        const result = await apolloClient.mutate({
          mutation: ParentRegisterDocument,
          variables: {
            name: input.name,
            mobile: input.mobile,
            email: input.email,
            password: input.password,
          },
        });

        if (result.data?.parentRegister) {
          const authPayload = result.data.parentRegister;
          await SecureStore.setItemAsync('auth_token', authPayload.access_token);
          await SecureStore.setItemAsync('parent_data', JSON.stringify(authPayload.parent));
          await SecureStore.setItemAsync('user_role', 'parent');
          setParentUser(authPayload.parent);
          setUserRole('parent');
          configureCrashlyticsParent(authPayload.parent);

          registerDeviceToken('parent');
          setTimeout(() => triggerNotificationPrompt(), 10000);

          if (authPayload.parent.mobile_verified_at === null) {
            // `parentRegister` auto-sends the first code, same as `register`.
            setOtpWasAutoSent(true);
          }
          return { success: true };
        }

        return { success: false, errorKey: 'auth.registration_error' };
      } catch (error) {
        logError('Parent registration error', error);
        return { success: false, ...classifyAuthFailure(error, 'auth.registration_error') };
      }
    },
    [],
  );

  const parentForgotPassword = useCallback(
    async (email: string): Promise<{ success: boolean; message?: string | null }> => {
      try {
        const result = await apolloClient.mutate({
          mutation: ParentForgotPasswordDocument,
          variables: { email },
        });

        if (result.data?.parentForgotPassword) {
          return {
            success: result.data.parentForgotPassword.success,
            message: result.data.parentForgotPassword.message,
          };
        }

        return {
          success: false,
          message: 'Forgot password failed',
        };
      } catch (error: any) {
        logError('Parent forgot password error', error);
        return { success: false, message: error.message };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      // Capture the credential before anything clears it. The unregister mutation
      // is authenticated, and Apollo's auth link otherwise falls back to reading
      // `auth_token` from SecureStore — which is how the request went out with no
      // Authorization header, left the signed-out account's push token registered,
      // and kept its notifications arriving on this device (BKLT-316).
      const authToken = (await SecureStore.getItemAsync('auth_token')) || undefined;

      // Tear the session down before the push cleanup below. That call makes
      // network requests with no timeout, so awaiting it first would leave the user
      // sitting on authenticated screens — credentials still on disk — for as long
      // as a dead connection takes to fail. Holding the token in a local keeps the
      // unregister authenticated regardless.
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
      await SecureStore.deleteItemAsync('parent_data');
      await SecureStore.deleteItemAsync('user_role');
      setUser(null);
      setParentUser(null);
      setUserRole(null);
      // Reset session-scoped verification flags so they can't leak into the next
      // account signed in without an app restart (e.g. a skipped unverified user
      // logging out, then another unverified user logging in would otherwise
      // bypass the OTP screen). (code-review)
      setIsVerificationSkipped(false);
      setOtpShouldAutoRequest(false);
      // The post-registration success flag is per-account. Left set, a student
      // who registers, abandons at the OTP gate and logs out hands the
      // celebration screen to whoever signs in next on this device — and
      // checkAuthStatus re-reads the AsyncStorage keys with no ownership check,
      // so it would re-arm on their next cold start too.
      setShowRegistrationSuccess(false);
      await AsyncStorage.removeItem('just_registered_pending_success');
      await AsyncStorage.removeItem('has_seen_success_screen');
      // Load-bearing for both roles since the parent gate landed: left set, the
      // next sign-in jumps straight to the code step and locks resend for 60s
      // for a code that was never sent.
      setOtpWasAutoSent(false);
      configureCrashlyticsGuest();
      analytics.trackLogout();

      // Same reason as handleSessionExpired: the cached Apollo data belongs to
      // the account that just signed out.
      await apolloClient.clearStore();
      await unregisterDeviceToken(authToken);
      await clearNotificationPromptedFlag();
    } catch (error) {
      logError('Logout error', error);
    }
  }, []);

  const updateUser = useCallback(
    async (userData: User) => {
      try {
        const updatedUser = { ...user, ...userData };
        await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
        setUser(updatedUser);
        configureCrashlyticsStudent(updatedUser);
        analytics.identify(updatedUser.id, {
          grade: updatedUser.grade?.name,
        });
      } catch (error) {
        logError('Update user local data error', error);
      }
    },
    [user],
  );

  const updateParentUser = useCallback(
    async (data: Partial<Parent>) => {
      const updatedParent = { ...parentUser, ...data } as Parent;
      await SecureStore.setItemAsync('parent_data', JSON.stringify(updatedParent));
      setParentUser(updatedParent);
    },
    [parentUser],
  );

  const skipVerification = useCallback(() => {
    setIsVerificationSkipped(true);
  }, []);

  const requestVerification = useCallback(() => {
    // Reverse a prior skip so AppNavigator re-mounts the OTP screen, and flag it to
    // auto-request a fresh code on mount. Entry point for the "Verify via WhatsApp"
    // banner, which is the only way a Skip-OTP user can get back to verification. (BKLT-276)
    setIsVerificationSkipped(false);
    setOtpShouldAutoRequest(true);
  }, []);

  const setRegistrationSuccessPending = useCallback(async (pending: boolean) => {
    setShowRegistrationSuccess(pending);
    if (pending) {
      await AsyncStorage.setItem('just_registered_pending_success', 'true');
      await AsyncStorage.removeItem('has_seen_success_screen');
    } else {
      await AsyncStorage.setItem('has_seen_success_screen', 'true');
      await AsyncStorage.removeItem('just_registered_pending_success');
    }
  }, []);

  /**
   * Fills in a parent record restored from a pre-gate build, which predates
   * `mobile_verified_at`. Best-effort: a failure just leaves the record as-is,
   * and the field arrives on the next login.
   */
  const refreshParentFromServer = async () => {
    try {
      const result = await apolloClient.query({
        query: ParentMeDocument,
        fetchPolicy: 'network-only',
      });
      if (result.data?.parentMe) {
        await SecureStore.setItemAsync('parent_data', JSON.stringify(result.data.parentMe));
        setParentUser(result.data.parentMe);
      }
    } catch (error) {
      logError('Parent verification-state backfill failed', error);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const role = await SecureStore.getItemAsync('user_role');
      if (!token || !role) return;

      if (role === 'student') {
        const result = await apolloClient.query({
          query: MeDocument,
          fetchPolicy: 'network-only',
        });
        if (result.data?.me) {
          await SecureStore.setItemAsync('user_data', JSON.stringify(result.data.me));
          setUser(result.data.me);
          configureCrashlyticsStudent(result.data.me);
          analytics.identify(result.data.me.id, {
            grade: result.data.me.grade?.name,
          });
        }
      } else {
        const result = await apolloClient.query({
          query: ParentMeDocument,
          fetchPolicy: 'network-only',
        });
        if (result.data?.parentMe) {
          await SecureStore.setItemAsync('parent_data', JSON.stringify(result.data.parentMe));
          setParentUser(result.data.parentMe);
          configureCrashlyticsParent(result.data.parentMe);
        }
      }
    } catch (error) {
      logError('Refresh user error', error);
    }
  }, []);

  // A subscription can start or lapse while the app sits in the background, and
  // nothing tells the device. Re-read the account on the way back in so the
  // content gates decide on today's state rather than the one cached at launch.
  // `refreshUser` no-ops without a stored session, so this is safe signed out.
  useAppForeground(refreshUser);

  const value: AuthContextType = React.useMemo(
    () => ({
      user,
      parentUser,
      userRole,
      isLoading,
      isAuthenticated: !!user || !!parentUser,
      login,
      register,
      forgotPassword,
      parentLogin,
      parentRegister,
      parentForgotPassword,
      logout,
      refreshUser,
      updateUser,
      updateParentUser,
      isVerificationSkipped,
      skipVerification,
      requestVerification,
      otpWasAutoSent,
      markOtpAutoSent: () => setOtpWasAutoSent(true),
      clearOtpAutoSent: () => setOtpWasAutoSent(false),
      otpShouldAutoRequest,
      clearOtpShouldAutoRequest: () => setOtpShouldAutoRequest(false),
      showRegistrationSuccess,
      setRegistrationSuccessPending,
    }),
    [
      user,
      parentUser,
      userRole,
      isLoading,
      login,
      register,
      forgotPassword,
      parentLogin,
      parentRegister,
      parentForgotPassword,
      logout,
      refreshUser,
      updateUser,
      updateParentUser,
      isVerificationSkipped,
      skipVerification,
      requestVerification,
      otpWasAutoSent,
      otpShouldAutoRequest,
      showRegistrationSuccess,
      setRegistrationSuccessPending,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
