import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { I18nManager, Alert, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { LANGUAGE_KEY } from '../i18n';
import * as Updates from 'expo-updates';

type Language = 'en' | 'ar';

// Must match the key used in App.tsx bootstrap
const RTL_SYNC_ATTEMPTED_KEY = 'rtl_sync_attempted';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Reload the app with RTL sync tracking.
 * Sets a flag before reload so the bootstrap in App.tsx knows
 * we've already attempted the sync (prevents infinite loops in dev).
 */
const reloadApp = async (lang: Language): Promise<void> => {
  // Mark that we're attempting an RTL sync for this language
  await AsyncStorage.setItem(RTL_SYNC_ATTEMPTED_KEY, lang);

  if (__DEV__) {
    const DevSettings = NativeModules.DevSettings;
    if (DevSettings?.reload) {
      DevSettings.reload();
    } else {
      Alert.alert(
        'Reload Required',
        'Please reload the app manually to apply layout changes. (Shake device → Reload)',
      );
    }
  } else {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.warn('Updates.reloadAsync failed:', e);
      Alert.alert('Please restart the app to apply changes.');
    }
  }
};

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialLanguage,
}) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  const setLanguage = useCallback(
    async (lang: Language) => {
      try {
        if (lang === language) return;

        const performChange = async () => {
          // 1. Save preference first (must persist before reload)
          await AsyncStorage.setItem(LANGUAGE_KEY, lang);

          // 2. Update i18n language
          await i18n.changeLanguage(lang);
          setLanguageState(lang);

          // 3. Set native RTL direction
          const shouldBeRTL = lang === 'ar';
          I18nManager.allowRTL(shouldBeRTL);
          I18nManager.forceRTL(shouldBeRTL);

          // 4. Reload to apply native RTL change
          //    The Yoga layout engine only reads I18nManager.isRTL at startup.
          //    Small delay to ensure AsyncStorage write is flushed.
          setTimeout(() => reloadApp(lang), 300);
        };

        // Show confirmation alert
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
      isRTL: language === 'ar',
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={ value }> { children } </LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
