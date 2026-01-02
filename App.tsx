import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ApolloProvider } from '@apollo/client/react';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import apolloClient from './src/lib/apollo';
import AppNavigator from './src/components/AppNavigator';

import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import { LanguageProvider } from './src/context/LanguageContext';

export default function App() {
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


