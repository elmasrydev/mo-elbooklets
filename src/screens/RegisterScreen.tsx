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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { tryFetchWithFallback, PRIMARY_API_URL } from '../config/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';

import BackButton from '../components/navigation/BackButton';
import AppButton from '../components/AppButton';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onBack: () => void;
}

const PickerTrigger = ({ value, placeholder, icon, onPress, theme, currentStyles }: any) => (
  <TouchableOpacity style={currentStyles.inputWrapper} onPress={onPress} activeOpacity={0.7}>
    <Ionicons
      name={icon}
      size={20}
      color={theme.colors.textSecondary}
      style={currentStyles.inputIcon}
    />
    <Text style={[currentStyles.inputText, !value && { color: theme.colors.textSecondary }]}>
      {value || placeholder}
    </Text>
    <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [countryCode, setCountryCode] = useState('+2');
  const [parentCountryCode, setParentCountryCode] = useState('+2');
  const [parentCountryCode2, setParentCountryCode2] = useState('+2');

  const MOBILE_REGEX = /^01[0125][0-9]{8}$/;
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
  const { typography } = useTypography();
  const isRTL = language === 'ar';

  const [gradesData, setGradesData] = useState<{ grades: any[] } | null>(null);
  const [systemsData, setSystemsData] = useState<{ educationalSystems: any[] } | null>(null);

  const messages = {
    no_referral: t(
      'auth.no_referral_disclaimer',
      'You are now going to sign up without referral code and will have Trial Limited Access only',
    ),
    limit_reached: t(
      'auth.limit_reached_disclaimer',
      'The referral code you are using has exceeded its Free Access Limit and you will have Trial Limited Access only',
    ),
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

  const [schoolResults, setSchoolResults] = useState<any[]>([]);
  const [isSearchingSchools, setIsSearchingSchools] = useState(false);
  const [showSchoolResults, setShowSchoolResults] = useState(false);
  const [skipNextSearch, setSkipNextSearch] = useState(false);

  useEffect(() => {
    if (skipNextSearch) {
      setSkipNextSearch(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (schoolName.length >= 2 && !isLoading) {
        searchSchools(schoolName);
      } else {
        setSchoolResults([]);
        setShowSchoolResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [schoolName]);

  const searchSchools = async (query: string) => {
    setIsSearchingSchools(true);
    try {
      const baseUrl = PRIMARY_API_URL.replace('/graphql', '');
      const response = await fetch(`${baseUrl}/schools-search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSchoolResults(data);
      setShowSchoolResults(data.length > 0);
    } catch (error) {
      console.error('Error searching schools:', error);
    } finally {
      setIsSearchingSchools(false);
    }
  };

  const selectSchool = (school: any) => {
    const selectedName = language === 'ar' ? school.name : school.name_en || school.name;
    setSkipNextSearch(true);
    setSchoolName(selectedName);
    setSchoolResults([]);
    setShowSchoolResults(false);
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1: {
        if (!name.trim() || !email.trim() || !gender || !schoolName.trim()) {
          Alert.alert(t('common.error'), t('auth.fill_all_fields'));
          return false;
        }
        if (name.trim().length < 3) {
          Alert.alert(t('common.error'), t('auth.name_too_short', 'Name is too short'));
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          Alert.alert(t('common.error'), t('auth.invalid_email'));
          return false;
        }
        return true;
      }
      case 2:
        if (!selectedGrade || !selectedSystem) {
          Alert.alert(t('common.error'), t('auth.fill_all_fields'));
          return false;
        }
        return true;
      case 3:
        if (!mobile.trim() || !password.trim() || !confirmPassword.trim()) {
          Alert.alert(t('common.error'), t('auth.fill_all_fields'));
          return false;
        }
        if (!MOBILE_REGEX.test(mobile.trim())) {
          Alert.alert(
            t('common.error'),
            t(
              'auth.invalid_mobile_format',
              'The mobile number must be 11 digits starting with 010, 011, 012 or 015.',
            ),
          );
          return false;
        }
        if (password.length < 8) {
          Alert.alert(t('common.error'), t('auth.password_too_short'));
          return false;
        }
        if (password !== confirmPassword) {
          Alert.alert(t('common.error'), t('auth.passwords_not_match'));
          return false;
        }
        return true;
      case 4:
        if (!parentMobile.trim()) {
          Alert.alert(t('common.error'), t('auth.parent_mobile_required'));
          return false;
        }
        if (!MOBILE_REGEX.test(parentMobile.trim())) {
          Alert.alert(
            t('common.error'),
            t(
              'auth.invalid_mobile_format',
              'The mobile number must be 11 digits starting with 010, 011, 012 or 015.',
            ),
          );
          return false;
        }
        if (parentMobile2.trim() && !MOBILE_REGEX.test(parentMobile2.trim())) {
          Alert.alert(
            t('common.error'),
            t(
              'auth.invalid_mobile_format',
              'The mobile number must be 11 digits starting with 010, 011, 012 or 015.',
            ),
          );
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
      Alert.alert(
        t('common.error'),
        t('auth.parent_mobile_required', 'Parent mobile number is required'),
      );
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
        country_code: countryCode,
        gender,
        school_name: schoolName.trim(),
        parent_mobile: parentMobile.trim(),
        parent_country_code: parentCountryCode,
        parent_mobile_2: parentMobile2.trim(),
        parent_country_code_2: parentCountryCode2,
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

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius, isRTL, typography);

  const StepIndicator = () => (
    <View style={currentStyles.stepIndicatorContainer}>
      <View style={currentStyles.stepDots}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              currentStyles.stepDot,
              s === currentStep && currentStyles.stepDotActive,
              s < currentStep && currentStyles.stepDotCompleted,
            ]}
          />
        ))}
      </View>
      <Text style={currentStyles.stepText}>
        {t('auth.step_x_of_y', { current: currentStep, total: 4 })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={currentStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackButton
        onPress={handleBack}
        style={[
          currentStyles.backButton,
          { top: insets.top + spacing.sm },
          common.start(spacing.lg),
        ]}
        color={theme.colors.text}
      />

      <ScrollView
        contentContainerStyle={currentStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
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
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('auth.name_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={currentStyles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.email_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={currentStyles.genderContainer}>
                <Text style={currentStyles.sectionLabel}> {t('auth.gender')} </Text>
                <View style={currentStyles.genderRow}>
                  <TouchableOpacity
                    style={[
                      currentStyles.genderButton,
                      gender === 'male' && currentStyles.genderButtonActive,
                    ]}
                    onPress={() => setGender('male')}
                  >
                    <Text style={currentStyles.genderEmoji}>👦</Text>
                    <Text
                      style={[
                        currentStyles.genderText,
                        gender === 'male' && currentStyles.genderTextActive,
                      ]}
                    >
                      {t('auth.boy')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      currentStyles.genderButton,
                      gender === 'female' && currentStyles.genderButtonActive,
                    ]}
                    onPress={() => setGender('female')}
                  >
                    <Text style={currentStyles.genderEmoji}>👧</Text>
                    <Text
                      style={[
                        currentStyles.genderText,
                        gender === 'female' && currentStyles.genderTextActive,
                      ]}
                    >
                      {t('auth.girl')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={currentStyles.inputWrapper}>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={schoolName}
                  onChangeText={(text) => {
                    setSchoolName(text);
                    if (text.length < 2) {
                      setShowSchoolResults(false);
                    }
                  }}
                  placeholder={t('auth.school_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {isSearchingSchools && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                    style={{ marginRight: 8 }}
                  />
                )}
              </View>

              {/* School Autocomplete Results */}
              {showSchoolResults && schoolResults.length > 0 && (
                <View style={currentStyles.autocompleteContainer}>
                  {schoolResults.map((school) => (
                    <TouchableOpacity
                      key={school.id}
                      style={currentStyles.autocompleteItem}
                      onPress={() => selectSchool(school)}
                    >
                      <View style={currentStyles.schoolResultInfo}>
                        <Text style={currentStyles.schoolResultName}>
                          {school.name}
                          {school.name_en ? ` - ${school.name_en}` : ''}
                        </Text>
                        <Text style={currentStyles.schoolResultMeta}>
                          {school.governorate} {school.area ? `• ${school.area}` : ''}
                        </Text>
                      </View>
                      {school.is_verified && (
                        <Ionicons name="checkmark-circle" size={16} color="#059669" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
                      selectedGrade === grade.id && currentStyles.gridItemActive,
                    ]}
                    onPress={() => setSelectedGrade(grade.id)}
                  >
                    <Text
                      style={[
                        currentStyles.gridItemText,
                        selectedGrade === grade.id && currentStyles.gridItemTextActive,
                      ]}
                    >
                      {grade.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={currentStyles.sectionTitle}>
                {t('auth.select_curriculum_type', 'Select Curriculum Type')}
              </Text>
              <View style={currentStyles.systemsContainer}>
                {systemsData?.educationalSystems?.map((system: any) => (
                  <TouchableOpacity
                    key={system.id}
                    style={[
                      currentStyles.systemCard,
                      selectedSystem === system.id && currentStyles.systemCardActive,
                    ]}
                    onPress={() => setSelectedSystem(system.id)}
                  >
                    <Text
                      style={[
                        currentStyles.systemCardText,
                        selectedSystem === system.id && currentStyles.systemCardTextActive,
                      ]}
                    >
                      {system.name}
                    </Text>
                    {selectedSystem === system.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#1E3A8A"
                        style={currentStyles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {currentStep === 3 && (
            <>
              <View style={[currentStyles.inputWrapper, { paddingLeft: 0, paddingRight: 0 }]}>
                <View
                  style={[
                    currentStyles.countryCodeContainer,
                    isRTL
                      ? { borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }
                      : { borderRightWidth: 1, borderRightColor: '#E2E8F0' },
                  ]}
                >
                  <Text style={currentStyles.countryCodeText}>🇪🇬 +2 </Text>
                </View>
                <TextInput
                  style={[
                    currentStyles.input,
                    { flex: 1, textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 16 },
                  ]}
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder={t('auth.mobile_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={currentStyles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.password_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={currentStyles.inputWrapper}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('auth.confirm_password_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </>
          )}

          {currentStep === 4 && (
            <>
              <View style={[currentStyles.inputWrapper, { paddingLeft: 0, paddingRight: 0 }]}>
                <View
                  style={[
                    currentStyles.countryCodeContainer,
                    isRTL
                      ? { borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }
                      : { borderRightWidth: 1, borderRightColor: '#E2E8F0' },
                  ]}
                >
                  <Text style={currentStyles.countryCodeText}>🇪🇬 +2 </Text>
                </View>
                <TextInput
                  style={[
                    currentStyles.input,
                    { flex: 1, textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 16 },
                  ]}
                  value={parentMobile}
                  onChangeText={setParentMobile}
                  placeholder={t('auth.parent_mobile_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={[currentStyles.inputWrapper, { paddingLeft: 0, paddingRight: 0 }]}>
                <View
                  style={[
                    currentStyles.countryCodeContainer,
                    isRTL
                      ? { borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }
                      : { borderRightWidth: 1, borderRightColor: '#E2E8F0' },
                  ]}
                >
                  <Text style={currentStyles.countryCodeText}>🇪🇬 +2 </Text>
                </View>
                <TextInput
                  style={[
                    currentStyles.input,
                    { flex: 1, textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 16 },
                  ]}
                  value={parentMobile2}
                  onChangeText={setParentMobile2}
                  placeholder={t('auth.second_parent_mobile')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={currentStyles.inputWrapper}>
                <Ionicons
                  name="gift-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={promoCode}
                  onChangeText={setPromoCode}
                  placeholder={t('auth.promo_code_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </>
          )}

          <AppButton
            title={currentStep === 4 ? t('auth.sign_up') : t('common.continue', 'Continue')}
            onPress={handleNext}
            size="lg"
            loading={isLoading}
          />
        </View>

        <View style={currentStyles.footer}>
          <Text style={currentStyles.footerText}> {t('auth.already_have_account')} </Text>
          <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
            <Text style={currentStyles.linkText}> {t('auth.sign_in')} </Text>
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
            <Text style={currentStyles.disclaimerTitle}>
              {t('auth.disclaimer_title', 'Registration Disclaimer')}
            </Text>
            <Text style={currentStyles.disclaimerMessage}> {modalMessage} </Text>

            <View style={currentStyles.disclaimerActions}>
              <AppButton
                title={t('auth.continue_registration', 'Continue Registration')}
                onPress={confirmRegistration}
                style={{ marginBottom: 12 }}
              />
              <AppButton
                title={t('common.go_back', 'Go Back')}
                onPress={() => setShowModal(false)}
                variant="outline"
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = (
  theme: any,
  common: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  isRTL: boolean,
  typography: any,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: 60,
      paddingBottom: Math.max(common.insets.bottom, 20),
    },
    header: { alignItems: 'center', marginBottom: 32 },
    logo: { width: 100, height: 100, marginBottom: 16 },
    title: {
      ...typography('h1'),
      color: '#0F172A',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      ...typography('body'),
      color: '#64748B',
      textAlign: 'center',
      fontWeight: '500',
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
      ...typography('body'),
      color: '#1E293B',
      height: '100%',
    },
    inputText: {
      flex: 1,
      ...typography('body'),
      color: '#1E293B',
      textAlign: isRTL ? 'right' : 'left',
    },
    footer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      gap: 4,
    },
    footerText: { ...typography('body'), color: '#64748B' },
    linkText: {
      ...typography('button'),
      color: '#1E3A8A',
      fontWeight: '700',
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
      ...typography('caption'),
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
      ...typography('label'),
      fontWeight: '700',
      color: '#64748B',
    },
    gridItemTextActive: {
      color: '#1E3A8A',
    },
    sectionTitle: {
      ...typography('h3'),
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
      ...typography('caption'),
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
    autocompleteContainer: {
      backgroundColor: '#FFF',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      marginTop: -8,
      marginBottom: 16,
      maxHeight: 200,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    autocompleteItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    schoolResultInfo: {
      flex: 1,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    schoolResultName: {
      ...typography('label'),
      fontWeight: '700',
      color: '#1E293B',
    },
    schoolResultMeta: {
      ...typography('caption'),
      color: '#64748B',
      marginTop: 2,
    },
    countryCodeContainer: {
      paddingHorizontal: 12,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
    },
    countryCodeText: {
      ...typography('label'),
      fontWeight: '700',
      color: '#1E293B',
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
      paddingBottom: Math.max(common.insets.bottom, 40),
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
      ...typography('button'),
      color: '#1E3A8A',
      fontSize: 18,
      fontWeight: '700',
    },
    genderContainer: {
      marginBottom: 16,
    },
    sectionLabel: {
      ...typography('caption'),
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
      ...typography('button'),
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
      ...typography('h3'),
      fontWeight: '900',
      color: '#0F172A',
      textAlign: 'center',
      marginBottom: 8,
    },
    disclaimerMessage: {
      ...typography('label'),
      fontWeight: '700',
      color: '#64748B',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
    },
    disclaimerActions: {
      width: '100%',
    },
  });

export default RegisterScreen;
