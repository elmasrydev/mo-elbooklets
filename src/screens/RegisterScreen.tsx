import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';

import BackButton from '../components/navigation/BackButton';
import CloseButton from '../components/navigation/CloseButton';
import AppButton from '../components/AppButton';
import UnifiedHeader from '../components/UnifiedHeader';
import { layout } from '../config/layout';
// import { textAlign } from '../lib/rtl';

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
          !value && { color: theme.colors.textSecondary },
          { textAlign: 'center' },
        ]}
      >
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
};

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
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
    if (!touched) return theme.colors.border;
    return valid ? theme.colors.success || '#10B981' : theme.colors.warning || '#F59E0B';
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
      navigation.goBack();
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
        grade_id: selectedGrade,
        educational_system_id: selectedSystem || '1',
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

  const currentStyles = useMemo(
    () =>
      styles(
        theme,
        common,
        fontSizes,
        spacing,
        borderRadius,
        isRTL,
        typography,
        fontWeight,
        insets,
      ),
    [theme, common, fontSizes, spacing, borderRadius, isRTL, typography, fontWeight, insets],
  );

  const StepIndicator = () => (
    <View style={currentStyles.stepIndicatorContainer}>
      <View style={currentStyles.stepDots}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={`step-${s}`}
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
    <>
      <KeyboardAvoidingView
        style={currentStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={currentStyles.cardContainer}>
          <View style={currentStyles.card}>
            {/* Fixed Header Area */}
            <View style={currentStyles.headerTop}>
              <BackButton
                onPress={handleBack}
                style={currentStyles.backButton}
                color={theme.colors.text}
              />
              <Text style={currentStyles.headerTitle}>{t('auth.register', 'Create Account')}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={currentStyles.cardScrollView}
              contentContainerStyle={currentStyles.cardContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Scrollable Header Area */}
              <View style={currentStyles.header}>
                <Image
                  source={require('../../assets/logo-transparent.png')}
                  style={currentStyles.logo}
                  resizeMode="contain"
                />
                <View style={{ marginTop: spacing.md }}>
                  <StepIndicator />
                </View>
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
                        style={[
                          currentStyles.input,
                          { textAlign: isRTL ? 'right' : 'left', flex: 1 },
                        ]}
                        value={name}
                        onChangeText={(val) =>
                          setName(val.replace(/[^a-zA-Z\s\u0621-\u064A]/g, ''))
                        }
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
                          color={theme.colors.success || '#10B981'}
                          style={{ marginHorizontal: spacing.sm }}
                        />
                      )}
                      {touchedName && !isNameValid && (
                        <Ionicons
                          name="alert-circle-outline"
                          size={20}
                          color={theme.colors.warning || '#F59E0B'}
                          style={{ marginHorizontal: spacing.sm }}
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
                        style={[
                          currentStyles.input,
                          { textAlign: isRTL ? 'right' : 'left', flex: 1 },
                        ]}
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
                          color={theme.colors.success || '#10B981'}
                          style={{ marginHorizontal: spacing.sm }}
                        />
                      )}
                      {touchedEmail && !isEmailValid && (
                        <Ionicons
                          name="alert-circle-outline"
                          size={20}
                          color={theme.colors.warning || '#F59E0B'}
                          style={{ marginHorizontal: spacing.sm }}
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
                        onChangeText={(val) => setMobile(val.replace(/[^0-9]/g, '').slice(0, 11))}
                        maxLength={11}
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
                          color={theme.colors.success || '#10B981'}
                          style={{ marginHorizontal: spacing.sm }}
                        />
                      )}
                      {touchedMobile && !isMobileValid && (
                        <Ionicons
                          name="alert-circle-outline"
                          size={20}
                          color={theme.colors.warning || '#F59E0B'}
                          style={{ marginHorizontal: spacing.sm }}
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
                        style={[
                          currentStyles.input,
                          { textAlign: isRTL ? 'right' : 'left', flex: 1 },
                        ]}
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
                        style={[
                          currentStyles.input,
                          { textAlign: isRTL ? 'right' : 'left', flex: 1 },
                        ]}
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
                          color={theme.colors.success || '#10B981'}
                          style={{ marginHorizontal: spacing.sm }}
                        />
                      )}
                      {touchedConfirm && !isConfirmValid && (
                        <Ionicons
                          name="alert-circle-outline"
                          size={20}
                          color={theme.colors.warning || '#F59E0B'}
                          style={{ marginHorizontal: spacing.sm }}
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
                        onChangeText={(val) =>
                          setParentMobile(val.replace(/[^0-9]/g, '').slice(0, 11))
                        }
                        maxLength={11}
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
                          color={theme.colors.success || '#10B981'}
                          style={{ marginHorizontal: spacing.sm }}
                        />
                      )}
                      {touchedParentMobile && !isParentMobileValid && (
                        <Ionicons
                          name="alert-circle-outline"
                          size={20}
                          color={theme.colors.warning || '#F59E0B'}
                          style={{ marginHorizontal: spacing.sm }}
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
                        onChangeText={(val) =>
                          setParentMobile2(val.replace(/[^0-9]/g, '').slice(0, 11))
                        }
                        maxLength={11}
                        placeholder={t('auth.second_parent_mobile')}
                        placeholderTextColor={theme.colors.textSecondary}
                        keyboardType="phone-pad"
                        autoCorrect={false}
                        editable={!isLoading}
                        returnKeyType="next"
                        onSubmitEditing={() => promoCodeRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                      {parentMobile2.trim().length > 0 &&
                        MOBILE_REGEX.test(parentMobile2.trim()) && (
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color={theme.colors.success || '#10B981'}
                            style={{ marginHorizontal: spacing.sm }}
                          />
                        )}
                      {parentMobile2.trim().length > 0 &&
                        !MOBILE_REGEX.test(parentMobile2.trim()) && (
                          <Ionicons
                            name="alert-circle-outline"
                            size={20}
                            color={theme.colors.warning || '#F59E0B'}
                            style={{ marginHorizontal: spacing.sm }}
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
                        style={[
                          currentStyles.input,
                          { textAlign: isRTL ? 'right' : 'left', flex: 1 },
                        ]}
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

                <TouchableOpacity
                  style={currentStyles.submitButton}
                  onPress={handleNext}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={currentStyles.submitButtonText}>
                        {currentStep === 4 ? t('auth.sign_up') : t('common.continue')}
                      </Text>
                      <Ionicons
                        name={
                          currentStep === 4
                            ? 'person-add-outline'
                            : isRTL
                              ? 'arrow-back-outline'
                              : 'arrow-forward-outline'
                        }
                        size={20}
                        color="#FFF"
                      />
                    </>
                  )}
                </TouchableOpacity>

                <View style={currentStyles.dividerRow}>
                  <View style={currentStyles.dividerLine} />
                  <Text style={currentStyles.dividerText}>{'        '}</Text>
                  <View style={currentStyles.dividerLine} />
                </View>

                {currentStep === 1 && (
                  <TouchableOpacity
                    style={currentStyles.languageButtonBottom}
                    onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="language-outline" size={20} color={theme.colors.primary} />
                    <Text style={currentStyles.languageButtonText}>
                      {language === 'ar' ? 'English' : 'عربي'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={currentStyles.footer}>
                <Text style={currentStyles.footerText}>{t('auth.already_have_account')}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
                  <Text style={currentStyles.linkText}> {t('auth.sign_in')} </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            <View style={currentStyles.cardAccent} />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Enhanced School Search Modal */}
      <Modal
        visible={isSchoolModalVisible}
        animationType="slide"
        {...(Platform.OS === 'ios' ? { presentationStyle: 'pageSheet' } : {})}
        onRequestClose={() => setIsSchoolModalVisible(false)}
      >
        <View style={currentStyles.modalSearchContainer}>
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
              isModal={true}
            />

            <FlatList
              style={{ marginBottom: insets.bottom }}
              ListHeaderComponent={
                <View style={{ paddingBottom: 8 }}>
                  <View style={currentStyles.modalSearchInputContainer}>
                    <View style={currentStyles.modalSearchInputWrapper}>
                      <TextInput
                        ref={schoolSearchInputRef as any}
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
                  {schoolSearchQuery.trim().length >= 2 && !isSearchingSchools && (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: spacing.md,
                        marginTop: spacing.md,
                        marginHorizontal: spacing.xxs,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: theme.colors.primary,
                        borderStyle: 'dashed',
                        backgroundColor: theme.colors.primary + '08',
                      }}
                      onPress={() => {
                        setSchoolName(schoolSearchQuery.trim());
                        setIsSchoolModalVisible(false);
                        setSchoolSearchQuery('');
                        setSchoolResults([]);
                        setTouchedSchool(true);
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: theme.colors.primary + '15',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginHorizontal: spacing.sm,
                        }}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={24}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            ...typography('body'),
                            color: theme.colors.primary,
                            fontWeight: '600',
                            textAlign: 'left',
                          }}
                        >
                          {t('auth.use_custom_school', 'Use "{{name}}" as school name', {
                            name: schoolSearchQuery.trim(),
                          })}
                        </Text>
                        <Text
                          style={{
                            ...typography('caption'),
                            color: theme.colors.textSecondary,
                            marginTop: 2,
                            textAlign: 'left',
                          }}
                        >
                          {t('auth.school_not_in_list', "Can't find your school? Add it manually")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
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
              ListFooterComponent={null}
              ListEmptyComponent={() => (
                <View style={{ alignItems: 'center', marginTop: 80 }}>
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
                    {schoolSearchQuery ? t('auth.no_schools_found') : t('auth.start_typing_school')}
                  </Text>
                </View>
              )}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
                style={{ marginBottom: spacing.md }}
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
    </>
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
  insets: any,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    cardContainer: {
      flex: 1,
      padding: spacing.md,
      paddingTop: insets.top + spacing.md,
      paddingBottom: insets.bottom + spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      flex: 1,
      width: '100%',
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 24,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 15,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    cardScrollView: {
      flex: 1,
    },
    cardContent: {
      flexGrow: 1,
    },
    cardAccent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 8,
      backgroundColor: theme.colors.primary,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      ...typography('subtitle1'),
      ...fontWeight('700'),
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
    },
    logo: {
      width: 100,
      height: 80,
      marginBottom: spacing.lg,
    },
    header: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    title: {
      fontSize: 28,
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    subtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },

    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      height: 56,
    },
    inputIcon: {
      marginRight: isRTL ? 0 : spacing.sm,
      marginLeft: isRTL ? spacing.sm : 0,
    },
    input: {
      flex: 1,
      fontSize: fontSizes.base,
      color: theme.colors.text,
      height: '100%',
    },
    inputText: {
      flex: 1,
      fontSize: fontSizes.base,
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    footerText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    linkText: {
      fontSize: 14,
      ...fontWeight('700'),
      color: theme.colors.primary,
    },
    languageButtonBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      borderRadius: borderRadius.lg || 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      marginBottom: spacing.xxs,
    },
    languageButtonText: {
      fontSize: 14,
      ...fontWeight('600'),
      color: theme.colors.text,
      marginLeft: isRTL ? 0 : spacing.sm,
      marginRight: isRTL ? spacing.sm : 0,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: 0,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      color: theme.colors.textTertiary,
      paddingHorizontal: spacing.sm,
      fontSize: 14,
      ...fontWeight('500'),
    },
    submitButton: {
      flexDirection: 'row',
      height: 56,
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    submitButtonText: {
      ...typography('button'),
      color: '#FFF',
      ...fontWeight('700'),
      marginRight: isRTL ? 0 : spacing.sm,
      marginLeft: isRTL ? spacing.sm : 0,
    },
    stepIndicatorContainer: {
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    stepDots: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    stepDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.border,
    },
    stepDotActive: {
      backgroundColor: theme.colors.primary,
      width: 24,
    },
    stepDotCompleted: {
      backgroundColor: theme.colors.primary + '80', // semi-transparent primary
    },
    stepText: {
      fontSize: 12,
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.md,
      justifyContent: 'center',
    },
    gridItem: {
      width: '31%',
      backgroundColor: theme.colors.background,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.lg || 16,
      height: 50,
      paddingHorizontal: spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    gridItemActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '08',
      ...Platform.select({
        ios: { shadowOpacity: 0 },
        android: { elevation: 0 },
      }),
    },
    gridItemText: {
      fontSize: 12,
      ...fontWeight('700'),
      color: theme.colors.textSecondary,
    },
    gridItemTextActive: {
      color: theme.colors.primary,
    },
    sectionTitle: {
      ...typography('h3'),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      textAlign: 'center', //isRTL ? 'right' : 'left',
    },
    systemsContainer: {
      flexDirection: 'column',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    systemCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: theme.colors.background,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.lg || 16,
      height: 56,
      justifyContent: 'center',
      position: 'relative',
    },
    systemCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '08',
    },
    systemCardText: {
      fontSize: 12,
      ...fontWeight('700'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    systemCardTextActive: {
      color: theme.colors.primary,
    },
    checkIcon: {
      position: 'absolute',
      right: isRTL ? undefined : spacing.md,
      left: isRTL ? spacing.md : undefined,
      top: 18, // (56 - 20) / 2
    },
    autocompleteContainer: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      marginTop: -8,
      marginBottom: spacing.md,
      maxHeight: 200,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    modalSearchInputContainer: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: 'transparent',
    },
    modalSearchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      paddingHorizontal: spacing.md,
      height: 56,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: fontSizes.base,
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    autocompleteItem: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 20,
      marginBottom: spacing.md,
      backgroundColor: theme.colors.surface,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    schoolResultIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '08',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : spacing.sm,
      marginLeft: isRTL ? spacing.sm : 0,
    },
    schoolResultInfo: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.sm,
    },
    schoolResultName: {
      ...typography('h3'),
      ...fontWeight('700'),
      color: theme.colors.text,
      textAlign: 'left',
    },
    schoolResultMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
      textAlign: 'left',
    },
    countryCodeContainer: {
      paddingHorizontal: spacing.sm,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    countryCodeText: {
      fontSize: 14,
      ...fontWeight('700'),
      color: theme.colors.text,
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
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalDoneButton: {
      paddingHorizontal: spacing.md,
    },
    modalDoneText: {
      ...typography('button'),
      color: theme.colors.primary,
      fontSize: 18,
      ...fontWeight('700'),
    },
    genderContainer: {
      marginBottom: spacing.md,
    },
    sectionLabel: {
      fontSize: 10,
      ...fontWeight('900'),
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: spacing.xs,
      textAlign: 'left',
    },
    genderRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    genderButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 16,
      height: 56,
      gap: spacing.xs,
    },
    genderButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '08',
    },
    genderEmoji: {
      fontSize: 20,
    },
    genderText: {
      ...typography('button'),
      color: theme.colors.textSecondary,
    },
    genderTextActive: {
      color: theme.colors.primary,
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
