import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
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
  // Initialize from i18n directly, LanguageProvider should follow already-initialized settings
  const [language, setLanguageState] = useState<Language>((i18n.language as Language) || 'en');

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

        const shouldBeRTL = savedLang === 'ar';
        if (I18nManager.isRTL !== shouldBeRTL) {
          // Log it for transparency, but App.tsx should have handled the restart.
          // If we reach here, it means the app is running in a mismatch state
          // which the useRTL hook handles gracefully via JS-driven layouts.
          console.log(`Native RTL mismatch: current=${I18nManager.isRTL}, expected=${shouldBeRTL}`);
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

  const setLanguage = useCallback(
    async (lang: Language) => {
      try {
        if (lang === language) return;

        const performChange = async () => {
          // Save the language
          await AsyncStorage.setItem('user_language', lang);
          await i18n.changeLanguage(lang);
          setLanguageState(lang);

          const shouldBeRTL = lang === 'ar';
          // Always allow RTL capability
          I18nManager.allowRTL(true);
          // Toggle the actual direction
          I18nManager.forceRTL(shouldBeRTL);

          // Ensure AsyncStorage is flushed before restart
          setTimeout(() => {
            try {
              Updates.reloadAsync();
            } catch (e) {
              console.log('Restart failed:', e);
            }
          }, 500);
        };

        // Show confirmation alert with OK/Cancel
        Alert.alert(
          lang === 'ar' ? 'تغيير اللغة' : 'Change Language',
          lang === 'ar'
            ? 'هل تريد تغيير اللغة إلى العربية؟ سيتم إعادة تشغيل التطبيق لتطبيق التغييرات.'
            : 'Do you want to change the language to English? The app will restart to apply changes.',
          [
            {
              text: lang === 'ar' ? 'إلغاء' : 'Cancel',
              style: 'cancel',
            },
            {
              text: lang === 'ar' ? 'موافق' : 'OK',
              onPress: performChange,
            },
          ],
          { cancelable: true },
        );
      } catch (error) {
        console.error('Error setting language:', error);
      }
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      isRTL: language === 'ar', // JS-driven RTL state
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}> {children} </LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
