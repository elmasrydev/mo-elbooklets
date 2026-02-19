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
  Image,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { tryFetchWithFallback } from '../config/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

import BackButton from '../components/navigation/BackButton';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onBack: () => void;
}

const PickerTrigger = ({ value, placeholder, icon, onPress, theme, currentStyles }: any) => (
  <TouchableOpacity 
    style={currentStyles.inputWrapper} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
    <Text style={[currentStyles.inputText, !value && { color: theme.colors.textSecondary }]}>
      {value || placeholder}
    </Text>
    <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [pickerModalVisible, setPickerModalVisible] = useState<'grade' | 'system' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const insets = useSafeAreaInsets();
  const isRTL = language === 'ar';
  const [showPassword, setShowPassword] = useState(false);

  const [gradesData, setGradesData] = useState<{ grades: any[] } | null>(null);
  const [systemsData, setSystemsData] = useState<{ educationalSystems: any[] } | null>(null);


  useEffect(() => {
    fetchGrades();
    fetchSystems();
  }, []);

  const fetchGrades = async () => {
    try {
      const result = await tryFetchWithFallback(`query GetGrades { grades { id name } }`);
      if (result.data) setGradesData(result.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } 
  };

  const fetchSystems = async () => {
    try {
      const result = await tryFetchWithFallback(
        `query GetSystems { educationalSystems { id name } }`,
      );
      if (result.data) setSystemsData(result.data);
    } catch (error) {
      console.error('Error fetching systems:', error);
    }
  };

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !mobile.trim() ||
      !password.trim() ||
      !selectedGrade ||
      !selectedSystem
    ) {
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
      if (!result.success)
        Alert.alert(t('auth.registration_failed'), result.error || t('auth.registration_error'));
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(t('common.error'), t('common.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius, isRTL);



  return (
    <KeyboardAvoidingView
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Floating Back Button */}
      <BackButton
        onPress={onBack}
        style={[
          currentStyles.backButton,
          { top: insets.top + spacing.sm },
          common.start(spacing.lg),
        ]}
        color={theme.colors.text}
      />

      <ScrollView contentContainerStyle={currentStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={currentStyles.header}>
          <Image
            source={require('../../assets/logo-icon.png')}
            style={currentStyles.logo}
            resizeMode="contain"
          />
          <Text style={currentStyles.title}>{t('auth.register')}</Text>
          <Text style={currentStyles.subtitle}>{t('auth.sign_up_subtitle')}</Text>
        </View>

        <View style={currentStyles.form}>
          <View style={currentStyles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
            <TextInput
              style={currentStyles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('auth.name_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              editable={!isLoading}
              textAlign={common.textAlign}
            />
          </View>

          <View style={currentStyles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
            <TextInput
              style={currentStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign}
            />
          </View>

          <View style={currentStyles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
            <TextInput
              style={currentStyles.input}
              value={mobile}
              onChangeText={setMobile}
              placeholder={t('auth.mobile_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign}
            />
          </View>

          <PickerTrigger 
            icon="school-outline"
            placeholder={t('auth.select_grade')}
            value={gradesData?.grades?.find((g: any) => g.id === selectedGrade)?.name}
            onPress={() => setPickerModalVisible('grade')}
            theme={theme}
            currentStyles={currentStyles}
          />

          <PickerTrigger 
            icon="book-outline"
            placeholder={t('auth.select_educational_system')}
            value={systemsData?.educationalSystems?.find((s: any) => s.id === selectedSystem)?.name}
            onPress={() => setPickerModalVisible('system')}
            theme={theme}
            currentStyles={currentStyles}
          />

          <View style={currentStyles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
            <TextInput
              style={currentStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={currentStyles.inputWrapper}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
            <TextInput
              style={currentStyles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('auth.confirm_password_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign}
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
          <Text style={currentStyles.footerText}>{t('auth.already_have_account')}</Text>
          <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
            <Text style={currentStyles.linkText}>{t('auth.sign_in')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* iOS Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={pickerModalVisible !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setPickerModalVisible(null)}
        >
          <View style={currentStyles.modalContainer}>
            <View style={currentStyles.modalContent}>
              <View style={currentStyles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setPickerModalVisible(null)}
                  style={currentStyles.modalDoneButton}
                >
                  <Text style={currentStyles.modalDoneText}> {t('common.done')} </Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={pickerModalVisible === 'grade' ? selectedGrade : selectedSystem}
                onValueChange={(itemValue) =>
                  pickerModalVisible === 'grade'
                    ? setSelectedGrade(itemValue)
                    : setSelectedSystem(itemValue)
                }
              >
                <Picker.Item
                  label={
                    pickerModalVisible === 'grade'
                      ? t('auth.select_grade')
                      : t('auth.select_educational_system')
                  }
                  value=""
                />
                {pickerModalVisible === 'grade'
                  ? gradesData?.grades?.map((grade: any) => (
                      <Picker.Item key={grade.id} label={grade.name} value={grade.id} />
                    ))
                  : systemsData?.educationalSystems?.map((system: any) => (
                      <Picker.Item key={system.id} label={system.name} value={system.id} />
                    ))}
              </Picker>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = (theme: any, common: any, fontSizes: any, spacing: any, borderRadius: any, isRTL: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContainer: { 
      flexGrow: 1, 
      paddingHorizontal: spacing.xl,
      paddingTop: 60,
      paddingBottom: spacing.xl 
    },
    header: { alignItems: 'center', marginBottom: 32 },
    logo: { width: 100, height: 100, marginBottom: 16 },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: '#0F172A',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: { 
      fontSize: fontSizes.base, 
      color: '#64748B',
      textAlign: 'center',
      fontWeight: '500'
    },
    form: { marginBottom: 24 },
    inputWrapper: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 12,
      height: 56,
    },
    inputIcon: {
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    input: {
      flex: 1,
      fontSize: fontSizes.base,
      color: '#1E293B',
      height: '100%',
    },
    inputText: {
      flex: 1,
      fontSize: fontSizes.base,
      color: '#1E293B',
      textAlign: isRTL ? 'right' : 'left',
    },
    registerButton: {
      backgroundColor: '#1E3A8A',
      borderRadius: 30,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      shadowColor: '#1E3A8A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    disabledButton: { backgroundColor: '#94A3B8' },
    registerButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
    },
    footer: { 
      flexDirection: isRTL ? 'row-reverse' : 'row', 
      justifyContent: 'center', 
      alignItems: 'center',
      marginBottom: 24,
      gap: 4,
    },
    footerText: { fontSize: fontSizes.base, color: '#64748B' },
    linkText: { 
      fontSize: fontSizes.base, 
      color: '#1E3A8A', 
      fontWeight: '700' 
    },
    backButton: {
      position: 'absolute',
      zIndex: 10,
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    modalDoneButton: {
      paddingHorizontal: 16,
    },
    modalDoneText: {
      color: '#1E3A8A',
      fontSize: 18,
      fontWeight: '700',
    },
  });

export default RegisterScreen;
