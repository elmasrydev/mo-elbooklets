import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
import { tryFetchWithFallback } from '../config/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { useAutoReset } from '../hooks/useAutoReset';
import { useModal } from '../context/ModalContext';
import { useNavigation } from '@react-navigation/native';
import { useScreenTracking } from '../hooks/useScreenTracking';
import analytics from '../lib/analytics';

import BackButton from '../components/navigation/BackButton';
import AppButton from '../components/AppButton';



const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  useScreenTracking('Register');
  const [currentStep, setCurrentStep] = useState(1);
  const [countryCode] = useState('+2');

  const MOBILE_REGEX = /^01[0125]\d{8}$/;
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [selectedEduSystem, setSelectedEduSystem] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');

  // Refs for Focus Chaining
  const confirmPasswordRef = useRef<TextInput>(null);
  const promoCodeRef = useRef<TextInput>(null);

  // Touch States for Inline Validation
  const [touchedName, setTouchedName] = useAutoReset(false);
  const [touchedMobile, setTouchedMobile] = useAutoReset(false);
  const [touchedPassword, setTouchedPassword] = useAutoReset(false);
  const [touchedConfirm, setTouchedConfirm] = useAutoReset(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { register } = useAuth();
  const { showConfirm } = useModal();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const insets = useSafeAreaInsets();
  const { typography, fontWeight } = useTypography();
  const isRTL = language === 'ar';

  const [gradesData, setGradesData] = useState<{ grades: any[] } | null>(null);
  const [eduSystems, setEduSystems] = useState<any[]>([]);
  const [campaignFreeAccess, setCampaignFreeAccess] = useState(false);

  const messages = {
    no_referral: t(
      'auth.no_referral_disclaimer',
      'You are now going to sign up without referral code and will have Trial Limited Access only',
    ),
  };

  useEffect(() => {
    fetchRegistrationData();
  }, []);

  const fetchRegistrationData = async () => {
    fetchGrades();
    fetchEduSystems();
    fetchAppConfig();
  };

  const fetchAppConfig = async () => {
    try {
      const result = await tryFetchWithFallback(`query GetAppConfig { appConfig { campaignFreeAccess } }`);
      if (result.data?.appConfig) {
        setCampaignFreeAccess(result.data.appConfig.campaignFreeAccess);
      }
    } catch (error) {
      console.error('Error fetching app config:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      const result = await tryFetchWithFallback(`query GetGrades { grades { id name } }`);
      if (result.data) setGradesData(result.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const fetchEduSystems = async () => {
    try {
      const result = await tryFetchWithFallback(`query GetEduSystems { educationalSystems { id name } }`);
      if (result.data?.educationalSystems) {
        setEduSystems(result.data.educationalSystems);
      }
    } catch (error) {
      console.error('Error fetching edu systems:', error);
    }
  };

  // Validation Flags
  const isNameValid = name.trim().length >= 3;
  const isMobileValid = MOBILE_REGEX.test(mobile.trim());
  const isPasswordValid = password.length >= 8;
  const isConfirmValid = isPasswordValid && password === confirmPassword;

  // Dynamic Border Color Helpers
  const getBorderColor = (touched: boolean, valid: boolean) => {
    if (!touched) return theme.colors.border;
    return valid ? theme.colors.success || '#10B981' : theme.colors.warning || '#F59E0B';
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1: {
        setTouchedName(true);
        setTouchedMobile(true);
        setTouchedPassword(true);
        setTouchedConfirm(true);
        if (!isNameValid || !isMobileValid || !isPasswordValid || !isConfirmValid) {
          showConfirm({
            title: t('common.error'),
            message: t('auth.fill_all_fields', 'Please check highlighted fields'),
            showCancel: false,
            onConfirm: () => {},
          });
          return false;
        }
        return true;
      }
      case 2:
        if (!selectedGrade || !selectedEduSystem) {
          showConfirm({
            title: t('common.error'),
            message: t('auth.fill_all_fields', 'Please check highlighted fields'),
            showCancel: false,
            onConfirm: () => {},
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 2) {
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
    if (!promoCode.trim() && !campaignFreeAccess) {
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
        mobile: mobile.trim(),
        country_code: countryCode,
        password: password,
        grade_id: selectedGrade,
        educational_system_id: selectedEduSystem,
        promo_code: promoCode || undefined,
      });
      if (result.success && result.user) {
        analytics.trackSignUp('phone');
        analytics.identify(result.user.id, {
          name: result.user.name,
          mobile: result.user.mobile,
          grade: result.user.grade?.name,
        });
      } else if (!result.success) {
        showConfirm({
          title: t('auth.registration_failed'),
          message: t(result.error || 'auth.registration_error'),
          showCancel: false,
          onConfirm: () => {},
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      showConfirm({
        title: t('common.error'),
        message: t('common.unexpected_error'),
        showCancel: false,
        onConfirm: () => {},
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentStyles = useMemo(
    () =>
      styles({
        theme,
        common,
        fontSizes,
        spacing,
        borderRadius,
        isRTL,
        typography,
        fontWeight,
        insets,
      }),
    [theme, common, fontSizes, spacing, borderRadius, isRTL, typography, fontWeight, insets],
  );

  const getSubmitIcon = (step: number, rtl: boolean) => {
    if (step === 2) return 'person-add-outline';
    return rtl ? 'arrow-back-outline' : 'arrow-forward-outline';
  };



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
                  <StepIndicator
                    currentStep={currentStep}
                    theme={theme}
                    t={t}
                    currentStyles={currentStyles}
                  />
                </View>
                <Text style={currentStyles.title}>
                  {currentStep === 1 && t('auth.account_details', 'Account Details')}
                  {currentStep === 2 && t('auth.school_info', 'School Info')}
                </Text>
              </View>

              <View style={currentStyles.form}>
                {currentStep === 1 && (
                  <StepOne
                    name={name}
                    setName={setName}
                    mobile={mobile}
                    setMobile={setMobile}
                    touchedName={touchedName}
                    setTouchedName={setTouchedName}
                    isNameValid={isNameValid}
                    touchedMobile={touchedMobile}
                    setTouchedMobile={setTouchedMobile}
                    isMobileValid={isMobileValid}
                    password={password}
                    setPassword={setPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    touchedPassword={touchedPassword}
                    setTouchedPassword={setTouchedPassword}
                    isPasswordValid={isPasswordValid}
                    touchedConfirm={touchedConfirm}
                    setTouchedConfirm={setTouchedConfirm}
                    isConfirmValid={isConfirmValid}
                    confirmPasswordRef={confirmPasswordRef}
                    isLoading={isLoading}
                    theme={theme}
                    t={t}
                    isRTL={isRTL}
                    currentStyles={currentStyles}
                    getBorderColor={getBorderColor}
                    spacing={spacing}
                  />
                )}

                {currentStep === 2 && (
                  <StepTwo
                    selectedGrade={selectedGrade}
                    setSelectedGrade={setSelectedGrade}
                    selectedEduSystem={selectedEduSystem}
                    setSelectedEduSystem={setSelectedEduSystem}
                    gradesData={gradesData}
                    eduSystems={eduSystems}
                    promoCode={promoCode}
                    setPromoCode={setPromoCode}
                    promoCodeRef={promoCodeRef}
                    handleNext={handleNext}
                    isLoading={isLoading}
                    theme={theme}
                    t={t}
                    isRTL={isRTL}
                    currentStyles={currentStyles}
                    campaignFreeAccess={campaignFreeAccess}
                    spacing={spacing}
                  />
                )}

                <TouchableOpacity
                  style={currentStyles.submitButton}
                  onPress={handleNext}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={currentStyles.submitButtonText}>
                    {currentStep === 2 ? t('auth.sign_up') : t('common.continue')}
                  </Text>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name={getSubmitIcon(currentStep, isRTL)} size={20} color="#FFF" />
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

const StepOne = ({
  name,
  setName,
  mobile,
  setMobile,
  touchedName,
  setTouchedName,
  isNameValid,
  touchedMobile,
  setTouchedMobile,
  isMobileValid,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  touchedPassword,
  setTouchedPassword,
  isPasswordValid,
  touchedConfirm,
  setTouchedConfirm,
  isConfirmValid,
  confirmPasswordRef,
  isLoading,
  theme,
  t,
  isRTL,
  currentStyles,
  getBorderColor,
  spacing,
}: any) => {
  return (
    <>
      <View
        style={[currentStyles.inputWrapper, { borderColor: getBorderColor(touchedName, isNameValid) }]}
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
          onChangeText={(val) => setName(val.replaceAll(/[^a-zA-Z\s\u0621-\u064A]/g, ''))}
          placeholder={t('auth.name_placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          returnKeyType="next"
          onBlur={() => setTouchedName(true)}
        />
      </View>

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
          style={[currentStyles.input, { flex: 1, textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 16 }]}
          value={mobile}
          onChangeText={(val) => setMobile(val.replaceAll(/\D/g, '').slice(0, 11))}
          maxLength={11}
          placeholder={t('auth.mobile_placeholder')}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          returnKeyType="next"
          onBlur={() => setTouchedMobile(true)}
        />
      </View>

      <View
        style={[currentStyles.inputWrapper, { borderColor: getBorderColor(touchedPassword, isPasswordValid) }]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={isPasswordValid ? '#10B981' : theme.colors.textSecondary}
          style={currentStyles.inputIcon}
        />
        <TextInput
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
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginHorizontal: 8 }}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View
        style={[currentStyles.inputWrapper, { borderColor: getBorderColor(touchedConfirm, isConfirmValid) }]}
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
          returnKeyType="next"
          onBlur={() => setTouchedConfirm(true)}
        />
      </View>
    </>
  );
};

const StepTwo = ({
  selectedGrade,
  setSelectedGrade,
  selectedEduSystem,
  setSelectedEduSystem,
  gradesData,
  eduSystems,
  promoCode,
  setPromoCode,
  promoCodeRef,
  handleNext,
  isLoading,
  theme,
  t,
  isRTL,
  currentStyles,
  campaignFreeAccess,
  spacing,
}: any) => {
  return (
    <>
      <Text style={[currentStyles.sectionLabel, { marginBottom: spacing.sm }]}>
        {t('auth.select_grade_title', 'Select Your Grade')}
      </Text>
      <View style={currentStyles.gridContainer}>
        {gradesData?.grades?.map((grade: any) => (
          <TouchableOpacity
            key={grade.id}
            style={[currentStyles.gridItem, selectedGrade === grade.id && currentStyles.gridItemActive]}
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

      <Text style={[currentStyles.sectionLabel, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
        {t('auth.select_edu_system', 'Select Educational System')}
      </Text>
      <View style={currentStyles.gridContainer}>
        {eduSystems.map((sys: any) => (
          <TouchableOpacity
            key={sys.id}
            style={[currentStyles.gridItem, selectedEduSystem === sys.id && currentStyles.gridItemActive]}
            onPress={() => setSelectedEduSystem(sys.id)}
          >
            <Text
              style={[
                currentStyles.gridItemText,
                selectedEduSystem === sys.id && currentStyles.gridItemTextActive,
              ]}
            >
              {sys.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {campaignFreeAccess ? (
        <View style={currentStyles.campaignBanner}>
          <Ionicons name="sparkles-outline" size={20} color="#059669" />
          <Text style={currentStyles.campaignText}>
            {t(
              'auth.free_campaign_active',
              'A free access campaign is currently active! You will get full access automatically.',
            )}
          </Text>
        </View>
      ) : (
        <>
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
          <View style={currentStyles.referralDisclaimer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={currentStyles.disclaimerText}>
              {t(
                'auth.referral_disclaimer',
                "If you don't have a code, you will start with Trial Limited Access.",
              )}
            </Text>
          </View>
        </>
      )}
    </>
  );
};

const StepIndicator = ({ currentStep, t, currentStyles }: any) => (
  <View style={currentStyles.stepIndicatorContainer}>
    <View style={currentStyles.stepDots}>
      {[1, 2].map((s) => {
        const isActive = s === currentStep;
        const isCompleted = s < currentStep;
        return (
          <View
            key={`step-${s}`}
            style={[
              currentStyles.stepDot,
              isActive ? currentStyles.stepDotActive : null,
              isCompleted ? currentStyles.stepDotCompleted : null,
            ]}
          />
        );
      })}
    </View>
    <Text style={currentStyles.stepText}>
      {t('auth.step_x_of_y', { current: currentStep, total: 2 })}
    </Text>
  </View>
);

const styles = (config: any) => {
  const { theme, spacing, borderRadius, isRTL, typography, fontWeight, insets, fontSizes } = config;
  return StyleSheet.create({
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
      gap: 8,
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
      backgroundColor: theme.colors.primary,
      opacity: 0.5,
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
      minWidth: '31%',
      backgroundColor: theme.colors.background,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.lg || 16,
      height: 50,
      paddingHorizontal: spacing.sm,
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
      paddingBottom: Math.max(insets.bottom, 40),
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
    campaignBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ECFDF5',
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: '#10B981',
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    campaignText: {
      ...typography('caption'),
      ...fontWeight('700'),
      color: '#065F46',
      flex: 1,
      textAlign: 'left',
    },
    referralDisclaimer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
      gap: spacing.xs,
    },
    disclaimerText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      ...fontWeight('500'),
      flex: 1,
      textAlign: 'left',
    },
  });
};

export default RegisterScreen;
