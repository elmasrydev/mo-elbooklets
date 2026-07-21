import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { ModalProvider } from '../../context/ModalContext';
import { AuthProvider } from '../../context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing';
import i18n from '../../i18n';
import { I18nextProvider } from 'react-i18next';

/**
 * Screens fetch through Apollo hooks, so every render needs a client in scope.
 * Pass `apolloMocks` when a test depends on a query's result; the default empty
 * list leaves queries pending, which is what a screen sees while loading.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    routeParams = {},
    apolloMocks = [],
  }: { routeParams?: any; apolloMocks?: readonly MockedResponse[] } = {},
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <MockedProvider mocks={apolloMocks}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ModalProvider>
              <LanguageProvider initialLanguage="en">
                <I18nextProvider i18n={i18n}>
                  <AuthProvider>
                    <NavigationContainer>{children}</NavigationContainer>
                  </AuthProvider>
                </I18nextProvider>
              </LanguageProvider>
            </ModalProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </MockedProvider>
    );
  };

  return {
    ...render(ui, { wrapper }),
  };
}
