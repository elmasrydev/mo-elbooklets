import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tryFetchWithFallback } from '../config/api';
// import { useMutation } from '@apollo/client';
// import { LOGIN_MUTATION, REGISTER_MUTATION, User, LoginInput, RegisterInput, AuthPayload } from '../lib/graphql';

// Temporary types for testing
interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  grade_id?: string;
  grade?: { id: string; name: string };
}

interface LoginInput {
  mobile: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  mobile: string;
  password: string;
  grade_id: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  onAuthStateChange?: (isAuthenticated: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // const [loginMutation] = useMutation(LOGIN_MUTATION);
  // const [registerMutation] = useMutation(REGISTER_MUTATION);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const login = async (input: LoginInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await tryFetchWithFallback(`
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            access_token
            user {
              id
              name
              email
              mobile
              grade_id
              grade {
                id
                name
              }
            }
          }
        }
      `, { input });

      if (result.data?.login) {
        const authPayload = result.data.login;
        await AsyncStorage.setItem('auth_token', authPayload.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(authPayload.user));
        setUser(authPayload.user);
        return { success: true };
      }

      return { success: false, error: result.errors?.[0]?.message || 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during login'
      };
    }
  };

  const register = async (input: RegisterInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await tryFetchWithFallback(`
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            access_token
            user {
              id
              name
              email
              mobile
              grade_id
              grade {
                id
                name
              }
            }
          }
        }
      `, { input });

      if (result.data?.register) {
        const authPayload = result.data.register;
        await AsyncStorage.setItem('auth_token', authPayload.access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(authPayload.user));
        setUser(authPayload.user);
        return { success: true };
      }

      return { success: false, error: result.errors?.[0]?.message || 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during registration'
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
