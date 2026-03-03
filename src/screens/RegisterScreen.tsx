import React, { useState, useEffect, useRef } from 'react';
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
  FlatList,
  SafeAreaView,
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
import { useAutoReset } from '../hooks/useAutoReset';

import BackButton from '../components/navigation/BackButton';
import CloseButton from '../components/navigation/CloseButton';
import AppButton from '../components/AppButton';
import UnifiedHeader from '../components/UnifiedHeader';
import { layout } from '../config/layout';
import { textAlign } from '../lib/rtl';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onBack: () => void;
}

const PickerTrigger = ({ value, placeholder, icon, onPress, theme, currentStyles }: any) => {
  return (
    <TouchableOpacity style={currentStyles.inputWrapper} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={icon}
        size={20}
        color={theme.colors.textSecondary}
        style={currentStyles.inputIcon}
      />
      <Text
        style={[
          currentStyles.inputText,
          { textAlign: 'center' },
          !value && { color: theme.colors.textSecondary },
        ]}
      >
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [countryCode, setCountryCode] = useState('+2');
  const [parentCountryCode, setParentCountryCode] = useState('+2');
  const [parentCountryCode2, setParentCountryCode2] = useState('+2');

  const MOBILE_REGEX = /^01[0125][0-9]{8}$/;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [parentMobile, setParentMobile] = useState('');
  const [parentMobile2, setParentMobile2] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');

  // Refs for Focus Chaining
  const emailRef = useRef<TextInput>(null);
  const schoolRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const parentMobile2Ref = useRef<TextInput>(null);
  const promoCodeRef = useRef<TextInput>(null);
  const schoolSearchInputRef = useRef<any>(null);

  // Touch States for Inline Validation (Auto-reset after 3s)
  const [touchedName, setTouchedName] = useAutoReset(false);
  const [touchedEmail, setTouchedEmail] = useAutoReset(false);
  const [touchedSchool, setTouchedSchool] = useAutoReset(false);
  const [touchedMobile, setTouchedMobile] = useAutoReset(false);
  const [touchedPassword, setTouchedPassword] = useAutoReset(false);
  const [touchedConfirm, setTouchedConfirm] = useAutoReset(false);
  const [touchedParentMobile, setTouchedParentMobile] = useAutoReset(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { login, register } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const insets = useSafeAreaInsets();
  const { typography, fontWeight } = useTypography();
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
  const [isSchoolModalVisible, setIsSchoolModalVisible] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  useEffect(() => {
    if (isSchoolModalVisible) {
      const timer = setTimeout(() => {
        schoolSearchInputRef.current?.focus();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSchoolModalVisible]);

  // Validation Flags
  const isNameValid = name.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isSchoolValid = schoolName.trim().length >= 2;
  const isMobileValid = MOBILE_REGEX.test(mobile.trim());
  const isPasswordValid = password.length >= 8;
  const isConfirmValid = isPasswordValid && password === confirmPassword;
  const isParentMobileValid = MOBILE_REGEX.test(parentMobile.trim());

  // Dynamic Border Color Helpers
  const getBorderColor = (touched: boolean, valid: boolean) => {
    if (!touched) return '#E2E8F0';
    return valid ? '#10B981' : '#F59E0B';
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (schoolSearchQuery.length >= 2) {
        searchSchools(schoolSearchQuery);
      } else {
        setSchoolResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [schoolSearchQuery]);

  const searchSchools = async (query: string) => {
    setIsSearchingSchools(true);
    try {
      const baseUrl = PRIMARY_API_URL.replace('/graphql', '');
      const response = await fetch(`${baseUrl}/schools-search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSchoolResults(data);
    } catch (error) {
      console.error('Error searching schools:', error);
    } finally {
      setIsSearchingSchools(false);
    }
  };

  const selectSchool = (school: any) => {
    const selectedName = language === 'ar' ? school.name : school.name_en || school.name;
    setSchoolName(selectedName);
    setIsSchoolModalVisible(false);
    setSchoolSearchQuery('');
    setSchoolResults([]);
    // Trigger success border
    setTouchedSchool(true);
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1: {
        setTouchedName(true);
        setTouchedEmail(true);
        setTouchedSchool(true);
        if (!isNameValid || !isEmailValid || !gender || !isSchoolValid) {
          Alert.alert(
            t('common.error'),
            t('auth.fill_all_fields', 'Please check highlighted fields'),
          );
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
        setTouchedMobile(true);
        setTouchedPassword(true);
        setTouchedConfirm(true);
        if (!isMobileValid || !isPasswordValid || !isConfirmValid) {
          Alert.alert(
            t('common.error'),
            t('auth.fill_all_fields', 'Please check highlighted fields'),
          );
          return false;
        }
        return true;
      case 4:
        setTouchedParentMobile(true);
        if (
          !isParentMobileValid ||
          (parentMobile2.trim() && !MOBILE_REGEX.test(parentMobile2.trim()))
        ) {
          Alert.alert(
            t('common.error'),
            t('auth.fill_all_fields', 'Please check highlighted fields'),
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
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        country_code: countryCode,
        password,
        grade_id: selectedGrade?.id,
        educational_system_id: selectedSystem?.id || '1',
        gender: gender || 'male',
        school_name: schoolName ? schoolName : undefined,
        parent_mobile: parentMobile ? parentMobile.trim() : undefined,
        parent_country_code: parentMobile ? parentCountryCode : undefined,
        parent_mobile_2: parentMobile2 ? parentMobile2.trim() : undefined,
        parent_country_code_2: parentMobile2 ? parentCountryCode2 : undefined,
        promo_code: promoCode ? promoCode : undefined,
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

  const currentStyles = styles(
    theme,
    common,
    fontSizes,
    spacing,
    borderRadius,
    isRTL,
    typography,
    fontWeight,
  );

  const StepIndicator = () => (
    <View style={currentStyles.stepIndicatorContainer}>
      <View style={currentStyles.stepDots}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              currentStyles.stepDot,
              s === currentStep ? currentStyles.stepDotActive : undefined,
              s < currentStep ? currentStyles.stepDotCompleted : undefined,
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
        style={[currentStyles.backButton, { top: insets.top + spacing.sm }, { left: spacing.lg }]}
        color={theme.colors.text}
      />

      {currentStep === 1 && (
        <TouchableOpacity
          onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          style={[
            currentStyles.languageButton,
            { top: insets.top + spacing.sm },
            { right: spacing.lg },
          ]}
        >
          <Ionicons name="language-outline" size={20} color={theme.colors.primary} />
          <Text style={currentStyles.languageText}>{language === 'ar' ? 'English' : 'عربي'}</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={currentStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.header}>
          <Image
            source={require('../../assets/logo-transparent.png')}
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
              <View
                style={[
                  currentStyles.inputWrapper,
                  { borderColor: getBorderColor(touchedName, isNameValid) },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={isNameValid ? '#10B981' : theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left', flex: 1 }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('auth.name_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  onBlur={() => setTouchedName(true)}
                  blurOnSubmit={false}
                />
                {touchedName && isNameValid && (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#10B981"
                    style={{ marginHorizontal: 8 }}
                  />
                )}
                {touchedName && !isNameValid && (
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#F59E0B"
                    style={{ marginHorizontal: 8 }}
                  />
                )}
              </View>

              <View
                style={[
                  currentStyles.inputWrapper,
                  { borderColor: getBorderColor(touchedEmail, isEmailValid) },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={isEmailValid ? '#10B981' : theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  // @ts-ignore
                  ref={emailRef}
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left', flex: 1 }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.email_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="done"
                  onBlur={() => setTouchedEmail(true)}
                />
                {touchedEmail && isEmailValid && (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#10B981"
                    style={{ marginHorizontal: 8 }}
                  />
                )}
                {touchedEmail && !isEmailValid && (
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#F59E0B"
                    style={{ marginHorizontal: 8 }}
                  />
                )}
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

              <PickerTrigger
                value={schoolName}
                placeholder={t('auth.school_placeholder')}
                icon="business-outline"
                onPress={() => setIsSchoolModalVisible(true)}
                theme={theme}
                currentStyles={{
                  ...currentStyles,
                  inputWrapper: StyleSheet.flatten([
                    currentStyles.inputWrapper,
                    { borderColor: getBorderColor(touchedSchool, isSchoolValid) },
                  ]),
                }}
              />

              {/* Enhanced School Search Modal */}
              <Modal
                visible={isSchoolModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsSchoolModalVisible(false)}
              >
                <SafeAreaView style={currentStyles.modalSearchContainer}>
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                  >
                    <UnifiedHeader
                      title={
                        <Text
                          style={[
                            common.headerTitle,
                            { ...typography('h2'), color: theme.colors.headerText },
                          ]}
                        >
                          {t('auth.select_school_title')}
                        </Text>
                      }
                      leftContent={<CloseButton onPress={() => setIsSchoolModalVisible(false)} />}
                      showBorder={true}
                    />

                    <FlatList
                      style={{ marginBottom: insets.bottom }}
                      ListHeaderComponent={
                        <View style={currentStyles.modalSearchInputContainer}>
                          <View style={currentStyles.modalSearchInputWrapper}>
                            <TextInput
                              ref={schoolSearchInputRef}
                              style={currentStyles.modalSearchInput}
                              placeholder={t('auth.school_search_placeholder')}
                              value={schoolSearchQuery}
                              onChangeText={setSchoolSearchQuery}
                              placeholderTextColor={theme.colors.textSecondary}
                              autoCapitalize="none"
                              autoCorrect={false}
                            />
                            {isSearchingSchools && (
                              <ActivityIndicator size="small" color={theme.colors.primary} />
                            )}
                            <Ionicons
                              name="search-outline"
                              size={20}
                              color={theme.colors.textSecondary}
                              style={{ marginRight: 10 }}
                            />
                          </View>
                        </View>
                      }
                      data={schoolResults}
                      keyExtractor={(item) => item.id.toString()}
                      contentContainerStyle={{ padding: 16 }}
                      shouldRasterizeIOS={true}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => {
                        return (
                          <TouchableOpacity
                            style={currentStyles.autocompleteItem}
                            onPress={() => selectSchool(item)}
                          >
                            <View style={currentStyles.schoolResultIcon}>
                              <Ionicons name="school" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={currentStyles.schoolResultInfo}>
                              <Text style={currentStyles.schoolResultName}>
                                {language === 'ar' ? item.name : item.name_en || item.name}
                              </Text>
                              {item.governorate && item.area ? (
                                <Text style={currentStyles.schoolResultMeta}>
                                  {item.governorate} {item.area ? `• ${item.area}` : ''}{' '}
                                </Text>
                              ) : null}
                            </View>
                            {item.is_verified && (
                              <Ionicons
                                name="checkmark-circle"
                                size={24}
                                color="#059669"
                                style={{ marginHorizontal: 8 }}
                              />
                            )}
                            <Ionicons
                              name={isRTL ? 'chevron-back' : 'chevron-forward'}
                              size={20}
                              color={theme.colors.border}
                            />
                          </TouchableOpacity>
                        );
                      }}
                      ListEmptyComponent={() => (
                        <View style={{ alignItems: 'center', marginTop: 100 }}>
                          <Ionicons
                            name="business-outline"
                            size={64}
                            color="#E2E8F0"
                            style={{ marginBottom: 16 }}
                          />
                          <Text
                            style={[
                              currentStyles.subtitle,
                              { textAlign: 'center', opacity: schoolSearchQuery ? 1 : 0.5 },
                            ]}
                          >
                            {schoolSearchQuery
                              ? t('auth.no_schools_found')
                              : t('auth.start_typing_school')}
                          </Text>
                        </View>
                      )}
                    />
                  </KeyboardAvoidingView>
                </SafeAreaView>
              </Modal>
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
              <View
                style={[
                  currentStyles.inputWrapper,
                  {
                    paddingLeft: 0,
                    paddingRight: 0,
                    borderColor: getBorderColor(touchedMobile, isMobileValid),
                  },
                ]}
              >
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
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onBlur={() => setTouchedMobile(true)}
                  blurOnSubmit={false}
                />
                {touchedMobile && isMobileValid && (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#10B981"
                    style={{ marginHorizontal: 12 }}
                  />
                )}
                {touchedMobile && !isMobileValid && (
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#F59E0B"
                    style={{ marginHorizontal: 12 }}
                  />
                )}
              </View>

              <View
                style={[
                  currentStyles.inputWrapper,
                  { borderColor: getBorderColor(touchedPassword, isPasswordValid) },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={isPasswordValid ? '#10B981' : theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  // @ts-ignore
                  ref={passwordRef}
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left', flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.password_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  onBlur={() => setTouchedPassword(true)}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ marginHorizontal: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  currentStyles.inputWrapper,
                  { borderColor: getBorderColor(touchedConfirm, isConfirmValid) },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={isConfirmValid ? '#10B981' : theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  // @ts-ignore
                  ref={confirmPasswordRef}
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left', flex: 1 }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('auth.confirm_password_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="done"
                  onBlur={() => setTouchedConfirm(true)}
                />
                {touchedConfirm && isConfirmValid && (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#10B981"
                    style={{ marginHorizontal: 8 }}
                  />
                )}
                {touchedConfirm && !isConfirmValid && (
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#F59E0B"
                    style={{ marginHorizontal: 8 }}
                  />
                )}
              </View>
            </>
          )}

          {currentStep === 4 && (
            <>
              <View
                style={[
                  currentStyles.inputWrapper,
                  {
                    paddingLeft: 0,
                    paddingRight: 0,
                    borderColor: getBorderColor(touchedParentMobile, isParentMobileValid),
                  },
                ]}
              >
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
                  returnKeyType="next"
                  onSubmitEditing={() => parentMobile2Ref.current?.focus()}
                  onBlur={() => setTouchedParentMobile(true)}
                  blurOnSubmit={false}
                />
                {touchedParentMobile && isParentMobileValid && (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#10B981"
                    style={{ marginHorizontal: 12 }}
                  />
                )}
                {touchedParentMobile && !isParentMobileValid && (
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#F59E0B"
                    style={{ marginHorizontal: 12 }}
                  />
                )}
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
                  // @ts-ignore
                  ref={parentMobile2Ref}
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
                  returnKeyType="next"
                  onSubmitEditing={() => promoCodeRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {parentMobile2.trim().length > 0 && MOBILE_REGEX.test(parentMobile2.trim()) && (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#10B981"
                    style={{ marginHorizontal: 12 }}
                  />
                )}
                {parentMobile2.trim().length > 0 && !MOBILE_REGEX.test(parentMobile2.trim()) && (
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#F59E0B"
                    style={{ marginHorizontal: 12 }}
                  />
                )}
              </View>

              <View style={currentStyles.inputWrapper}>
                <Ionicons
                  name="gift-outline"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={currentStyles.inputIcon}
                />
                <TextInput
                  // @ts-ignore
                  ref={promoCodeRef}
                  style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left', flex: 1 }]}
                  value={promoCode}
                  onChangeText={setPromoCode}
                  placeholder={t('auth.promo_code_placeholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
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
  fontWeight: any,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: layout.screenPadding,
      paddingTop: common.insets.top + 60,
      paddingBottom: Math.max(common.insets.bottom, 20),
    },
    header: { alignItems: 'center', marginBottom: 32 },
    logo: { width: 100, height: 85, marginBottom: 24 },
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
      ...fontWeight('500'),
    },
    form: { marginBottom: 24 },
    languageButton: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 6,
      zIndex: 10,
      ...layout.shadow,
    },
    languageText: {
      ...typography('label'),
      ...fontWeight('700'),
      color: theme.colors.primary,
    },
    inputWrapper: {
      flexDirection: 'row',
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
      ...fontWeight('700'),
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
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
      ...fontWeight('600'),
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
      ...fontWeight('700'),
      color: '#64748B',
    },
    gridItemTextActive: {
      color: '#1E3A8A',
    },
    sectionTitle: {
      ...typography('h3'),
      ...fontWeight('800'),
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
      ...fontWeight('700'),
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
    modalSearchInputContainer: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: 'transparent',
    },
    modalSearchInputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F1F5F9',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 48,
    },
    modalSearchInput: {
      flex: 1,
      ...typography('body'),
      color: '#1E293B',
      textAlign: isRTL ? 'right' : 'left',
    },
    autocompleteItem: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      borderRadius: 16,
      marginBottom: 12,
      backgroundColor: '#FFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      height: 150,
    },
    schoolResultIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(30, 58, 138, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 10,
      marginLeft: isRTL ? 10 : 0,
    },
    schoolResultInfo: {
      flex: 1,
      justifyContent: 'center',
      padding: 10,
    },
    schoolResultName: {
      ...typography('h3'),
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: 'left',
    },
    schoolResultMeta: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 4,
      textAlign: 'left',
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
      ...fontWeight('700'),
      color: '#1E293B',
    },
    modalSearchContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
      ...fontWeight('700'),
    },
    genderContainer: {
      marginBottom: 16,
    },
    sectionLabel: {
      ...typography('caption'),
      fontSize: 10,
      ...fontWeight('900'),
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
      ...fontWeight('900'),
      color: '#0F172A',
      textAlign: 'center',
      marginBottom: 8,
    },
    disclaimerMessage: {
      ...typography('label'),
      ...fontWeight('700'),
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
