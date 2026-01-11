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

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter': require('./assets/fonts/Inter-Variable.ttf'),
    'Cairo': require('./assets/fonts/Cairo-Variable.ttf'),
  });
  const [isRTLInitialized, setIsRTLInitialized] = useState(false);
  const [needsRestart, setNeedsRestart] = useState(false);

  // Initialize RTL before rendering the app
  useEffect(() => {
    const initializeRTL = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('user_language');
        const shouldBeRTL = savedLang === 'ar';
        const currentRTL = I18nManager.isRTL;

        console.log(`RTL Init: savedLang=${savedLang}, shouldBeRTL=${shouldBeRTL}, currentRTL=${currentRTL}`);

        // Always allow RTL
        I18nManager.allowRTL(true);

        // Check if there's a mismatch between saved language and current RTL state
        if (savedLang && currentRTL !== shouldBeRTL) {
          // Set the RTL state - this takes effect on next restart
          I18nManager.forceRTL(shouldBeRTL);
          console.log('RTL mismatch detected, forcing RTL to:', shouldBeRTL);
          // The app will restart via Updates.reloadAsync in LanguageContext if needed
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider>
          <LanguageProvider>
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
