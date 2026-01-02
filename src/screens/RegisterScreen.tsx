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
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

// Temporary mock grades
interface Grade {
  id: string;
  name: string;
}

const mockGrades: Grade[] = [
  { id: '1', name: 'Grade 1' },
  { id: '2', name: 'Grade 2' },
  { id: '3', name: 'Grade 3' },
  { id: '4', name: 'Grade 4' },
  { id: '5', name: 'Grade 5' },
];

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
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();

  // Use mock data for now
  const gradesData = { grades: mockGrades };
  const gradesLoading = false;

  const handleRegister = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !mobile.trim() || !password.trim() || !selectedGrade) {
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
      });
      
      if (!result.success) {
        Alert.alert(t('auth.registration_failed'), result.error || t('auth.registration_error'));
      }
      // If successful, the AuthContext will handle navigation
    } catch (error) {
      Alert.alert(t('common.error'), t('common.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const currentStyles = styles(isRTL);

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
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={currentStyles.loadingText}>{t('home_screen.loading_activities')}</Text>
              </View>
            ) : (
              <View style={currentStyles.pickerContainer}>
                <Picker
                  selectedValue={selectedGrade}
                  onValueChange={setSelectedGrade}
                  enabled={!isLoading}
                  style={currentStyles.picker}
                >
                  <Picker.Item label={t('auth.select_grade')} value="" />
                  {gradesData?.grades?.map((grade: Grade) => (
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
            <Text style={currentStyles.label}>{t('auth.password')}</Text>
            <TextInput
              style={currentStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password_placeholder')}
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

const styles = (isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
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
    color: '#333333',
    marginBottom: 8,
    textAlign: isRTL ? 'right' : 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  loadingText: {
    marginLeft: isRTL ? 0 : 10,
    marginRight: isRTL ? 10 : 0,
    color: '#666666',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  registerButtonText: {
    color: '#ffffff',
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
    color: '#666666',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default RegisterScreen;
