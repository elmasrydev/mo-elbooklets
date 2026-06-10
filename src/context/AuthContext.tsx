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
import { tryFetchWithFallback, setAuthErrorHandler } from '../config/api';
import { setLogoutHandler } from '../lib/apollo';
import { analytics } from '../lib/analytics';
import {
  configureCrashlyticsStudent,
  configureCrashlyticsParent,
  configureCrashlyticsGuest,
} from '../utils/crashlyticsHelper';
import { logError, logInfo } from '../utils/logger';
import {
  triggerNotificationPrompt,
  clearNotificationPromptedFlag,
  registerDeviceToken,
  unregisterDeviceToken,
} from '../services/notificationService';
import i18n from '../i18n';

// Temporary types for testing
interface User {
  id: string;
  name: string;
  email?: string;
  mobile: string;
  country_code?: string;
  mobile_verified_at?: string;
  gender?: string;
  school_name?: string;
  parent_mobile?: string;
  grade_id?: string;
  grade?: { id: string; name: string };
  educational_system_id?: string;
  educational_system?: { id: string; name: string };
  governorate_id?: string | number;
  governorate?: { id: string; name_ar: string; name_en: string };
  city_id?: string | number;
  city?: { id: string; name_ar: string; name_en: string };
  is_subscribed?: boolean;
  role?: 'student' | 'parent';
  followers_count?: number;
  following_count?: number;
}

interface Parent {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  country_code?: string;
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
  login: (input: LoginInput) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; user?: User; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  parentLogin: (input: ParentLoginInput) => Promise<{ success: boolean; error?: string }>;
  parentRegister: (input: ParentRegisterInput) => Promise<{ success: boolean; error?: string }>;
  parentForgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  updateParentUser: (data: Partial<Parent>) => Promise<void>;
  isVerificationSkipped: boolean;
  skipVerification: () => void;
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
    const handleSessionExpired = () => {
      logInfo('Session expired - logging out');
      unregisterDeviceToken();
      clearNotificationPromptedFlag();
      setUser(null);
      setParentUser(null);
      setUserRole(null);
    };

    // Register logout handler for Apollo error link
    setLogoutHandler(handleSessionExpired);

    // Register logout handler for API fetch calls
    setAuthErrorHandler(handleSessionExpired);
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
              name: parsedUser.name,
              mobile: parsedUser.mobile,
              grade: parsedUser.grade?.name,
            });
          }

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
    async (input: LoginInput): Promise<{ success: boolean; user?: User; error?: string }> => {
      try {
        const result = await tryFetchWithFallback(
          `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            access_token
            user {
              id
              name
              email
              mobile
              country_code
              mobile_verified_at
              grade_id
              grade { id name }
              educational_system_id
              educational_system { id name }
              is_subscribed
            }
          }
        }
      `,
          { input },
        );

        if (result.data?.login) {
          const authPayload = result.data.login;
          await SecureStore.setItemAsync('auth_token', authPayload.access_token);
          await SecureStore.setItemAsync('user_data', JSON.stringify(authPayload.user));
          await SecureStore.setItemAsync('user_role', 'student');
          setUser(authPayload.user);
          setUserRole('student');
          configureCrashlyticsStudent(authPayload.user);
          analytics.identify(authPayload.user.id, {
            name: authPayload.user.name,
            mobile: authPayload.user.mobile,
            grade: authPayload.user.grade?.name,
          });

          registerDeviceToken('student');
          setTimeout(() => triggerNotificationPrompt(), 10000);

          if (!authPayload.user.mobile_verified_at) {
            // Login: backend does NOT auto-fire OTP — screen must request it on mount
            setOtpShouldAutoRequest(true);
          }
          return { success: true, user: authPayload.user };
        }

        let errorMessage = result.errors?.[0]?.message || 'Login failed';
        if (errorMessage === 'These credentials do not match our records.') {
          errorMessage = 'auth.invalid_credentials';
        }

        return { success: false, error: errorMessage };
      } catch (error: any) {
        logError('Login error', error);
        return { success: false, error: error.message || 'An error occurred during login' };
      }
    },
    [],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<{ success: boolean; user?: User; error?: string }> => {
      try {
        const result = await tryFetchWithFallback(
          `
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            access_token
            user {
              id
              name
              email
              mobile
              country_code
              mobile_verified_at
              grade_id
              grade { id name }
              educational_system_id
              educational_system { id name }
              is_subscribed
            }
          }
        }
      `,
          { input },
        );

        if (result.data?.register) {
          const authPayload = result.data.register;
          await SecureStore.setItemAsync('auth_token', authPayload.access_token);
          await SecureStore.setItemAsync('user_data', JSON.stringify(authPayload.user));
          await SecureStore.setItemAsync('user_role', 'student');
          setUser(authPayload.user);
          setUserRole('student');
          configureCrashlyticsStudent(authPayload.user);
          analytics.identify(authPayload.user.id, {
            name: authPayload.user.name,
            mobile: authPayload.user.mobile,
            grade: authPayload.user.grade?.name,
          });

          registerDeviceToken('student');
          setTimeout(() => triggerNotificationPrompt(), 10000);

          if (!authPayload.user.mobile_verified_at) {
            setOtpWasAutoSent(true);
          }
          return { success: true, user: authPayload.user };
        }

        let errorMessage = result.errors?.[0]?.message || 'Registration failed';
        if (errorMessage === 'The mobile has already been taken.') {
          errorMessage = 'auth.mobile_taken';
        }

        return { success: false, error: errorMessage };
      } catch (error: any) {
        logError('Registration error', error);
        return { success: false, error: error.message || 'An error occurred during registration' };
      }
    },
    [],
  );

  const forgotPassword = useCallback(
    async (email: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const result = await tryFetchWithFallback(
          `
        mutation ForgotPassword($email: String!) {
          forgotPassword(email: $email) {
            success
            message
          }
        }
      `,
          { email },
        );

        if (result.data?.forgotPassword) {
          return {
            success: result.data.forgotPassword.success,
            message: result.data.forgotPassword.message,
          };
        }

        return {
          success: false,
          message: result.errors?.[0]?.message || 'Forgot password failed',
        };
      } catch (error: any) {
        logError('Forgot password error', error);
        return { success: false, message: error.message };
      }
    },
    [],
  );

  const parentLogin = useCallback(
    async (input: ParentLoginInput): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await tryFetchWithFallback(
          `
        mutation ParentLogin($mobile: String!, $password: String!) {
          parentLogin(input: {
            mobile: $mobile,
            email: $email,
            password: $password
          }) {
            access_token
            parent {
              id
              name
              mobile
            }
          }
        }
      `,
          { mobile: input.mobile, password: input.password },
        );

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

          return { success: true };
        }

        return { success: false, error: result.errors?.[0]?.message || 'Login failed' };
      } catch (error: any) {
        logError('Parent login error', error);
        return { success: false, error: error.message || 'An error occurred during parent login' };
      }
    },
    [],
  );

  const parentRegister = useCallback(
    async (input: ParentRegisterInput): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await tryFetchWithFallback(
          `
        mutation ParentRegister($name: String!, $mobile: String!, $email: String!, $password: String!) {
          parentRegister(input: {
            name: $name,
            mobile: $mobile,
            password: $password
          }) {
            access_token
            parent {
              id
              name
              mobile
              email
            }
          }
        }
      `,
          { name: input.name, mobile: input.mobile, email: input.email, password: input.password },
        );

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

          return { success: true };
        }

        return { success: false, error: result.errors?.[0]?.message || 'Registration failed' };
      } catch (error: any) {
        logError('Parent registration error', error);
        return {
          success: false,
          error: error.message || 'An error occurred during parent registration',
        };
      }
    },
    [],
  );

  const parentForgotPassword = useCallback(
    async (email: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const result = await tryFetchWithFallback(
          `
        mutation ParentForgotPassword($email: String!) {
          parentForgotPassword(email: $email) {
            success
            message
          }
        }
      `,
          { email },
        );

        if (result.data?.parentForgotPassword) {
          return {
            success: result.data.parentForgotPassword.success,
            message: result.data.parentForgotPassword.message,
          };
        }

        return {
          success: false,
          message: result.errors?.[0]?.message || 'Forgot password failed',
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
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
      await SecureStore.deleteItemAsync('parent_data');
      await SecureStore.deleteItemAsync('user_role');
      await unregisterDeviceToken();
      await clearNotificationPromptedFlag();
      setUser(null);
      setParentUser(null);
      setUserRole(null);
      configureCrashlyticsGuest();
      analytics.trackLogout();
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
          name: updatedUser.name,
          email: updatedUser.email,
          mobile: updatedUser.mobile,
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

  const refreshUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const role = await SecureStore.getItemAsync('user_role');
      if (!token || !role) return;

      if (role === 'student') {
        const result = await tryFetchWithFallback(
          `query Me { 
            me { 
              id name email mobile country_code mobile_verified_at gender school_name parent_mobile
              grade_id grade { id name } educational_system_id educational_system { id name } 
              governorate_id governorate { id name_ar name_en }
              city_id city { id name_ar name_en }
              is_subscribed
            } 
          }`,
          undefined,
          token,
        );
        if (result.data?.me) {
          await SecureStore.setItemAsync('user_data', JSON.stringify(result.data.me));
          setUser(result.data.me);
          configureCrashlyticsStudent(result.data.me);
          analytics.identify(result.data.me.id, {
            name: result.data.me.name,
            mobile: result.data.me.mobile,
            grade: result.data.me.grade?.name,
          });
        }
      } else {
        const result = await tryFetchWithFallback(
          `query ParentMe { 
            parentMe { 
              id name mobile country_code
            } 
          }`,
          undefined,
          token,
        );
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
