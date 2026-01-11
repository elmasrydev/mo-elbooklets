import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { I18nManager, Platform, Alert } from 'react-native';
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
  // Initialize with the actual RTL state from I18nManager
  const [language, setLanguageState] = useState<Language>(
    I18nManager.isRTL ? 'ar' : ((i18n.language as Language) || 'en')
  );

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('user_language');
      if (savedLang === 'en' || savedLang === 'ar') {
        // Update i18n
        if (i18n.language !== savedLang) {
          await i18n.changeLanguage(savedLang);
        }
        setLanguageState(savedLang as Language);

        // Check if RTL state matches the language
        const shouldBeRTL = savedLang === 'ar';
        if (I18nManager.isRTL !== shouldBeRTL) {
          // RTL state is inconsistent - this shouldn't happen after reload
          console.log(`RTL mismatch: I18nManager.isRTL=${I18nManager.isRTL}, shouldBeRTL=${shouldBeRTL}`);
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(shouldBeRTL);
        }
      } else {
        // No saved language, sync with RTL state
        if (I18nManager.isRTL) {
          setLanguageState('ar');
          await i18n.changeLanguage('ar');
          await AsyncStorage.setItem('user_language', 'ar');
        }
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      if (lang === language) return;

      // Save the language first
      await AsyncStorage.setItem('user_language', lang);
      await i18n.changeLanguage(lang);
      setLanguageState(lang);

      const shouldBeRTL = lang === 'ar';
      
      // Only need to reload if RTL state needs to change
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(shouldBeRTL);

        // Show alert and reload
        Alert.alert(
          lang === 'ar' ? 'تغيير اللغة' : 'Language Changed',
          lang === 'ar' 
            ? 'سيتم إعادة تشغيل التطبيق لتطبيق التغييرات'
            : 'The app will restart to apply the changes',
          [
            {
              text: lang === 'ar' ? 'حسناً' : 'OK',
              onPress: async () => {
                // Small delay to ensure AsyncStorage is flushed
                setTimeout(async () => {
                  try {
                    await Updates.reloadAsync();
                  } catch (e) {
                    console.log('Updates.reloadAsync not available, language will change on next launch');
                  }
                }, 300);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    isRTL: I18nManager.isRTL, // Use actual I18nManager state
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

