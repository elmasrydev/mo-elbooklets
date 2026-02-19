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
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [parentMobile2, setParentMobile2] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { register } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const insets = useSafeAreaInsets();
  const isRTL = language === 'ar';

  const [gradesData, setGradesData] = useState<{ grades: any[] } | null>(null);
  const [systemsData, setSystemsData] = useState<{ educationalSystems: any[] } | null>(null);

  const messages = {
    no_referral: t('auth.no_referral_disclaimer', 'You are now going to sign up without referral code and will have Trial Limited Access only'),
    limit_reached: t('auth.limit_reached_disclaimer', 'The referral code you are using has exceeded its Free Access Limit and you will have Trial Limited Access only')
  };

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

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!name.trim() || !email.trim() || !gender || !schoolName.trim()) {
          Alert.alert(t('common.error'), t('auth.fill_all_fields'));
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          Alert.alert(t('common.error'), t('auth.invalid_email'));
          return false;
        }
        return true;
      case 2:
        if (!selectedGrade || !selectedSystem) {
          Alert.alert(t('common.error'), t('auth.fill_all_fields'));
          return false;
        }
        return true;
      case 3:
        if (!mobile.trim() || !password.trim()) {
          Alert.alert(t('common.error'), t('auth.fill_all_fields'));
          return false;
        }
        if (password !== confirmPassword) {
          Alert.alert(t('common.error'), t('auth.passwords_not_match'));
          return false;
        }
        if (password.length < 8) {
          Alert.alert(t('common.error'), t('auth.password_too_short'));
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleRegister();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleRegister = async () => {
    if (!parentMobile.trim()) {
      Alert.alert(t('common.error'), t('auth.parent_mobile_required', 'Parent mobile number is required'));
      return;
    }

    if (!promoCode.trim()) {
      setModalMessage(messages.no_referral);
      setShowModal(true);
      return;
    }

    confirmRegistration();
  };

  const confirmRegistration = async () => {
    setShowModal(false);
    setIsLoading(true);
    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        gender,
        school_name: schoolName.trim(),
        parent_mobile: parentMobile.trim(),
        parent_mobile_2: parentMobile2.trim(),
        password,
        grade_id: selectedGrade,
        educational_system_id: selectedSystem,
        promo_code: promoCode.trim(),
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

  const StepIndicator = () => (
    <View style={currentStyles.stepIndicatorContainer}>
      <View style={currentStyles.stepDots}>
        {[1, 2, 3, 4].map((s) => (
          <View 
            key={s} 
            style={[
              currentStyles.stepDot, 
              s === currentStep && currentStyles.stepDotActive,
              s < currentStep && currentStyles.stepDotCompleted
            ]} 
          />
        ))}
      </View>
      <Text style={currentStyles.stepText}>{t('auth.step_x_of_y', { current: currentStep, total: 4 })}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Back Button */}
      <BackButton
        onPress={handleBack}
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
          <StepIndicator />
          <Text style={currentStyles.title}>
            {currentStep === 1 && t('auth.personal_info', 'Personal Info')}
            {currentStep === 2 && t('auth.select_grade_title', 'Select Your Grade')}
            {currentStep === 3 && t('auth.login_info', 'Login Info')}
            {currentStep === 4 && t('auth.parent_data', 'Parent Data')}
          </Text>
        </View>

        <View style={currentStyles.form}>
          {currentStep === 1 && (
            <>
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

              <View style={currentStyles.genderContainer}>
                <Text style={currentStyles.sectionLabel}>{t('auth.gender')}</Text>
                <View style={currentStyles.genderRow}>
                  <TouchableOpacity
                    style={[currentStyles.genderButton, gender === 'male' && currentStyles.genderButtonActive]}
                    onPress={() => setGender('male')}
                  >
                    <Text style={currentStyles.genderEmoji}>👦</Text>
                    <Text style={[currentStyles.genderText, gender === 'male' && currentStyles.genderTextActive]}>
                      {t('auth.boy')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[currentStyles.genderButton, gender === 'female' && currentStyles.genderButtonActive]}
                    onPress={() => setGender('female')}
                  >
                    <Text style={currentStyles.genderEmoji}>👧</Text>
                    <Text style={[currentStyles.genderText, gender === 'female' && currentStyles.genderTextActive]}>
                      {t('auth.girl')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={currentStyles.inputWrapper}>
                <Ionicons name="business-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
                <TextInput
                  style={currentStyles.input}
                  value={schoolName}
                  onChangeText={setSchoolName}
                  placeholder={t('auth.school_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  editable={!isLoading}
                  textAlign={common.textAlign}
                />
              </View>
            </>
          )}

          {currentStep === 2 && (
            <>
              <View style={currentStyles.gridContainer}>
                {gradesData?.grades?.map((grade: any) => (
                  <TouchableOpacity 
                    key={grade.id}
                    style={[
                      currentStyles.gridItem,
                      selectedGrade === grade.id && currentStyles.gridItemActive
                    ]}
                    onPress={() => setSelectedGrade(grade.id)}
                  >
                    <Text style={[
                      currentStyles.gridItemText,
                      selectedGrade === grade.id && currentStyles.gridItemTextActive
                    ]}>
                      {grade.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={currentStyles.sectionTitle}>{t('auth.select_curriculum_type', 'Select Curriculum Type')}</Text>
              <View style={currentStyles.systemsContainer}>
                {systemsData?.educationalSystems?.map((system: any) => (
                  <TouchableOpacity 
                    key={system.id}
                    style={[
                      currentStyles.systemCard,
                      selectedSystem === system.id && currentStyles.systemCardActive
                    ]}
                    onPress={() => setSelectedSystem(system.id)}
                  >
                    <Text style={[
                      currentStyles.systemCardText,
                      selectedSystem === system.id && currentStyles.systemCardTextActive
                    ]}>
                      {system.name}
                    </Text>
                    {selectedSystem === system.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#1E3A8A" style={currentStyles.checkIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {currentStep === 3 && (
            <>
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
            </>
          )}

          {currentStep === 4 && (
            <>
              <View style={currentStyles.inputWrapper}>
                <Ionicons name="people-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
                <TextInput
                  style={currentStyles.input}
                  value={parentMobile}
                  onChangeText={setParentMobile}
                  placeholder={t('auth.parent_mobile_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                  textAlign={common.textAlign}
                />
              </View>

              <View style={currentStyles.inputWrapper}>
                <Ionicons name="people-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
                <TextInput
                  style={currentStyles.input}
                  value={parentMobile2}
                  onChangeText={setParentMobile2}
                  placeholder={t('auth.second_parent_mobile')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                  textAlign={common.textAlign}
                />
              </View>

              <View style={currentStyles.inputWrapper}>
                <Ionicons name="gift-outline" size={20} color={theme.colors.textSecondary} style={currentStyles.inputIcon} />
                <TextInput
                  style={currentStyles.input}
                  value={promoCode}
                  onChangeText={setPromoCode}
                  placeholder={t('auth.promo_code_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="characters"
                  editable={!isLoading}
                  textAlign={common.textAlign}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[currentStyles.registerButton, isLoading && currentStyles.disabledButton]}
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={currentStyles.registerButtonText}>
                {currentStep === 4 ? t('auth.sign_up') : t('common.continue', 'Continue')}
              </Text>
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

      {/* Registration Disclaimer Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={currentStyles.disclaimerOverlay}>
          <View style={currentStyles.disclaimerContent}>
            <View style={currentStyles.disclaimerIconContainer}>
              <Ionicons name="warning" size={32} color="#D97706" />
            </View>
            <Text style={currentStyles.disclaimerTitle}>{t('auth.disclaimer_title', 'Registration Disclaimer')}</Text>
            <Text style={currentStyles.disclaimerMessage}>{modalMessage}</Text>
            
            <View style={currentStyles.disclaimerActions}>
              <TouchableOpacity style={currentStyles.confirmButton} onPress={confirmRegistration}>
                <Text style={currentStyles.confirmButtonText}>{t('auth.continue_registration', 'Continue Registration')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={currentStyles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={currentStyles.cancelButtonText}>{t('common.go_back', 'Go Back')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    stepIndicatorContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    stepDots: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    stepDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#E2E8F0',
    },
    stepDotActive: {
      backgroundColor: '#1E3A8A',
      width: 24,
    },
    stepDotCompleted: {
      backgroundColor: '#94A3B8',
    },
    stepText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#64748B',
    },
    gridContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    gridItem: {
      width: '31%',
      backgroundColor: '#FFF',
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      borderRadius: 16,
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    gridItemActive: {
      borderColor: '#1E3A8A',
      backgroundColor: 'rgba(30, 58, 138, 0.05)',
      elevation: 0,
    },
    gridItemText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#64748B',
    },
    gridItemTextActive: {
      color: '#1E3A8A',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#0F172A',
      marginTop: 8,
      marginBottom: 16,
      textAlign: isRTL ? 'right' : 'left',
    },
    systemsContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    systemCard: {
      width: '48%',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#FFF',
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      borderRadius: 16,
      justifyContent: 'center',
      position: 'relative',
    },
    systemCardActive: {
      borderColor: '#1E3A8A',
      backgroundColor: 'rgba(30, 58, 138, 0.05)',
    },
    systemCardText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#64748B',
      textAlign: 'center',
    },
    systemCardTextActive: {
      color: '#1E3A8A',
    },
    checkIcon: {
      position: 'absolute',
      top: 8,
      right: isRTL ? undefined : 8,
      left: isRTL ? 8 : undefined,
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
    genderContainer: {
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
    },
    genderRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 12,
    },
    genderButton: {
      flex: 1,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFF',
      borderWidth: 2,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      height: 56,
      gap: 8,
    },
    genderButtonActive: {
      borderColor: '#1E3A8A',
      backgroundColor: 'rgba(30, 58, 138, 0.05)',
    },
    genderEmoji: {
      fontSize: 20,
    },
    genderText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#64748B',
    },
    genderTextActive: {
      color: '#1E3A8A',
    },
    disclaimerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    disclaimerContent: {
      backgroundColor: '#FFF',
      width: '100%',
      maxWidth: 400,
      borderRadius: 32,
      padding: 32,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    disclaimerIconContainer: {
      width: 64,
      height: 64,
      backgroundColor: '#FEF3C7',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    disclaimerTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: '#0F172A',
      textAlign: 'center',
      marginBottom: 8,
    },
    disclaimerMessage: {
      fontSize: 14,
      fontWeight: '700',
      color: '#64748B',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
    },
    disclaimerActions: {
      width: '100%',
      gap: 12,
    },
    confirmButton: {
      width: '100%',
      height: 56,
      backgroundColor: '#1E3A8A',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#1E3A8A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    confirmButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '900',
    },
    cancelButton: {
      width: '100%',
      height: 56,
      backgroundColor: '#F1F5F9',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButtonText: {
      color: '#64748B',
      fontSize: 16,
      fontWeight: '900',
    },
  });

export default RegisterScreen;
