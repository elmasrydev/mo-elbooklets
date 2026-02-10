import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ApolloProvider } from '@apollo/client/react';
import { View, ActivityIndicator, StyleSheet, I18nManager } from 'react-native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import apolloClient from './src/lib/apollo';
import AppNavigator from './src/components/AppNavigator';

import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import { LanguageProvider } from './src/context/LanguageContext';

import * as Updates from 'expo-updates';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter': require('./assets/fonts/Inter-Variable.ttf'),
    'Cairo': require('./assets/fonts/Cairo-Variable.ttf'),
  });
  const [isRTLInitialized, setIsRTLInitialized] = useState(false);

  // Initialize RTL before rendering the app
  useEffect(() => {
    const initializeRTL = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('user_language');
        const shouldBeRTL = savedLang === 'ar';
        const currentRTL = I18nManager.isRTL;

        // console.log(`RTL Init: savedLang=${savedLang}, shouldBeRTL=${shouldBeRTL}, currentRTL=${currentRTL}`);

        // Sync with saved language state
        if (savedLang && currentRTL !== shouldBeRTL) {
          console.log(`RTL mismatch detected: native=${currentRTL}, saved=${shouldBeRTL}. Aligning Native Engine...`);

          // STRICT MODE RESTORED:
          // We must DISALLOW RTL (allowRTL(false)) to strictly force LTR on some engines/versions.
          // Simply calling forceRTL(false) while allowRTL(true) might respect device locale over override.
          I18nManager.allowRTL(shouldBeRTL);
          I18nManager.forceRTL(shouldBeRTL);

          // Force a restart to ensure native layer (Yoga engine) is correct
          setTimeout(() => {
            try {
              Updates.reloadAsync();
            } catch (e) {
              console.log('Boot restart failed:', e);
              setIsRTLInitialized(true);
            }
          }, 300);
          return;
        } else if (!savedLang) {
          // First run: Default to allowRTL(true) to respect device settings
          I18nManager.allowRTL(true);
        } else {
          // Consistent state: Enforce strict mode to prevent drift
          I18nManager.allowRTL(shouldBeRTL);
          I18nManager.forceRTL(shouldBeRTL);
        }
      } catch (error) {
        console.error('Error initializing RTL:', error);
      } finally {
        setIsRTLInitialized(true);
      }
    };

    initializeRTL();
  }, []);

  // Show loading screen while fonts and RTL are loading
  if (!fontsLoaded || !isRTLInitialized) {
    return (
      <View style= { styles.loadingContainer } >
      <ActivityIndicator size="large" color = "#10b981" />
        </View>
    );
  }

  return (
    <SafeAreaProvider>
    <ApolloProvider client= { apolloClient } >
    <ThemeProvider>
    <LanguageProvider>
    <I18nextProvider i18n={ i18n }>
      <AuthProvider>
      <NavigationContainer>
      <AppNavigator />
      </NavigationContainer>
      </AuthProvider>
      </I18nextProvider>
      </LanguageProvider>
      </ThemeProvider>
      </ApolloProvider>
      < StatusBar style = "auto" />
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
