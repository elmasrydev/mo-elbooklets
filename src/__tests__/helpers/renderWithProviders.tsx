import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { ModalProvider } from '../../context/ModalContext';
import { AuthProvider } from '../../context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import i18n from '../../i18n';
import { I18nextProvider } from 'react-i18next';

export function renderWithProviders(
  ui: React.ReactElement,
  { routeParams = {} }: { routeParams?: any } = {},
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
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
    );
  };

  return {
    ...render(ui, { wrapper }),
  };
}
