import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  primary: string;
  secondary: string;
  card: string;
  headerBackground: string;
  headerText: string;
  headerSubtitle: string;
  tabActive: string;
  tabInactive: string;
  tabActiveText: string;
  tabInactiveText: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonDisabled: string;
  buttonDisabledText: string;
  avatarBackground: string;
  avatarText: string;
  rankBadgeText: string;
  gold: string;
  silver: string;
  bronze: string;
  orange: string;
  success: string;
  successBackground: string;
  successText: string;
  error: string;
  errorBackground: string;
  errorText: string;
  warning: string;
  warningBackground: string;
  warningText: string;
  passBackground: string;
  passText: string;
  failBackground: string;
  failText: string;
  iconBackground: string;
  checkboxBorder: string;
  checkboxSelected: string;
  checkboxSelectedText: string;
  checkboxPartial: string;
  answerSelectedBackground: string;
  logoutColor: string;
  logoutButtonBackground: string;
  shadow: string;
}

interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#e0e0e0',
    primary: '#007AFF',
    secondary: '#4CAF50',
    card: '#ffffff',
    headerBackground: '#007AFF',
    headerText: '#ffffff',
    headerSubtitle: '#ffffff',
    tabActive: '#333333',
    tabInactive: 'transparent',
    tabActiveText: '#ffffff',
    tabInactiveText: '#666666',
    buttonPrimary: '#007AFF',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#e0e0e0',
    buttonSecondaryText: '#666666',
    buttonDisabled: '#e0e0e0',
    buttonDisabledText: '#999999',
    avatarBackground: '#007AFF',
    avatarText: '#ffffff',
    rankBadgeText: '#000000',
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    orange: '#FF9800',
    success: '#28a745',
    successBackground: '#d4edda',
    successText: '#155724',
    error: '#dc3545',
    errorBackground: '#f8d7da',
    errorText: '#721c24',
    warning: '#FF9800',
    warningBackground: '#fff3cd',
    warningText: '#856404',
    passBackground: '#E8F5E8',
    passText: '#4CAF50',
    failBackground: '#FFEBEE',
    failText: '#F44336',
    iconBackground: '#E3F2FD',
    checkboxBorder: '#e0e0e0',
    checkboxSelected: '#007AFF',
    checkboxSelectedText: '#ffffff',
    checkboxPartial: '#FFA500',
    answerSelectedBackground: '#E3F2FD',
    logoutColor: '#F44336',
    logoutButtonBackground: '#E3F2FD',
    shadow: '#000000',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
    border: '#333333',
    primary: '#007AFF',
    secondary: '#4CAF50',
    card: '#2A2A2A',
    headerBackground: '#1E1E1E',
    headerText: '#FFFFFF',
    headerSubtitle: '#FFFFFF',
    tabActive: '#2A2A2A',
    tabInactive: 'transparent',
    tabActiveText: '#FFFFFF',
    tabInactiveText: '#B0B0B0',
    buttonPrimary: '#007AFF',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#333333',
    buttonSecondaryText: '#B0B0B0',
    buttonDisabled: '#333333',
    buttonDisabledText: '#808080',
    avatarBackground: '#007AFF',
    avatarText: '#ffffff',
    rankBadgeText: '#000000',
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    orange: '#FF9800',
    success: '#28a745',
    successBackground: '#1e3a1e',
    successText: '#90EE90',
    error: '#dc3545',
    errorBackground: '#3a1e1e',
    errorText: '#ff6b6b',
    warning: '#FF9800',
    warningBackground: '#3a2e1e',
    warningText: '#FFB84D',
    passBackground: '#1e3a1e',
    passText: '#90EE90',
    failBackground: '#3a1e1e',
    failText: '#ff6b6b',
    iconBackground: '#1a3a5a',
    checkboxBorder: '#333333',
    checkboxSelected: '#007AFF',
    checkboxSelectedText: '#ffffff',
    checkboxPartial: '#FF9800',
    answerSelectedBackground: '#1a3a5a',
    logoutColor: '#F44336',
    logoutButtonBackground: '#1a3a5a',
    shadow: '#000000',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark'); // Default to dark

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    try {
      await AsyncStorage.setItem('theme_mode', newMode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme: Theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isDark: themeMode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

