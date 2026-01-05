import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../config/api';


interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const { isRTL } = useLanguage();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  const [gradesData, setGradesData] = useState<{ grades: any[] } | null>(null);
  const [systemsData, setSystemsData] = useState<{ educationalSystems: any[] } | null>(null);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [systemsLoading, setSystemsLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
    fetchSystems();
  }, []);

  const fetchGrades = async () => {
    try {
      setGradesLoading(true);
      const result = await tryFetchWithFallback(`
        query GetGrades {
          grades {
            id
            name
          }
        }
      `);
      if (result.data) {
        setGradesData(result.data);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setGradesLoading(false);
    }
  };

  const fetchSystems = async () => {
    try {
      setSystemsLoading(true);
      const result = await tryFetchWithFallback(`
        query GetSystems {
          educationalSystems {
            id
            name
          }
        }
      `);
      if (result.data) {
        setSystemsData(result.data);
      }
    } catch (error) {
      console.error('Error fetching systems:', error);
    } finally {
      setSystemsLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !mobile.trim() || !password.trim() || !selectedGrade || !selectedSystem) {
      Alert.alert(t('common.error'), t('auth.fill_all_fields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwords_not_match'));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.password_too_short'));
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        grade_id: selectedGrade,
        educational_system_id: selectedSystem,
      });
      
      if (!result.success) {
        Alert.alert(t('auth.registration_failed'), result.error || t('auth.registration_error'));
      }
      // If successful, the AuthContext will handle navigation
    } catch (error) {
      console.error('Registration error:', error);
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
          <Text style={currentStyles.title}>{t('auth.register')}</Text>
          <Text style={currentStyles.subtitle}>{t('auth.sign_up_subtitle')}</Text>
        </View>

        <View style={currentStyles.form}>
          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}>{t('auth.name')}</Text>
            <TextInput
              style={currentStyles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('auth.name_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              editable={!isLoading}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}>{t('auth.email')}</Text>
            <TextInput
              style={currentStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

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
            <Text style={currentStyles.label}>{t('more_screen.grade')}</Text>
            {gradesLoading ? (
              <View style={currentStyles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={currentStyles.loadingText}>{t('home_screen.loading_activities')}</Text>
              </View>
            ) : (
              <View style={currentStyles.pickerContainer}>
                <Picker
                  selectedValue={selectedGrade}
                  onValueChange={setSelectedGrade}
                  enabled={!isLoading}
                  style={currentStyles.picker}
                  dropdownIconColor={theme.colors.text}
                  mode="dropdown" // Use dropdown mode on Android for better scrolling
                >
                  <Picker.Item 
                    label={t('auth.select_grade')} 
                    value="" 
                  />
                  {gradesData?.grades?.map((grade: any) => (
                    <Picker.Item 
                      key={grade.id} 
                      label={grade.name} 
                      value={grade.id}
                    />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}>{t('auth.educational_system')}</Text>
            {systemsLoading ? (
              <View style={currentStyles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={currentStyles.loadingText}>{t('home_screen.loading_activities')}</Text>
              </View>
            ) : (
              <View style={currentStyles.pickerContainer}>
                <Picker
                  selectedValue={selectedSystem}
                  onValueChange={setSelectedSystem}
                  enabled={!isLoading}
                  style={currentStyles.picker}
                  dropdownIconColor={theme.colors.text}
                  mode="dropdown"
                >
                  <Picker.Item 
                    label={t('auth.select_educational_system')} 
                    value="" 
                  />
                  {systemsData?.educationalSystems?.map((system: any) => (
                    <Picker.Item 
                      key={system.id} 
                      label={system.name} 
                      value={system.id}
                    />
                  ))}
                </Picker>
              </View>
            )}
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

          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}>{t('auth.confirm_password')}</Text>
            <TextInput
              style={currentStyles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('auth.confirm_password_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          <TouchableOpacity 
            style={[currentStyles.registerButton, isLoading && currentStyles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={currentStyles.registerButtonText}>{t('auth.sign_up')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={currentStyles.footer}>
          <Text style={currentStyles.footerText}>{t('auth.already_have_account')} </Text>
          <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
            <Text style={currentStyles.linkText}>{t('auth.sign_in')}</Text>
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
    marginBottom: 30,
  },
  logo: {
    fontSize: 50,
    marginBottom: 15,
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
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  picker: {
    height: 50,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingText: {
    marginLeft: isRTL ? 0 : 10,
    marginRight: isRTL ? 10 : 0,
    color: theme.colors.textSecondary,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: theme.colors.buttonDisabled,
  },
  registerButtonText: {
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

export default RegisterScreen;
