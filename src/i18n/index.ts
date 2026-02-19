import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'intl-pluralrules';

import en from './locales/en.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

export const LANGUAGE_KEY = 'user_language';

/**
 * Get the initial language for the app.
 * Priority: 1) Saved user preference  2) English (default)
 */
export const getInitialLanguage = async (): Promise<'ar' | 'en'> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved === 'ar' || saved === 'en') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read saved language:', e);
  }

  // Default to English
  return 'en';
};

/**
 * Initialize i18next with the correct language.
 * This must be called AFTER the RTL direction is set in App.tsx.
 */
export const initI18n = async (lang: 'ar' | 'en'): Promise<void> => {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: lang,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  } else if (i18n.language !== lang) {
    await i18n.changeLanguage(lang);
  }
};

export default i18n;
