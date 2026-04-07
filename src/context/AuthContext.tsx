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
import {
  configureCrashlyticsStudent,
  configureCrashlyticsParent,
  configureCrashlyticsGuest,
} from '../utils/crashlyticsHelper';
import { logError, logInfo } from '../utils/logger';

// Temporary types for testing
interface User {
  id: string;
  name: string;
  email?: string;
  mobile: string;
  country_code?: string;
  gender?: string;
  school_name?: string;
  parent_mobile?: string;
  grade_id?: string;
  grade?: { id: string; name: string };
  educational_system_id?: string;
  educational_system?: { id: string; name: string };
  is_subscribed?: boolean;
  role?: 'student' | 'parent';
}

interface Parent {
  id: string;
  name: string;
  mobile: string;
  country_code?: string;
}

interface ParentLoginInput {
  mobile: string;
  password: string;
}

interface ParentRegisterInput {
  name: string;
  mobile: string;
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
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  parentLogin: (input: ParentLoginInput) => Promise<{ success: boolean; error?: string }>;
  parentRegister: (input: ParentRegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();

    // Create logout function to share between handlers
    const handleSessionExpired = () => {
      logInfo('Session expired - logging out');
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
      const role = (await AsyncStorage.getItem('user_role')) as 'student' | 'parent' | null;

      if (token && role) {
        setUserRole(role);
        if (role === 'student') {
          const userData = await AsyncStorage.getItem('user_data');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            configureCrashlyticsStudent(parsedUser);
          }
        } else {
          const parentData = await AsyncStorage.getItem('parent_data');
          if (parentData) {
            const parsedParent = JSON.parse(parentData);
            setParentUser(parsedParent);
            configureCrashlyticsParent(parsedParent);
          }
        }
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
    async (input: LoginInput): Promise<{ success: boolean; error?: string }> => {
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
          await AsyncStorage.setItem('user_data', JSON.stringify(authPayload.user));
          await AsyncStorage.setItem('user_role', 'student');
          setUser(authPayload.user);
          setUserRole('student');
          configureCrashlyticsStudent(authPayload.user);
          return { success: true };
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
    async (input: RegisterInput): Promise<{ success: boolean; error?: string }> => {
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
          await AsyncStorage.setItem('user_data', JSON.stringify(authPayload.user));
          await AsyncStorage.setItem('user_role', 'student');
          setUser(authPayload.user);
          setUserRole('student');
          configureCrashlyticsStudent(authPayload.user);
          return { success: true };
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

  const parentLogin = useCallback(
    async (input: ParentLoginInput): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await tryFetchWithFallback(
          `
        mutation ParentLogin($mobile: String!, $password: String!) {
          parentLogin(input: {
            mobile: $mobile,
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
          await AsyncStorage.setItem('parent_data', JSON.stringify(authPayload.parent));
          await AsyncStorage.setItem('user_role', 'parent');
          setParentUser(authPayload.parent);
          setUserRole('parent');
          configureCrashlyticsParent(authPayload.parent);
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
        mutation ParentRegister($name: String!, $mobile: String!, $password: String!) {
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
            }
          }
        }
      `,
          { name: input.name, mobile: input.mobile, password: input.password },
        );

        if (result.data?.parentRegister) {
          const authPayload = result.data.parentRegister;
          await SecureStore.setItemAsync('auth_token', authPayload.access_token);
          await AsyncStorage.setItem('parent_data', JSON.stringify(authPayload.parent));
          await AsyncStorage.setItem('user_role', 'parent');
          setParentUser(authPayload.parent);
          setUserRole('parent');
          configureCrashlyticsParent(authPayload.parent);
          return { success: true };
        }

        return { success: false, error: result.errors?.[0]?.message || 'Registration failed' };
      } catch (error: any) {
        logError('Parent registration error', error);
        return { success: false, error: error.message || 'An error occurred during parent registration' };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('parent_data');
      await AsyncStorage.removeItem('user_role');
      setUser(null);
      setParentUser(null);
      setUserRole(null);
      configureCrashlyticsGuest();
    } catch (error) {
      logError('Logout error', error);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const role = await AsyncStorage.getItem('user_role');
      if (!token || !role) return;

      if (role === 'student') {
        const result = await tryFetchWithFallback(
          `query Me { 
            me { 
              id name email mobile country_code gender school_id 
              grade_id grade { id name } educational_system_id educational_system { id name } 
              is_subscribed
            } 
          }`,
          undefined,
          token
        );
        if (result.data?.me) {
          await AsyncStorage.setItem('user_data', JSON.stringify(result.data.me));
          setUser(result.data.me);
          configureCrashlyticsStudent(result.data.me);
        }
      } else {
        const result = await tryFetchWithFallback(
          `query ParentMe { 
            parentMe { 
              id name mobile country_code
            } 
          }`,
          undefined,
          token
        );
        if (result.data?.parentMe) {
          await AsyncStorage.setItem('parent_data', JSON.stringify(result.data.parentMe));
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
      parentLogin,
      parentRegister,
      logout,
      refreshUser,
    }),
    [user, parentUser, userRole, isLoading, login, register, parentLogin, parentRegister, logout, refreshUser],
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

