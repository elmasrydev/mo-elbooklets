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
  Image,
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
import SearchablePickerModal from '../components/SearchablePickerModal';

interface EducationalSystem {
  id: string;
  name: string;
}

interface City {
  id: string | number;
  name: string;
  name_ar?: string;
  name_en?: string;
  governorate_id?: string | number;
}

interface School {
  id: string | number;
  name: string;
  name_en?: string;
  is_verified?: boolean;
}

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { user, refreshUser, updateUser } = useAuth();
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
    city_id: (user as any)?.city_id || '',
    governorate_id: (user as any)?.governorate_id || '',
  });

  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [fetchingGov, setFetchingGov] = useState(false);
  const [fetchingCities, setFetchingCities] = useState(false);

  const [passwordState, setPasswordState] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [touchedEmail, setTouchedEmail] = useAutoReset(false);
  const [touchedSchool, setTouchedSchool] = useAutoReset(false);
  const [touchedParentMobile, setTouchedParentMobile] = useAutoReset(false);

  const [schoolSuggestions, setSchoolSuggestions] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  const [showGovModal, setShowGovModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [govSearch, setGovSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);
  const schoolRef = useRef<TextInput>(null);
  const parentMobileRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchEduSystems();
    fetchGovernorates();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSchoolModal && schoolSearch.length >= 2) {
        fetchSchoolSuggestions(schoolSearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [schoolSearch, showSchoolModal]);

  useEffect(() => {
    if (formData.governorate_id) {
      fetchCities(formData.governorate_id);
    } else {
      setCities([]);
    }
  }, [formData.governorate_id]);

  const fetchGovernorates = async () => {
    try {
      setFetchingGov(true);
      const result = await tryFetchWithFallback(
        `query GetGovernorates { governorates { id name_ar name_en } }`,
      );
      if (result.data?.governorates) {
        setGovernorates(result.data.governorates);
      }
    } catch (err) {
      console.error('Fetch governorates error:', err);
    } finally {
      setFetchingGov(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showCityModal && formData.governorate_id && (citySearch.length === 0 || citySearch.length >= 2)) {
        fetchCities(formData.governorate_id, citySearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [citySearch, showCityModal, formData.governorate_id]);

  const fetchCities = async (governorateId: string, search: string = '') => {
    try {
      setFetchingCities(true);
      const query = `
        query SearchCities($governorate_id: ID, $query: String!) {
          searchCities(governorate_id: $governorate_id, query: $query) {
            id
            name_ar
            name_en
            governorate_id
          }
        }
      `;
      
      const result = await tryFetchWithFallback(query, {
        governorate_id: governorateId,
        query: search
      });

      if (result.data?.searchCities) {
        // Map name_ar/name_en to name field based on locale
        const mappedResults = result.data.searchCities.map((c: any) => ({
          ...c,
          name: isRTL ? (c.name_ar || c.name_en) : (c.name_en || c.name_ar)
        }));
        setCities(mappedResults);
      }
    } catch (err) {
      console.error('Fetch cities error:', err);
    } finally {
      setFetchingCities(false);
    }
  };

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
    try {
      setLoadingSchools(true);
      const query = `
        query SearchSchools($search: String!) {
          searchSchools(search: $search) {
            id
            name
            name_en
            name_ar
            is_verified
          }
        }
      `;
      
      const result = await tryFetchWithFallback(query, { search });

      if (result.data?.searchSchools) {
        setSchoolSuggestions(result.data.searchSchools);
      }
    } catch (err) {
      console.error('Search schools error:', err);
    } finally {
      setLoadingSchools(false);
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

  const selectedGovName = useMemo(() => {
    const gov = governorates.find(g => String(g.id) === String(formData.governorate_id));
    if (gov) return isRTL ? (gov.name_ar || gov.name) : (gov.name_en || gov.name);
    if (user?.governorate && String(user.governorate.id) === String(formData.governorate_id)) {
      return isRTL ? user.governorate.name_ar : user.governorate.name_en;
    }
    return '';
  }, [formData.governorate_id, governorates, user, isRTL]);

  const selectedCityName = useMemo(() => {
    const city = cities.find(c => String(c.id) === String(formData.city_id));
    if (city) return isRTL ? (city.name_ar || city.name) : (city.name_en || city.name);
    if (user?.city && String(user.city.id) === String(formData.city_id)) {
      return isRTL ? user.city.name_ar : user.city.name_en;
    }
    return '';
  }, [formData.city_id, cities, user, isRTL]);

  const mappedSchools = useMemo(() => {
    return schoolSuggestions.map(s => ({
      ...s,
      name: isRTL ? (s.name_ar || s.name || s.name_en) : (s.name_en || s.name)
    }));
  }, [schoolSuggestions, isRTL]);

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

    if (showPasswordSection) {
      if (!passwordState.oldPassword || !passwordState.newPassword) {
         showConfirm({
           title: t('common.error'),
           message: t('auth.fill_all_fields'),
           showCancel: false,
           onConfirm: () => {},
         });
         return;
      }
      if (passwordState.newPassword !== passwordState.confirmPassword) {
         showConfirm({
           title: t('common.error'),
           message: t('profile.passwords_dont_match'),
           showCancel: false,
           onConfirm: () => {},
         });
         return;
      }
    }

    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const input = {
          ...formData,
          ...(showPasswordSection ? {
              old_password: passwordState.oldPassword,
              password: passwordState.newPassword,
              password_confirmation: passwordState.confirmPassword,
          } : {})
      };

      const mutation = `
        mutation UpdateProfile($input: UpdateProfileInput!) {
          updateProfile(input: $input) {
            id 
            name 
            email 
            gender 
            school_name 
            parent_mobile
            governorate_id
            governorate { id name_ar name_en }
            city_id
            city { id name_ar name_en }
            educational_system { id name } 
          }
        }
      `;

      const result = await tryFetchWithFallback(mutation, { input }, token);
      
      if (result.data?.updateProfile) {
        await updateUser(result.data.updateProfile);
        showConfirm({
          title: t('common.success'),
          message: showPasswordSection 
            ? t('profile.password_changed_success') 
            : t('profile.update_success'),
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

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const query = `
        mutation ForgotPassword($email: String!) {
          forgotPassword(email: $email) {
            success
            message
          }
        }
      `;
      
      const result = await tryFetchWithFallback(query, { email: user.email });
      
      showConfirm({
        title: result.data?.forgotPassword?.success ? t('common.success') : t('common.error'),
        message: result.data?.forgotPassword?.message || t('common.error'),
        showCancel: false,
        onConfirm: () => {},
      });
    } catch (err: any) {
      console.error('Forgot password error:', err);
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
                style={currentStyles.form}
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
                      onBlur={() => setTouchedEmail(true)}
                    />
                  </View>
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

                {/* Governorate selection */}
                <View style={currentStyles.inputGroup}>
                  <Text style={currentStyles.inputLabel}>{t('profile.governorate')}</Text>
                  <TouchableOpacity
                    style={[
                      currentStyles.inputWrapper,
                      {
                        borderColor: formData.governorate_id ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => setShowGovModal(true)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={formData.governorate_id ? theme.colors.primary : theme.colors.textTertiary}
                      style={currentStyles.inputIconLeft}
                    />
                    <Text
                      style={[
                        currentStyles.input,
                        { 
                          textAlign: isRTL ? 'right' : 'left', 
                          color: formData.governorate_id ? theme.colors.text : theme.colors.textTertiary,
                          paddingTop: 16 // To align with TextInput
                        },
                      ]}
                    >
                      {selectedGovName || t('profile.select_governorate', 'Select Governorate')}
                    </Text>
                    {fetchingGov && (
                      <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: spacing.md }} />
                    )}
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={theme.colors.textTertiary}
                      style={{ paddingHorizontal: spacing.md }}
                    />
                  </TouchableOpacity>

                  <SearchablePickerModal
                    visible={showGovModal}
                    onClose={() => {
                        setShowGovModal(false);
                        setGovSearch('');
                    }}
                    title={t('profile.select_governorate')}
                    placeholder={t('common.search')}
                    searchValue={govSearch}
                    onSearchChange={setGovSearch}
                    selectedId={formData.governorate_id}
                    data={governorates
                      .filter(g => {
                        const name = isRTL ? (g.name_ar || g.name) : (g.name_en || g.name);
                        return name.toLowerCase().includes(govSearch.toLowerCase());
                      })
                      .map(g => ({
                        ...g,
                        name: isRTL ? (g.name_ar || g.name) : (g.name_en || g.name)
                      }))
                    }
                    onSelect={(gov) => {
                      setFormData(p => ({ ...p, governorate_id: gov.id, city_id: '' }));
                      setShowGovModal(false);
                      setGovSearch('');
                    }}
                  />
                </View>

                {/* City selection */}
                <View style={currentStyles.inputGroup}>
                  <Text style={currentStyles.inputLabel}>{t('profile.city')}</Text>
                  <TouchableOpacity
                    style={[
                      currentStyles.inputWrapper,
                      {
                        borderColor: formData.city_id ? theme.colors.primary : theme.colors.border,
                        opacity: !formData.governorate_id ? 0.6 : 1,
                      },
                    ]}
                    onPress={() => formData.governorate_id && setShowCityModal(true)}
                    disabled={!formData.governorate_id}
                  >
                    <Ionicons
                      name="map-outline"
                      size={20}
                      color={formData.city_id ? theme.colors.primary : theme.colors.textTertiary}
                      style={currentStyles.inputIconLeft}
                    />
                    <Text
                      style={[
                        currentStyles.input,
                        { 
                          textAlign: isRTL ? 'right' : 'left', 
                          color: formData.city_id ? theme.colors.text : theme.colors.textTertiary,
                          paddingTop: 16
                        },
                      ]}
                    >
                      {selectedCityName || (formData.governorate_id ? t('profile.select_city', 'Select City') : t('profile.select_gov_first', 'Select Governorate First'))}
                    </Text>
                    {fetchingCities && (
                      <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: spacing.md }} />
                    )}
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={theme.colors.textTertiary}
                      style={{ paddingHorizontal: spacing.md }}
                    />
                  </TouchableOpacity>

                  <SearchablePickerModal
                    visible={showCityModal}
                    onClose={() => {
                        setShowCityModal(false);
                        setCitySearch('');
                    }}
                    title={t('profile.select_city')}
                    placeholder={t('common.search')}
                    searchValue={citySearch}
                    onSearchChange={setCitySearch}
                    selectedId={formData.city_id}
                    data={cities}
                    loading={fetchingCities}
                    onSelect={(city) => {
                      setFormData(p => ({ ...p, city_id: city.id }));
                      setShowCityModal(false);
                      setCitySearch('');
                    }}
                  />
                </View>

                {/* School Name */}
                <View
                  style={[currentStyles.inputGroup]}
                >
                  <Text style={currentStyles.inputLabel}>
                    {t('profile.school_name', 'School Name')}
                  </Text>
                  <TouchableOpacity
                    style={[
                      currentStyles.inputWrapper,
                      {
                        borderColor: getBorderColor(
                          touchedSchool,
                          isSchoolValid,
                          formData.school_name,
                        ),
                        height: 50,
                        justifyContent: 'space-between',
                        paddingHorizontal: spacing.md
                      },
                    ]}
                    onPress={() => setShowSchoolModal(true)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons
                        name="school-outline"
                        size={20}
                        color={
                          formData.school_name.length > 0
                            ? theme.colors.primary
                            : theme.colors.textTertiary
                        }
                        style={{ marginRight: spacing.sm }}
                      />
                      <Text 
                        style={{ 
                          color: formData.school_name.length > 0 ? theme.colors.text : theme.colors.textTertiary,
                          fontSize: 16,
                          textAlign: isRTL ? 'right' : 'left',
                          flex: 1
                        }}
                        numberOfLines={1}
                      >
                        {formData.school_name || t('profile.school_placeholder')}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={theme.colors.textTertiary}
                    />
                  </TouchableOpacity>

                  <SearchablePickerModal
                    visible={showSchoolModal}
                    onClose={() => {
                        setShowSchoolModal(false);
                        setSchoolSearch('');
                    }}
                    title={t('auth.select_school_title', 'Select School')}
                    placeholder={t('auth.school_search_placeholder', 'Search school...')}
                    searchValue={schoolSearch}
                    onSearchChange={setSchoolSearch}
                    selectedId={formData.school_name}
                    data={mappedSchools}
                    loading={loadingSchools}
                    onSelect={(school) => {
                      const selectedName = isRTL ? (school.name || school.name_en) : (school.name_en || school.name);
                      setFormData(p => ({ ...p, school_name: selectedName }));
                      setShowSchoolModal(false);
                      setSchoolSearch('');
                    }}
                    emptyMessage={t('auth.no_schools_found')}
                    searchHelperText={t('auth.start_typing_school')}
                  />

                  <TouchableOpacity 
                    style={currentStyles.addSchoolTrigger}
                    onPress={() => {
                        showConfirm({
                            title: t('profile.request_school_title', 'Request New School'),
                            message: t('profile.request_school_message', 'Enter the name of the school you want to add'),
                            hasInput: true,
                            inputPlaceholder: t('profile.school_name_placeholder', 'School name...'),
                            onConfirm: async (schoolName) => {
                                if (schoolName && schoolName.trim()) {
                                    // Here you would typically call a mutation to request the school
                                    console.log('Requesting school:', schoolName);
                                    
                                    // Show success message
                                    setTimeout(() => {
                                      showConfirm({
                                          title: t('common.success', 'Success'),
                                          message: t('profile.school_request_sent', 'Your request has been sent successfully. We will review it soon.'),
                                          showCancel: false,
                                          onConfirm: () => {}
                                      });
                                    }, 500);
                                }
                            }
                        })
                    }}
                  >
                     <Text style={currentStyles.addSchoolText}>
                        {t('profile.add_school_request')}
                     </Text>
                  </TouchableOpacity>
                </View>

                {/* Grade (Readonly) */}
                <View style={currentStyles.inputGroup}>
                  <Text style={currentStyles.inputLabel}>{t('profile.grade', 'Grade')}</Text>
                  <View
                    style={[
                      currentStyles.inputWrapper,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={currentStyles.inputIconLeft}>
                       <Text style={{ fontSize: 18 }}>🎓</Text>
                    </View>
                    <Text
                      style={[currentStyles.readonlyText, { textAlign: isRTL ? 'right' : 'left' }]}
                    >
                      {user?.grade?.name || user?.educational_system?.name || '---'}
                    </Text>
                  </View>
                  <Text style={currentStyles.hintText}>
                    {t('profile.grade_not_editable', 'Grade cannot be changed')}
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={currentStyles.submitButton}
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={currentStyles.submitButtonText}>{t('profile.complete_profile', 'Complete Profile')}</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>

                {/* Change Password Section */}
                <TouchableOpacity 
                   style={[currentStyles.passwordToggle, { marginTop: spacing.xl }]}
                   onPress={() => setShowPasswordSection(!showPasswordSection)}
                >
                   <View style={currentStyles.passwordToggleLeft}>
                      <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
                      <Text style={currentStyles.passwordToggleText}>
                        {t('profile.change_password')}
                      </Text>
                   </View>
                   <Ionicons name={showPasswordSection ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.primary} />
                </TouchableOpacity>

                {showPasswordSection && (
                  <View style={currentStyles.passwordSection}>
                    <View style={currentStyles.inputGroup}>
                      <Text style={currentStyles.inputLabel}>{t('profile.old_password')}</Text>
                      <View style={currentStyles.inputWrapper}>
                         <TextInput 
                            style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                            secureTextEntry
                            value={passwordState.oldPassword}
                            onChangeText={v => setPasswordState(p => ({ ...p, oldPassword: v }))}
                            placeholder="••••••••"
                         />
                      </View>
                    </View>
                    <View style={currentStyles.inputGroup}>
                      <Text style={currentStyles.inputLabel}>{t('profile.new_password')}</Text>
                      <View style={currentStyles.inputWrapper}>
                         <TextInput 
                            style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                            secureTextEntry
                            value={passwordState.newPassword}
                            onChangeText={v => setPasswordState(p => ({ ...p, newPassword: v }))}
                            placeholder="••••••••"
                         />
                      </View>
                    </View>
                    <View style={currentStyles.inputGroup}>
                      <Text style={currentStyles.inputLabel}>{t('profile.confirm_new_password')}</Text>
                      <View style={currentStyles.inputWrapper}>
                         <TextInput 
                            style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                            secureTextEntry
                            value={passwordState.confirmPassword}
                            onChangeText={v => setPasswordState(p => ({ ...p, confirmPassword: v }))}
                            placeholder="••••••••"
                         />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                      <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
                        <Text style={{ ...typography('caption'), color: theme.colors.primary, textDecorationLine: 'underline' }}>
                          {t('auth.forgot_password', 'Forgot Password?')}
                        </Text>
                      </TouchableOpacity>
                      
                      <AppButton 
                        title={t('profile.update_password', 'Update Password')}
                        onPress={handleSave}
                        loading={loading}
                        size="sm"
                        variant="primary"
                        style={{ minWidth: 140 }}
                      />
                    </View>
                  </View>
                )}
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    floatingSuggestionsContainer: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
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
    passwordToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: spacing.md,
    },
    passwordToggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    passwordToggleText: {
      ...typography('button'),
      ...fontWeight('700'),
    },
    passwordSection: {
      paddingTop: spacing.sm,
    },
    addSchoolTrigger: {
      marginTop: spacing.sm,
      padding: spacing.xs,
    },
    addSchoolText: {
      ...typography('caption'),
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
    bottomModal: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: spacing.lg,
      paddingBottom: spacing.xl * 2,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        android: {
          elevation: 20,
        },
      }),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      ...typography('h3'),
      ...fontWeight('700'),
    },
    pickerItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
    },
    pickerItemText: {
      ...typography('body'),
      ...fontWeight('600'),
    },
  });
};

export default EditProfileScreen;
