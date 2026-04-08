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
import { configureCrashlyticsUser } from '../utils/crashlyticsHelper';
import analytics from '../lib/analytics';

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
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; user?: User; error?: string }>;
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
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();

    // Create logout function to share between handlers
    const handleSessionExpired = () => {
      if (__DEV__) console.log('Session expired - logging out');
      setUser(null);
    };

    // Register logout handler for Apollo error link
    setLogoutHandler(handleSessionExpired);

    // Register logout handler for API fetch calls
    setAuthErrorHandler(handleSessionExpired);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        configureCrashlyticsUser(parsedUser);
        analytics.identify(parsedUser.id, {
          name: parsedUser.name,
          mobile: parsedUser.mobile,
          grade: parsedUser.grade?.name,
        });
      } else {
        configureCrashlyticsUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      configureCrashlyticsUser(null);
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
              grade_id
              grade {
                id
                name
              }
              educational_system_id
              educational_system {
                id
                name
              }
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
          setUser(authPayload.user);
          configureCrashlyticsUser(authPayload.user);
          analytics.identify(authPayload.user.id, {
            name: authPayload.user.name,
            mobile: authPayload.user.mobile,
            grade: authPayload.user.grade?.name,
          });
          return { success: true, user: authPayload.user };
        }

        let errorMessage = result.errors?.[0]?.message || 'Login failed';
        if (errorMessage === 'These credentials do not match our records.') {
          errorMessage = 'auth.invalid_credentials';
        } else if (errorMessage === 'The mobile has already been taken.') {
          errorMessage = 'auth.mobile_taken';
        }

        return { success: false, error: errorMessage };
      } catch (error: any) {
        console.error('Login error:', error);
        let errorMessage = error.message || 'An error occurred during login';
        if (errorMessage === 'These credentials do not match our records.') {
          errorMessage = 'auth.invalid_credentials';
        }
        return {
          success: false,
          error: errorMessage,
        };
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
              grade_id
              grade {
                id
                name
              }
              educational_system_id
              educational_system {
                id
                name
              }
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
          setUser(authPayload.user);
          configureCrashlyticsUser(authPayload.user);
          analytics.identify(authPayload.user.id, {
            name: authPayload.user.name,
            mobile: authPayload.user.mobile,
            grade: authPayload.user.grade?.name,
          });
          return { success: true, user: authPayload.user };
        }

        let errorMessage = result.errors?.[0]?.message || 'Registration failed';
        if (errorMessage === 'These credentials do not match our records.') {
          errorMessage = 'auth.invalid_credentials';
        } else if (errorMessage === 'The mobile has already been taken.') {
          errorMessage = 'auth.mobile_taken';
        }

        return { success: false, error: errorMessage };
      } catch (error: any) {
        console.error('Registration error:', error);
        let errorMessage = error.message || 'An error occurred during registration';
        if (errorMessage === 'These credentials do not match our records.') {
          errorMessage = 'auth.invalid_credentials';
        }
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await AsyncStorage.removeItem('user_data');
      setUser(null);
      configureCrashlyticsUser(null);
      analytics.trackLogout();
      analytics.reset();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

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
        configureCrashlyticsUser(result.data.me);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, []);

  const value: AuthContextType = React.useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
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
