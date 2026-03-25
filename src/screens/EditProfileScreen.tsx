import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { tryFetchWithFallback } from '../config/api';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import UnifiedHeader from '../components/UnifiedHeader';
import AppButton from '../components/AppButton';
import { useTypography } from '../hooks/useTypography';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAutoReset } from '../hooks/useAutoReset';
import { useModal } from '../context/ModalContext';

interface EducationalSystem {
  id: string;
  name: string;
}

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { typography, fontWeight } = useTypography();
  const common = useCommonStyles();
  const insets = useSafeAreaInsets();
  const { showConfirm } = useModal();

  const [loading, setLoading] = useState(false);
  const [eduSystems, setEduSystems] = useState<EducationalSystem[]>([]);
  const [fetchingEdu, setFetchingEdu] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: user?.email || '',
    school_name: user?.school_name || '',
    gender: user?.gender || '',
    educational_system_id: user?.educational_system?.id || '',
    parent_mobile: user?.parent_mobile || '',
  });

  const [touchedEmail, setTouchedEmail] = useAutoReset(false);
  const [touchedSchool, setTouchedSchool] = useAutoReset(false);
  const [touchedParentMobile, setTouchedParentMobile] = useAutoReset(false);

  const [schoolSuggestions, setSchoolSuggestions] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [schoolInputY, setSchoolInputY] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const schoolRef = useRef<TextInput>(null);
  const parentMobileRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchEduSystems();
  }, []);

  const fetchEduSystems = async () => {
    try {
      setFetchingEdu(true);
      const result = await tryFetchWithFallback(
        `query GetEduSystems { educationalSystems { id name } }`,
      );
      if (result.data?.educationalSystems) {
        setEduSystems(result.data.educationalSystems);
      }
    } catch (err) {
      console.error('Fetch edu systems error:', err);
    } finally {
      setFetchingEdu(false);
    }
  };

  const fetchSchoolSuggestions = async (search: string) => {
    if (!search || search.length < 2) {
      setSchoolSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoadingSchools(true);
      const token = await SecureStore.getItemAsync('auth_token');
      const result = await tryFetchWithFallback(
        `query SearchSchools($search: String!) { 
          searchSchools(search: $search) { id name name_en } 
        }`,
        { search },
        token || undefined,
      );

      if (result.data?.searchSchools) {
        setSchoolSuggestions(result.data.searchSchools);
        setShowSuggestions(result.data.searchSchools.length > 0);
      }
    } catch (err) {
      console.error('Search schools error:', err);
    } finally {
      setLoadingSchools(false);
    }
  };

  useEffect(() => {
    if (showSuggestions && schoolSuggestions.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, schoolInputY), animated: true });
      }, 100);
    }
  }, [showSuggestions, schoolSuggestions.length, schoolInputY]);

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

  const isEmailValid =
    formData.email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isSchoolValid = formData.school_name.trim().length > 0;
  const isParentMobileValid =
    formData.parent_mobile.trim() === '' || /^01[0125]\d{8}$/.test(formData.parent_mobile.trim());

  const getBorderColor = (touched: boolean, valid: boolean, value: string) => {
    if (!touched && value.length === 0) return theme.colors.border;
    if (touched && !valid) return '#FF6B6B'; // Red-500
    if (value.length > 0 && valid) return theme.colors.primary;
    return theme.colors.border;
  };

  const handleSave = async () => {
    setTouchedEmail(true);
    setTouchedSchool(true);
    setTouchedParentMobile(true);

    if (!isEmailValid || !isParentMobileValid) {
      showConfirm({
        title: t('common.error'),
        message: t('auth.fill_all_fields', 'Please check highlighted fields'),
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `mutation UpdateProfile($input: UpdateProfileInput!) { 
          updateProfile(input: $input) { 
            id 
            name 
            email 
            gender 
            school_name 
            parent_mobile 
            educational_system { id name } 
          } 
        }`,
        { input: formData },
        token,
      );

      if (result.data?.updateProfile) {
        await refreshUser();
        showConfirm({
          title: t('common.success'),
          message: t('profile.update_success', 'Profile updated successfully'),
          showCancel: false,
          onConfirm: () => navigation.goBack(),
        });
      } else {
        const errorMsg = result.errors?.[0]?.message || t('common.error');
        showConfirm({
          title: t('common.error'),
          message: errorMsg,
          showCancel: false,
          onConfirm: () => {},
        });
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      showConfirm({
        title: t('common.error'),
        message: err.message || t('common.error'),
        showCancel: false,
        onConfirm: () => {},
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={currentStyles.container}>
      {/* UnifiedHeader is kept outside the Card layout as requested */}
      <UnifiedHeader showBackButton title={t('profile_screen.edit_profile')} />

      <KeyboardAvoidingView
        style={currentStyles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={currentStyles.cardContainer}>
          <View style={currentStyles.card}>
            <ScrollView
              ref={scrollViewRef}
              style={currentStyles.cardScrollView}
              contentContainerStyle={currentStyles.cardContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={[
                  currentStyles.form,
                  showSuggestions && schoolSuggestions.length > 0 ? { paddingBottom: 250 } : null,
                ]}
              >
                {/* Name (Readonly) */}
                <View style={currentStyles.inputGroup}>
                  <Text style={currentStyles.inputLabel}>{t('auth.name')}</Text>
                  <View
                    style={[
                      currentStyles.inputWrapper,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={theme.colors.textTertiary}
                      style={currentStyles.inputIconLeft}
                    />
                    <Text
                      style={[currentStyles.readonlyText, { textAlign: isRTL ? 'right' : 'left' }]}
                    >
                      {user?.name}
                    </Text>
                  </View>
                  <Text style={currentStyles.hintText}>
                    {t('profile.name_not_editable', 'Name cannot be changed manually')}
                  </Text>
                </View>

                {/* Mobile (Readonly) */}
                <View style={currentStyles.inputGroup}>
                  <Text style={currentStyles.inputLabel}>{t('auth.mobile')}</Text>
                  <View
                    style={[
                      currentStyles.inputWrapper,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={theme.colors.textTertiary}
                      style={currentStyles.inputIconLeft}
                    />
                    <Text
                      style={[
                        currentStyles.readonlyText,
                        { textAlign: isRTL ? 'right' : 'left', direction: 'ltr' },
                      ]}
                    >
                      {user?.country_code} {user?.mobile}
                    </Text>
                  </View>
                </View>

                {/* Email */}
                <View style={currentStyles.inputGroup}>
                  <Text style={currentStyles.inputLabel}>{t('auth.email', 'Email Address')}</Text>
                  <View
                    style={[
                      currentStyles.inputWrapper,
                      { borderColor: getBorderColor(touchedEmail, isEmailValid, formData.email) },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={
                        formData.email.length > 0 && isEmailValid
                          ? theme.colors.primary
                          : theme.colors.textTertiary
                      }
                      style={currentStyles.inputIconLeft}
                    />
                    <TextInput
                      style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                      value={formData.email}
                      onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
                      placeholder="example@mail.com"
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => schoolRef.current?.focus()}
                      onBlur={() => setTouchedEmail(true)}
                    />
                  </View>
                </View>

                {/* School Name */}
                <View
                  style={[currentStyles.inputGroup, { zIndex: 10 }]}
                  onLayout={(e) => setSchoolInputY(e.nativeEvent.layout.y)}
                >
                  <Text style={currentStyles.inputLabel}>
                    {t('profile.school_name', 'School Name')}
                  </Text>
                  <View
                    style={[
                      currentStyles.inputWrapper,
                      {
                        borderColor: getBorderColor(
                          touchedSchool,
                          isSchoolValid,
                          formData.school_name,
                        ),
                      },
                    ]}
                  >
                    <Ionicons
                      name="school-outline"
                      size={20}
                      color={
                        formData.school_name.length > 0
                          ? theme.colors.primary
                          : theme.colors.textTertiary
                      }
                      style={currentStyles.inputIconLeft}
                    />
                    <TextInput
                      ref={schoolRef}
                      style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                      value={formData.school_name}
                      onChangeText={(v) => {
                        setFormData((p) => ({ ...p, school_name: v }));
                        fetchSchoolSuggestions(v);
                      }}
                      placeholder={t('profile.school_placeholder')}
                      placeholderTextColor={theme.colors.textTertiary}
                      returnKeyType="next"
                      onSubmitEditing={() => parentMobileRef.current?.focus()}
                      onFocus={() => {
                        if (formData.school_name.length >= 2) setShowSuggestions(true);
                      }}
                      onBlur={() => {
                        setTouchedSchool(true);
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                    />
                    {loadingSchools && (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.primary}
                        style={{ marginRight: spacing.md }}
                      />
                    )}
                  </View>

                  {showSuggestions && schoolSuggestions.length > 0 && (
                    <View
                      style={[
                        currentStyles.suggestionsContainer,
                        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                      ]}
                    >
                      <ScrollView
                        style={{ maxHeight: 200 }}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                      >
                        {schoolSuggestions.map((school) => (
                          <TouchableOpacity
                            key={school.id}
                            style={[
                              currentStyles.suggestionItem,
                              { borderBottomColor: theme.colors.border },
                            ]}
                            onPress={() => {
                              setFormData((p) => ({
                                ...p,
                                school_name: isRTL ? school.name : school.name_en || school.name,
                              }));
                              setShowSuggestions(false);
                            }}
                          >
                            <Text
                              style={[currentStyles.suggestionText, { color: theme.colors.text }]}
                            >
                              {school.name}
                            </Text>
                            {school.name_en && (
                              <Text
                                style={[
                                  currentStyles.suggestionTextEn,
                                  { color: theme.colors.textTertiary },
                                ]}
                              >
                                {school.name_en}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Gender */}
                <View style={currentStyles.inputGroup}>
                  <Text style={currentStyles.inputLabel}>{t('profile.gender', 'Gender')}</Text>
                  <View style={currentStyles.gridContainer}>
                    <TouchableOpacity
                      style={[
                        currentStyles.gridItem,
                        formData.gender === 'male' && currentStyles.gridItemActive,
                      ]}
                      onPress={() => setFormData((p) => ({ ...p, gender: 'male' }))}
                    >
                      <Ionicons
                        name="man-outline"
                        size={20}
                        color={
                          formData.gender === 'male'
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          currentStyles.gridItemText,
                          formData.gender === 'male' && currentStyles.gridItemTextActive,
                          { marginLeft: 8 },
                        ]}
                      >
                        {t('profile.male')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        currentStyles.gridItem,
                        formData.gender === 'female' && currentStyles.gridItemActive,
                      ]}
                      onPress={() => setFormData((p) => ({ ...p, gender: 'female' }))}
                    >
                      <Ionicons
                        name="woman-outline"
                        size={20}
                        color={
                          formData.gender === 'female'
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          currentStyles.gridItemText,
                          formData.gender === 'female' && currentStyles.gridItemTextActive,
                          { marginLeft: 8 },
                        ]}
                      >
                        {t('profile.female')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Educational System */}
                <View style={currentStyles.inputGroup}>
                  <Text style={currentStyles.inputLabel}>{t('auth.educational_system')}</Text>
                  {fetchingEdu ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <View style={currentStyles.gridContainerVertical}>
                      {eduSystems.map((sys) => (
                        <TouchableOpacity
                          key={sys.id}
                          style={[
                            currentStyles.gridItemVertical,
                            formData.educational_system_id === sys.id &&
                              currentStyles.gridItemActive,
                          ]}
                          onPress={() =>
                            setFormData((p) => ({ ...p, educational_system_id: sys.id }))
                          }
                        >
                          <Text
                            style={[
                              currentStyles.gridItemText,
                              formData.educational_system_id === sys.id &&
                                currentStyles.gridItemTextActive,
                            ]}
                          >
                            {sys.name}
                          </Text>
                          {formData.educational_system_id === sys.id && (
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={theme.colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Parent Mobile */}
                <View style={currentStyles.inputGroup}>
                  <Text style={currentStyles.inputLabel}>
                    {t('profile_screen.parental_linking')}
                  </Text>
                  <View
                    style={[
                      currentStyles.inputWrapper,
                      {
                        borderColor: getBorderColor(
                          touchedParentMobile,
                          isParentMobileValid,
                          formData.parent_mobile,
                        ),
                      },
                    ]}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={20}
                      color={
                        formData.parent_mobile.length > 0 && isParentMobileValid
                          ? theme.colors.primary
                          : theme.colors.textTertiary
                      }
                      style={currentStyles.inputIconLeft}
                    />
                    <TextInput
                      ref={parentMobileRef}
                      style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                      value={formData.parent_mobile}
                      onChangeText={(v) =>
                        setFormData((p) => ({
                          ...p,
                          parent_mobile: v.replaceAll(/\D/g, '').slice(0, 11),
                        }))
                      }
                      placeholder="01xxxxxxxxx"
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="phone-pad"
                      onBlur={() => setTouchedParentMobile(true)}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={currentStyles.submitButton}
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={currentStyles.submitButtonText}>{t('common.save')}</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="save-outline" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Bottom Primary Border */}
            <View style={currentStyles.bottomBorder} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = (config: any) => {
  const { theme, fontSizes, spacing, borderRadius, isRTL, typography, fontWeight, insets } = config;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    cardContainer: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: insets.bottom + spacing.md,
      alignItems: 'center',
    },
    card: {
      flex: 1,
      width: '100%',
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || 24,
      overflow: 'visible',
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
      paddingTop: spacing.lg,
    },
    form: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
    },
    inputGroup: {
      marginBottom: spacing.lg,
    },
    inputLabel: {
      ...typography('caption'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
      textAlign: 'left',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      borderWidth: 1,
      borderRadius: borderRadius.lg || 12,
      backgroundColor: theme.colors.background,
      overflow: 'hidden', // Added to respect border radius
    },
    inputIconLeft: {
      paddingHorizontal: spacing.md,
    },
    readonlyText: {
      ...typography('body'),
      flex: 1,
      color: theme.colors.textTertiary,
      paddingRight: spacing.md,
    },
    input: {
      flex: 1,
      fontSize: fontSizes.base,
      color: theme.colors.text,
      height: '100%',
      paddingRight: spacing.md,
    },
    hintText: {
      fontSize: 12,
      ...typography('caption'),
      color: theme.colors.textTertiary,
      marginTop: spacing.xs,
      fontStyle: 'italic',
      textAlign: isRTL ? 'right' : 'left',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -spacing.xs,
    },
    gridContainerVertical: {
      flexDirection: 'column',
      gap: spacing.sm,
    },
    gridItem: {
      flex: 1,
      minWidth: '45%',
      margin: spacing.xs,
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.lg || 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    gridItemVertical: {
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.lg || 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      backgroundColor: theme.colors.background,
    },
    gridItemActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '1A',
    },
    gridItemText: {
      ...typography('button'),
      color: theme.colors.textSecondary,
    },
    gridItemTextActive: {
      color: theme.colors.primary,
      ...fontWeight('600'),
    },
    submitButton: {
      height: 56,
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.lg || 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    submitButtonText: {
      ...typography('button'),
      ...fontWeight('700'),
      color: '#FFFFFF',
      marginRight: spacing.sm,
      marginLeft: isRTL ? spacing.sm : 0,
    },
    bottomBorder: {
      height: 8,
      backgroundColor: theme.colors.primary,
      width: '100%',
    },
    suggestionsContainer: {
      position: 'absolute',
      top: 86,
      left: 0,
      right: 0,
      zIndex: 1000,
      borderWidth: 1,
      borderRadius: borderRadius.lg || 12,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    suggestionItem: {
      padding: spacing.md,
      borderBottomWidth: 1,
    },
    suggestionText: {
      ...typography('body'),
      ...fontWeight('600'),
    },
    suggestionTextEn: {
      ...typography('caption'),
      marginTop: 2,
    },
  });
};

export default EditProfileScreen;
