import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { I18nManager, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { LANGUAGE_KEY } from '../i18n';
import * as Updates from 'expo-updates';
import { useTranslation } from 'react-i18next'; // Assuming this import is needed for 't'
import { useModal } from './ModalContext'; // Assuming this path for ModalContext

type Language = 'en' | 'ar';

// Must match the key used in App.tsx bootstrap
const RTL_SYNC_ATTEMPTED_KEY = 'rtl_sync_attempted';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialLanguage,
}) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const { t } = useTranslation();
  const { showConfirm } = useModal();

  /**
   * Reload the app with RTL sync tracking.
   */
  const reloadApp = useCallback(
    async (lang: Language): Promise<void> => {
      // Mark that we're attempting an RTL sync for this language
      await AsyncStorage.setItem(RTL_SYNC_ATTEMPTED_KEY, lang);

      if (__DEV__) {
        const DevSettings = NativeModules.DevSettings;
        if (DevSettings?.reload) {
          DevSettings.reload();
        } else {
          showConfirm({
            title: t('common.reload_required', 'Reload Required'),
            message: t(
              'common.reload_manual_message',
              'Please reload the app manually to apply layout changes. (Shake device → Reload)',
            ),
            showCancel: false,
            onConfirm: () => {},
          });
        }
      } else {
        try {
          await Updates.reloadAsync();
        } catch (e) {
          console.warn('Updates.reloadAsync failed:', e);
          showConfirm({
            title: t('common.information', 'Information'),
            message: t('common.restart_app_message', 'Please restart the app to apply changes.'),
            showCancel: false,
            onConfirm: () => {},
          });
        }
      }
    },
    [showConfirm, t],
  );

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
          setTimeout(() => reloadApp(lang), 300);
        };

        // Show confirmation alert
        showConfirm({
          title: t('common.confirm_change', 'Confirm Change'),
          message: t(
            'common.confirm_language_change_message',
            'Are you sure you want to change language?',
          ),
          onConfirm: performChange,
        });
      } catch (error) {
        console.error('Error setting language:', error);
      }
    },
    [language, t, showConfirm, reloadApp],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      isRTL: language === 'ar',
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
