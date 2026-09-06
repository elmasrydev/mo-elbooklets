import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useAuth, User } from '../context/AuthContext';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import {
  GetEduSystemsDocument,
  GetGovernoratesDocument,
  SearchCitiesDocument,
  SearchSchoolsDocument,
  UpdateProfileDocument,
} from '../generated/graphql';
import { addCity, addSchool } from '../services/locationService';
import { Ionicons } from '@expo/vector-icons';
import UnifiedHeader from '../components/UnifiedHeader';
import { useTypography } from '../hooks/useTypography';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModal } from '../context/ModalContext';
import SearchablePickerModal from '../components/SearchablePickerModal';
import Avatar from '../components/Avatar';
import AvatarPickerModal from '../components/AvatarPickerModal';
import { INPUT_TEXT_ALIGN } from '../lib/rtl';

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
  const { user, updateUser } = useAuth();
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
  // Snapshot of the seed, so save can tell "the student emptied this" from
  // "this was never loaded" — see the diff in handleSave.
  const initialFormRef = useRef(formData);

  // Reference lookups run on demand (modal opens, debounced search boxes), so
  // they're lazy; results stay in local state because the pickers merge in
  // user-suggested entries (BKLT-318).
  const [runGovernoratesQuery] = useLazyQuery(GetGovernoratesDocument);
  const [runEduSystemsQuery] = useLazyQuery(GetEduSystemsDocument);
  const [runCitiesQuery] = useLazyQuery(SearchCitiesDocument);
  const [runSchoolsQuery] = useLazyQuery(SearchSchoolsDocument);
  const [updateProfile] = useMutation(UpdateProfileDocument);

  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [fetchingGov, setFetchingGov] = useState(false);
  const [fetchingCities, setFetchingCities] = useState(false);
  const [addingCity, setAddingCity] = useState(false);
  const [addingSchool, setAddingSchool] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedSchool, setTouchedSchool] = useState(false);
  const [touchedParentMobile, setTouchedParentMobile] = useState(false);

  const [schoolSuggestions, setSchoolSuggestions] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  const [showGovModal, setShowGovModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [govSearch, setGovSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
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
      const result = await runGovernoratesQuery();
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
      if (
        showCityModal &&
        formData.governorate_id &&
        (citySearch.length === 0 || citySearch.length >= 2)
      ) {
        fetchCities(formData.governorate_id, citySearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [citySearch, showCityModal, formData.governorate_id]);

  const fetchCities = async (governorateId: string, search: string = '') => {
    try {
      setFetchingCities(true);
      const result = await runCitiesQuery({
        variables: { governorate_id: governorateId, query: search },
      });

      if (result.data?.searchCities) {
        // Map name_ar/name_en to name field based on locale
        const mappedResults = result.data.searchCities.map((c: any) => ({
          ...c,
          name: isRTL ? c.name_ar || c.name_en : c.name_en || c.name_ar,
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
      const result = await runEduSystemsQuery();
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
      const result = await runSchoolsQuery({ variables: { search } });

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
    const gov = governorates.find((g) => String(g.id) === String(formData.governorate_id));
    if (gov) return isRTL ? gov.name_ar || gov.name : gov.name_en || gov.name;
    if (user?.governorate && String(user.governorate.id) === String(formData.governorate_id)) {
      return isRTL ? user.governorate.name_ar : user.governorate.name_en;
    }
    return '';
  }, [formData.governorate_id, governorates, user, isRTL]);

  const selectedCityName = useMemo(() => {
    const city = cities.find((c) => String(c.id) === String(formData.city_id));
    if (city) return isRTL ? city.name_ar || city.name : city.name_en || city.name;
    if (user?.city && String(user.city.id) === String(formData.city_id)) {
      return isRTL ? user.city.name_ar : user.city.name_en;
    }
    return '';
  }, [formData.city_id, cities, user, isRTL]);

  const mappedSchools = useMemo(() => {
    return schoolSuggestions.map((s) => ({
      ...s,
      name: isRTL ? s.name || s.name_en : s.name_en || s.name,
    }));
  }, [schoolSuggestions, isRTL]);

  const showAddFailed = () =>
    showConfirm({
      title: t('common.error'),
      message: t('profile.add_failed', "Couldn't add that right now. Please try again."),
      showCancel: false,
      onConfirm: () => {},
    });

  // "Can't find your city? Add it" — create the typed city under the selected
  // governorate, select it, and drop it into the local list so it renders.
  const handleAddCity = async (name: string) => {
    if (!formData.governorate_id) return;
    setAddingCity(true);
    const created = await addCity(formData.governorate_id, name);
    setAddingCity(false);
    if (!created) return showAddFailed();
    const mapped = {
      ...created,
      name: isRTL ? created.name_ar || created.name_en : created.name_en || created.name_ar,
    };
    setCities((prev) => [mapped, ...prev.filter((c) => String(c.id) !== String(created.id))]);
    setFormData((p) => ({ ...p, city_id: created.id }));
    setShowCityModal(false);
    setCitySearch('');
  };

  // Schools are stored on the profile by name, so just persist the created name.
  const handleAddSchool = async (name: string) => {
    setAddingSchool(true);
    // Attach a canonical (English) governorate label so the same governorate isn't
    // stored under different strings depending on the UI language. (code-review)
    const gov = governorates.find((g) => String(g.id) === String(formData.governorate_id));
    const govLabel = gov?.name_en || gov?.name_ar || user?.governorate?.name_en || undefined;
    const created = await addSchool(name, govLabel);
    setAddingSchool(false);
    if (!created) return showAddFailed();
    setFormData((p) => ({ ...p, school_name: created.name }));
    setShowSchoolModal(false);
    setSchoolSearch('');
  };

  const isEmailValid =
    formData.email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isSchoolValid = formData.school_name.trim().length > 0;
  const isParentMobileValid =
    formData.parent_mobile.trim() === '' || /^01[0125]\d{8}$/.test(formData.parent_mobile.trim());

  const getBorderColor = (fieldName: string, touched: boolean, valid: boolean, value: string) => {
    if (focusedField === fieldName) return theme.colors.primary;
    if (!touched && value.length === 0) return theme.colors.border;
    if (touched && !valid) return '#FF6B6B'; // Red-500
    if (value.length > 0 && valid) return theme.colors.primary;
    return theme.colors.border;
  };

  const handleSave = async () => {
    // Check if anything has actually changed
    const hasChanges =
      formData.email !== (user?.email || '') ||
      formData.school_name !== (user?.school_name || '') ||
      formData.gender !== (user?.gender || '') ||
      formData.educational_system_id !== (user?.educational_system?.id || '') ||
      formData.parent_mobile !== (user?.parent_mobile || '') ||
      String(formData.city_id) !== String((user as any)?.city_id || '') ||
      String(formData.governorate_id) !== String((user as any)?.governorate_id || '');

    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    setTouchedEmail(true);
    setTouchedSchool(true);
    setTouchedParentMobile(true);

    if (!isEmailValid) {
      showConfirm({
        title: t('common.error'),
        message: t('auth.invalid_email_format'),
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    if (!isParentMobileValid) {
      showConfirm({
        title: t('common.error'),
        message: t('auth.invalid_egyptian_mobile'),
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    try {
      setLoading(true);

      // Send ONLY the fields this session actually changed.
      //
      // Omitting every empty field meant nothing could ever be cleared — picking
      // a new governorate (which resets city_id to '') left the previous
      // governorate's city attached. But blanket-nulling every empty field is
      // destructive: `Login`/`Register` do not select gender, school_name,
      // parent_mobile, governorate_id or city_id, so after a cold start those
      // seed to '' because they were never loaded — not because the student
      // cleared them — and sending null would wipe a populated profile.
      //
      // Diffing against the seed distinguishes the two: a key the student never
      // touched is omitted (unchanged), and a key they emptied goes as explicit
      // null (cleared). Every field on UpdateProfileInput is nullable.
      const input: Record<string, string | null> = {};
      Object.entries(formData).forEach(([key, value]) => {
        const initial = initialFormRef.current[key as keyof typeof formData] ?? '';
        if (value === initial) return;
        input[key] = value === '' || value === undefined ? null : value;
      });

      if (Object.keys(input).length === 0) {
        setLoading(false);
        navigation.goBack();
        return;
      }

      const result = await updateProfile({ variables: { input } });

      if (result.data?.updateProfile) {
        // Merge: the mutation returns the fields it can change, not the whole
        // User. The cast bridges wire nulls to the model's optional fields —
        // both read as "absent" everywhere this object is consumed.
        await updateUser({ ...user, ...result.data.updateProfile } as User);
        showConfirm({
          title: t('common.success'),
          message: t('profile.update_success'),
          showCancel: false,
          onConfirm: () => navigation.goBack(),
        });
      } else {
        showConfirm({
          title: t('common.error'),
          message: t('common.error'),
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
        <ScrollView
          ref={scrollViewRef}
          style={currentStyles.scrollView}
          contentContainerStyle={currentStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Information Card */}
          <View style={currentStyles.card}>
            <Text style={currentStyles.cardTitle}>{t('profile.personal_info')}</Text>

            {/* Avatar */}
            <TouchableOpacity
              testID="edit-profile-avatar-button"
              style={currentStyles.avatarRow}
              activeOpacity={0.85}
              onPress={() => setShowAvatarPicker(true)}
            >
              <View>
                <Avatar
                  uri={user?.selectedAvatar?.url}
                  name={user?.name || 'U'}
                  size={72}
                  showLoading
                />
                <View style={currentStyles.avatarBadge}>
                  <Ionicons name="camera" size={13} color="#fff" />
                </View>
              </View>
              <Text style={currentStyles.avatarChangeText}>
                {t('avatar_picker.change', 'Change avatar')}
              </Text>
            </TouchableOpacity>

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
                <Text style={[currentStyles.readonlyText, { textAlign: 'left' }]}>
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
                  {
                    borderColor: getBorderColor(
                      'email',
                      touchedEmail,
                      isEmailValid,
                      formData.email,
                    ),
                  },
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
                  style={[currentStyles.input, { textAlign: INPUT_TEXT_ALIGN }]}
                  value={formData.email}
                  onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
                  placeholder="example@mail.com"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => {
                    setFocusedField(null);
                    setTouchedEmail(true);
                  }}
                />
              </View>
              {touchedEmail && !isEmailValid && formData.email.length > 0 && (
                <Text style={currentStyles.errorText}>{t('auth.invalid_email_format')}</Text>
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
                      formData.gender === 'male' ? theme.colors.primary : theme.colors.textSecondary
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
                    borderColor: formData.governorate_id
                      ? theme.colors.primary
                      : theme.colors.border,
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
                    currentStyles.schoolText,
                    {
                      textAlign: 'left',
                      color: formData.governorate_id
                        ? theme.colors.text
                        : theme.colors.textTertiary,
                    },
                  ]}
                >
                  {selectedGovName || t('profile.select_governorate', 'Select Governorate')}
                </Text>
                {fetchingGov && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                    style={{ marginRight: spacing.md }}
                  />
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
                  .filter((g) => {
                    const name = isRTL ? g.name_ar || g.name : g.name_en || g.name;
                    return name.toLowerCase().includes(govSearch.toLowerCase());
                  })
                  .map((g) => ({
                    ...g,
                    name: isRTL ? g.name_ar || g.name : g.name_en || g.name,
                  }))}
                onSelect={(gov) => {
                  setFormData((p) => ({ ...p, governorate_id: gov.id, city_id: '' }));
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
                    currentStyles.schoolText,
                    {
                      textAlign: 'left',
                      color: formData.city_id ? theme.colors.text : theme.colors.textTertiary,
                    },
                  ]}
                >
                  {selectedCityName ||
                    (formData.governorate_id
                      ? t('profile.select_city', 'Select City')
                      : t('profile.select_gov_first', 'Select Governorate First'))}
                </Text>
                {fetchingCities && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                    style={{ marginRight: spacing.md }}
                  />
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
                  setFormData((p) => ({ ...p, city_id: city.id }));
                  setShowCityModal(false);
                  setCitySearch('');
                }}
                onAddNew={handleAddCity}
                addingNew={addingCity}
              />
            </View>

            {/* School Name */}
            <View style={[currentStyles.inputGroup]}>
              <Text style={currentStyles.inputLabel}>
                {t('profile.school_name', 'School Name')}
              </Text>
              <TouchableOpacity
                style={[
                  currentStyles.inputWrapper,
                  {
                    borderColor: getBorderColor(
                      'school',
                      touchedSchool,
                      isSchoolValid,
                      formData.school_name,
                    ),
                    height: 56,
                    justifyContent: 'space-between',
                    paddingHorizontal: spacing.md,
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
                    style={[
                      currentStyles.schoolText,
                      {
                        color:
                          formData.school_name.length > 0
                            ? theme.colors.text
                            : theme.colors.textTertiary,
                        textAlign: 'left',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {formData.school_name || t('profile.school_placeholder')}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textTertiary} />
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
                  const selectedName = isRTL
                    ? school.name || school.name_en
                    : school.name_en || school.name;
                  setFormData((p) => ({ ...p, school_name: selectedName }));
                  setShowSchoolModal(false);
                  setSchoolSearch('');
                }}
                emptyMessage={t('auth.no_schools_found')}
                searchHelperText={t('auth.start_typing_school')}
                onAddNew={handleAddSchool}
                addingNew={addingSchool}
              />
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
                <Text style={[currentStyles.readonlyText, { textAlign: 'left' }]}>
                  {user?.grade?.name || user?.educational_system?.name || '---'}
                </Text>
              </View>
              <Text style={currentStyles.hintText}>
                {t('profile.grade_not_editable', 'Grade cannot be changed')}
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={currentStyles.submitButton}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={currentStyles.submitButtonText}>
              {t('profile.complete_profile', 'Complete Profile')}
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            )}
          </TouchableOpacity>

          {/* The ONLY password path (BKLT-287). The in-profile change-password
              form was removed: it duplicated this flow with weaker guarantees,
              and the WhatsApp reset is the single scenario the backend supports
              end to end. It always ends signed out, because the server revokes
              every token on reset. */}
          <View style={currentStyles.card}>
            <TouchableOpacity
              testID="profile-reset-password-button"
              style={currentStyles.passwordToggle}
              onPress={() => navigation.navigate('ResetPassword')}
              activeOpacity={0.7}
            >
              <View style={currentStyles.passwordToggleLeft}>
                <Ionicons name="key-outline" size={20} color={theme.colors.primary} />
                <Text style={currentStyles.passwordToggleText}>
                  {t('auth.reset_password_button')}
                </Text>
              </View>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            <Text style={currentStyles.resetPasswordHint}>{t('profile.reset_password_hint')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AvatarPickerModal visible={showAvatarPicker} onClose={() => setShowAvatarPicker(false)} />
    </View>
  );
};

const styles = (config: any) => {
  const { theme, common, fontSizes, spacing, borderRadius, isRTL, typography, fontWeight, insets } =
    config;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: insets.bottom + spacing.xl,
    },
    card: {
      width: '100%',
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl || 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      marginBottom: spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    cardTitle: {
      ...typography('h3'),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: spacing.md,
      textAlign: 'left',
    },
    avatarRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    avatarBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarChangeText: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.primary,
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
      overflow: 'hidden',
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
      ...typography('body'),
      color: theme.colors.text,
      height: '100%',
      paddingRight: spacing.md,
    },
    schoolText: {
      ...typography('body'),
      color: theme.colors.text,
      flex: 1,
    },
    hintText: {
      fontSize: 12,
      ...typography('caption'),
      color: theme.colors.textTertiary,
      marginTop: spacing.xs,
      textAlign: 'left',
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
      width: '100%',
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
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    submitButtonText: {
      ...typography('button'),
      ...fontWeight('700'),
      color: '#FFFFFF',
      marginEnd: spacing.sm,
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
      paddingVertical: spacing.sm,
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
    resetPasswordHint: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: 'left',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    errorText: {
      ...typography('caption'),
      color: '#FF6B6B',
      marginTop: 4,
      textAlign: 'left',
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
