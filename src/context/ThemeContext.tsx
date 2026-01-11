import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorTheme, getColorPalette, DEFAULT_COLOR_THEME, ColorPalette } from '../config/colors';
import { fontSizes, spacing, borderRadius, fontFamilies } from '../config/fonts';

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
  // Primary color palette
  primary50: string;
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string;
  primary600: string;
  primary700: string;
  primary800: string;
  primary900: string;
  primaryLight: string;
}

interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  fonts: typeof fontFamilies;
  fontSizes: typeof fontSizes;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
}

// Generate theme colors based on mode and color palette
const generateThemeColors = (mode: ThemeMode, palette: ColorPalette): ThemeColors => {
  if (mode === 'light') {
    return {
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#333333',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#e0e0e0',
      primary: palette.primary500,
      secondary: '#4CAF50',
      card: '#ffffff',
      headerBackground: palette.primary500,
      headerText: '#ffffff',
      headerSubtitle: '#ffffff',
      tabActive: '#333333',
      tabInactive: 'transparent',
      tabActiveText: '#ffffff',
      tabInactiveText: '#666666',
      buttonPrimary: palette.primary500,
      buttonPrimaryText: '#ffffff',
      buttonSecondary: '#e0e0e0',
      buttonSecondaryText: '#666666',
      buttonDisabled: '#e0e0e0',
      buttonDisabledText: '#999999',
      avatarBackground: palette.primary500,
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
      iconBackground: palette.primary100,
      checkboxBorder: '#e0e0e0',
      checkboxSelected: palette.primary500,
      checkboxSelectedText: '#ffffff',
      checkboxPartial: '#FFA500',
      answerSelectedBackground: palette.primary100,
      logoutColor: '#F44336',
      logoutButtonBackground: palette.primary100,
      shadow: '#000000',
      // Primary palette colors
      primary50: palette.primary50,
      primary100: palette.primary100,
      primary200: palette.primary200,
      primary300: palette.primary300,
      primary400: palette.primary400,
      primary500: palette.primary500,
      primary600: palette.primary600,
      primary700: palette.primary700,
      primary800: palette.primary800,
      primary900: palette.primary900,
      primaryLight: palette.primary100,
    };
  } else {
    // Dark mode
    return {
      background: '#020617', // Slate 950 (Dark Navy)
      surface: '#0f172a',    // Slate 900
      text: '#f8fafc',       // Slate 50
      textSecondary: '#94a3b8', // Slate 400
      textTertiary: '#64748b',  // Slate 500
      border: '#1e293b',     // Slate 800
      primary: palette.primary500,
      secondary: '#10b981',
      card: '#1e293b',       // Slate 800
      headerBackground: '#020617',
      headerText: '#f8fafc',
      headerSubtitle: '#94a3b8',
      tabActive: '#1e293b',
      tabInactive: 'transparent',
      tabActiveText: '#f8fafc',
      tabInactiveText: '#64748b',
      buttonPrimary: palette.primary500,
      buttonPrimaryText: '#ffffff',
      buttonSecondary: '#333333',
      buttonSecondaryText: '#B0B0B0',
      buttonDisabled: '#333333',
      buttonDisabledText: '#808080',
      avatarBackground: palette.primary500,
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
      iconBackground: palette.primary900,
      checkboxBorder: '#333333',
      checkboxSelected: palette.primary500,
      checkboxSelectedText: '#ffffff',
      checkboxPartial: '#FF9800',
      answerSelectedBackground: palette.primary900,
      logoutColor: '#F44336',
      logoutButtonBackground: palette.primary900,
      shadow: '#000000',
      // Primary palette colors
      primary50: palette.primary50,
      primary100: palette.primary100,
      primary200: palette.primary200,
      primary300: palette.primary300,
      primary400: palette.primary400,
      primary500: palette.primary500,
      primary600: palette.primary600,
      primary700: palette.primary700,
      primary800: palette.primary800,
      primary900: palette.primary900,
      primaryLight: palette.primary900,
    };
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light'); // Default to light
  const [currentColorTheme, setCurrentColorTheme] = useState<ColorTheme>(DEFAULT_COLOR_THEME);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedTheme, savedColorTheme] = await Promise.all([
          AsyncStorage.getItem('theme_mode'),
          AsyncStorage.getItem('color_theme'),
        ]);
        
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeMode(savedTheme);
        }
        
        if (savedColorTheme && ['green', 'purple', 'blue', 'orange'].includes(savedColorTheme)) {
          setCurrentColorTheme(savedColorTheme as ColorTheme);
        }
      } catch (error) {
        console.error('Error loading theme preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode((prevMode) => {
      const newMode: ThemeMode = prevMode === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem('theme_mode', newMode).catch((error) => {
        console.error('Error saving theme mode:', error);
      });
      return newMode;
    });
  }, []);

  const setColorTheme = useCallback((newColorTheme: ColorTheme) => {
    setCurrentColorTheme(newColorTheme);
    AsyncStorage.setItem('color_theme', newColorTheme).catch((error) => {
      console.error('Error saving color theme:', error);
    });
  }, []);

  // Generate theme based on current mode and color theme
  const theme = useMemo<Theme>(() => {
    const palette = getColorPalette(currentColorTheme);
    const themeColors = generateThemeColors(themeMode, palette);
    return {
      mode: themeMode,
      colors: themeColors,
    };
  }, [themeMode, currentColorTheme]);

  const contextValue = useMemo<ThemeContextType>(() => ({
    theme,
    toggleTheme,
    isDark: themeMode === 'dark',
    colorTheme: currentColorTheme,
    setColorTheme,
    fonts: fontFamilies,
    fontSizes,
    spacing,
    borderRadius,
  }), [theme, toggleTheme, themeMode, currentColorTheme, setColorTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
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
