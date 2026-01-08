import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import * as Updates from 'expo-updates';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(i18n.language as Language || 'en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('user_language');
      if (savedLang === 'en' || savedLang === 'ar') {
        if (i18n.language !== savedLang) {
          await i18n.changeLanguage(savedLang);
        }
        setLanguageState(savedLang as Language);
        
        const isAR = savedLang === 'ar';
        if (I18nManager.isRTL !== isAR) {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(isAR);
        }
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      if (lang === language) return;

      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem('user_language', lang);
      setLanguageState(lang);

      const isAR = lang === 'ar';
      if (I18nManager.isRTL !== isAR) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(isAR);
        
        // Reload the app to apply RTL changes
        setTimeout(() => {
          Updates.reloadAsync();
        }, 500);
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    isRTL: language === 'ar',
  }), [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
