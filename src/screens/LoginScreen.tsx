import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { isRTL } = useLanguage();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!mobile.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fill_all_fields'));
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login({ mobile: mobile.trim(), password });
      
      if (!result.success) {
        Alert.alert(t('auth.login_failed'), result.error || t('auth.invalid_credentials'));
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(t('common.error'), t('common.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const currentStyles = styles(isRTL, theme);

  return (
    <KeyboardAvoidingView 
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={currentStyles.scrollContainer}>
        <View style={currentStyles.header}>
          <Text style={currentStyles.logo}>📚</Text>
          <Text style={currentStyles.title}>{t('auth.welcome_back')}</Text>
          <Text style={currentStyles.subtitle}>{t('auth.sign_in_subtitle')}</Text>
        </View>

        <View style={currentStyles.form}>
          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}>{t('auth.mobile_number')}</Text>
            <TextInput
              style={currentStyles.input}
              value={mobile}
              onChangeText={setMobile}
              placeholder={t('auth.mobile_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}>{t('auth.password')}</Text>
            <TextInput
              style={currentStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          <TouchableOpacity 
            style={[currentStyles.loginButton, isLoading && currentStyles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={currentStyles.loginButtonText}>{t('auth.sign_in')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={currentStyles.footer}>
          <Text style={currentStyles.footerText}>{t('auth.dont_have_account')} </Text>
          <TouchableOpacity onPress={onNavigateToRegister} disabled={isLoading}>
            <Text style={currentStyles.linkText}>{t('auth.sign_up')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (isRTL: boolean, theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: isRTL ? 'right' : 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: theme.colors.buttonDisabled,
  },
  loginButtonText: {
    color: theme.colors.buttonPrimaryText,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  linkText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
