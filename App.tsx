import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ApolloProvider } from '@apollo/client/react';
import { View, ActivityIndicator, StyleSheet, I18nManager, NativeModules } from 'react-native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import apolloClient from './src/lib/apollo';
import AppNavigator from './src/components/AppNavigator';

import { I18nextProvider } from 'react-i18next';
import i18n, { getInitialLanguage, initI18n, LANGUAGE_KEY } from './src/i18n';
import { LanguageProvider } from './src/context/LanguageContext';

import * as Updates from 'expo-updates';

type Language = 'ar' | 'en';

// Key to track whether we've already attempted an RTL sync + reload.
// This prevents infinite reload loops in development where DevSettings.reload()
// only reloads JS but doesn't restart the native Activity (so I18nManager.isRTL
// remains unchanged even after forceRTL).
const RTL_SYNC_ATTEMPTED_KEY = 'rtl_sync_attempted';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter: require('./assets/fonts/Inter-Variable.ttf'),
    Cairo: require('./assets/fonts/Cairo-Variable.ttf'),
    'Inter-Regular': require('./assets/fonts/static/Inter-Regular.ttf'),
    'Inter-Medium': require('./assets/fonts/static/Inter-Medium.ttf'),
    'Inter-SemiBold': require('./assets/fonts/static/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/static/Inter-Bold.ttf'),
    'Cairo-Regular': require('./assets/fonts/static/Cairo-Regular.ttf'),
    'Cairo-Medium': require('./assets/fonts/static/Cairo-Medium.ttf'),
    'Cairo-SemiBold': require('./assets/fonts/static/Cairo-SemiBold.ttf'),
    'Cairo-Bold': require('./assets/fonts/static/Cairo-Bold.ttf'),
  });
  const [appReady, setAppReady] = useState(false);
  const [initialLanguage, setInitialLanguage] = useState<Language>('en');

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Step 1: Determine what language should be active
        const lang = await getInitialLanguage();
        const shouldBeRTL = lang === 'ar';
        const currentNativeRTL = I18nManager.isRTL;

        console.log(
          `[App] Bootstrap: lang=${lang}, shouldBeRTL=${shouldBeRTL}, nativeRTL=${currentNativeRTL}`,
        );

        // Step 2: If native RTL doesn't match desired language → fix & reload
        if (currentNativeRTL !== shouldBeRTL) {
          // Check if we've already attempted the sync to prevent infinite loops.
          // In dev, DevSettings.reload() only reloads JS — isRTL stays the same.
          const syncAttempted = await AsyncStorage.getItem(RTL_SYNC_ATTEMPTED_KEY);

          if (syncAttempted === lang) {
            // We already tried to sync for this language but the native layer
            // didn't restart properly (common in dev mode).
            // Proceed anyway — the useRTL hook will handle the mismatch via JS.
            console.log(
              `[App] RTL sync already attempted for "${lang}" — proceeding with JS-driven RTL.`,
            );
            // Clear the flag so next time we can try again
            await AsyncStorage.removeItem(RTL_SYNC_ATTEMPTED_KEY);
          } else {
            // First time detecting this mismatch — attempt to fix it
            console.log('[App] RTL mismatch detected — syncing and reloading...');

            // Mark that we've attempted this sync
            await AsyncStorage.setItem(RTL_SYNC_ATTEMPTED_KEY, lang);
            // Save the language so it persists through the reload
            await AsyncStorage.setItem(LANGUAGE_KEY, lang);

            I18nManager.allowRTL(shouldBeRTL);
            I18nManager.forceRTL(shouldBeRTL);

            // Reload the native layer so Yoga engine picks up the new direction.
            setTimeout(async () => {
              if (__DEV__) {
                const DevSettings = NativeModules.DevSettings;
                if (DevSettings?.reload) {
                  DevSettings.reload();
                }
              } else {
                try {
                  await Updates.reloadAsync();
                } catch (e) {
                  console.warn('[App] Reload failed:', e);
                }
              }
            }, 200);

            // Don't setAppReady since we're about to reload
            return;
          }
        } else {
          // RTL is in sync — clear any pending sync flag
          await AsyncStorage.removeItem(RTL_SYNC_ATTEMPTED_KEY);
        }

        // Step 3: Ensure RTL stays locked to prevent drift
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);

        // Step 4: Initialize i18next with the correct language
        await initI18n(lang);

        // Step 5: Ready to render
        setInitialLanguage(lang);
        setAppReady(true);
      } catch (error) {
        console.error('[App] Bootstrap error:', error);
        // Fallback: try to show the app anyway
        await initI18n('en');
        setInitialLanguage('en');
        setAppReady(true);
      }
    };

    bootstrap();
  }, []);

  // Show loading screen while fonts and i18n are loading
  if (!fontsLoaded || !appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider>
          <LanguageProvider initialLanguage={initialLanguage}>
            <I18nextProvider i18n={i18n}>
              <AuthProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </AuthProvider>
            </I18nextProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ApolloProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
