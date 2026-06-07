import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { tryFetchWithFallback } from '../config/api';
import * as SecureStore from 'expo-secure-store';
import AppButton from './AppButton';
import { useTypography } from '../hooks/useTypography';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import SearchablePickerModal from './SearchablePickerModal';

const EGYPTIAN_PHONE_REGEX = /^01[0125]\d{8}$/;

interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
  percentage: number;
  needsGender: boolean;
  needsSchool: boolean;
  needsParentMobile: boolean;
  needsEmail: boolean;
  needsEducationalSystem: boolean;
  needsGovernorate: boolean;
  needsCity: boolean;
}

interface EducationalSystem {
  id: string;
  name: string;
}

interface School {
  id: string;
  name: string;
  name_en?: string;
}

interface Location {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
}

interface ProfileCompletionPromptProps {
  context?: 'study' | 'quiz' | 'more' | 'community' | 'parental' | 'profile';
  isVisible?: boolean;
  onClose?: () => void;
  autoShow?: boolean;
  oneTimeAutoShow?: boolean;
}

let hasShownAutoInSession = false;

const ProfileCompletionPrompt: React.FC<ProfileCompletionPromptProps> = ({
  context,
  isVisible,
  onClose,
  autoShow = false,
  oneTimeAutoShow = false,
}) => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { typography, fontWeight } = useTypography();
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();

  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);

  useEffect(() => {
    if (isVisible !== undefined) {
      if (isVisible && completeness?.isComplete) {
        setVisible(false);
        if (onClose) onClose();
        return;
      }

      setVisible(isVisible);
      if (isVisible && completeness) {
        const nextField = determineNextField(completeness);
        if (nextField) {
          setCurrentField(nextField);
        } else if (completeness.isComplete) {
          setVisible(false);
          if (onClose) onClose();
        }
      }
    }
  }, [isVisible, completeness]);

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [gender, setGender] = useState<string>('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [educationalSystemId, setEducationalSystemId] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');

  const [schoolSuggestions, setSchoolSuggestions] = useState<School[]>([]);
  const [eduSystems, setEduSystems] = useState<EducationalSystem[]>([]);
  const [governorates, setGovernorates] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [fetchingEdu, setFetchingEdu] = useState(false);
  const [fetchingGov, setFetchingGov] = useState(false);
  const [fetchingCities, setFetchingCities] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showGovModal, setShowGovModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [govSearch, setGovSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');

  const [currentField, setCurrentField] = useState<string | null>(null);

  const [lastUserId, setLastUserId] = useState<string | null>(null);

  useEffect(() => {
    // Reset session flag if user changes (e.g. logout/login or register)
    if (user?.id && user.id !== lastUserId) {
      hasShownAutoInSession = false;
      setLastUserId(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      const shouldTriggerOneTime = oneTimeAutoShow && !hasShownAutoInSession;
      const shouldTriggerAuto = autoShow && isFocused;

      if (shouldTriggerOneTime || shouldTriggerAuto || isVisible) {
        // Sync local state with user object if available
        const gId = (user as any)?.governorate_id || user?.governorate?.id;
        const cId = (user as any)?.city_id || user?.city?.id;
        if (gId) setGovernorateId(String(gId));
        if (cId) setCityId(String(cId));

        const timer = setTimeout(
          () => {
            checkCompleteness();
            if (shouldTriggerOneTime) {
              hasShownAutoInSession = true;
            }
          },
          shouldTriggerOneTime ? 5000 : 150,
        );
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id, isFocused, isVisible, autoShow, oneTimeAutoShow]);

  const checkCompleteness = async () => {
    // If we're not focused AND it's not a manual visibility trigger AND it's not a one-time global trigger, exit
    if (!isFocused && isVisible === undefined && !oneTimeAutoShow) return;

    // If we ARE focused but auto-show is disabled AND it's not a manual/one-time trigger, exit
    if (isFocused && !autoShow && isVisible === undefined && !oneTimeAutoShow) return;

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `query ProfileCompleteness { 
          profileCompleteness { 
            isComplete missingFields percentage needsGender needsSchool 
            needsParentMobile needsEmail
          } 
        }`,
        undefined,
        token,
      );

      if (result.data?.profileCompleteness) {
        const data = result.data.profileCompleteness;
        setCompleteness(data);

        if (!data.isComplete) {
          const nextField = determineNextField(data);

          if (nextField) {
            setCurrentField(nextField);
            if (isVisible === undefined || isVisible) {
              setVisible(true);
            }
          } else {
            setVisible(false);
            if (onClose) onClose();
          }
        } else {
          setVisible(false);
          if (onClose) onClose();
        }
      }
    } catch (err) {
      console.error('Check completeness error:', err);
    }
  };

  const fetchEduSystems = async () => {
    try {
      setFetchingEdu(true);
      const token = await SecureStore.getItemAsync('auth_token');
      const result = await tryFetchWithFallback(
        `query GetEduSystems { educationalSystems { id name } }`,
        undefined,
        token || undefined,
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

  const fetchGovernorates = async () => {
    try {
      setFetchingGov(true);
      const query = `query GetGovernorates { governorates { id name_ar name_en } }`;
      const result = await tryFetchWithFallback(query);
      if (result.data?.governorates) {
        const mapped = result.data.governorates.map((g: any) => ({
          ...g,
          name: isRTL ? g.name_ar || g.name_en : g.name_en || g.name_ar,
        }));
        setGovernorates(mapped);
      }
    } catch (err) {
      console.error('Fetch governorates error:', err);
    } finally {
      setFetchingGov(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const gId = governorateId || (user as any)?.governorate_id || user?.governorate?.id;
      if (showCityModal && gId && (citySearch.length === 0 || citySearch.length >= 2)) {
        fetchCities(String(gId), citySearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [citySearch, showCityModal, governorateId, user]);

  const fetchCities = async (govId: string, search: string = '') => {
    try {
      setFetchingCities(true);
      const query = `
        query SearchCities($governorate_id: ID, $query: String!) {
          searchCities(governorate_id: $governorate_id, query: $query) {
            id name_ar name_en governorate_id
          }
        }
      `;
      const result = await tryFetchWithFallback(query, { governorate_id: govId, query: search });
      if (result.data?.searchCities) {
        const mapped = result.data.searchCities.map((c: any) => ({
          ...c,
          name: isRTL ? c.name_ar || c.name_en : c.name_en || c.name_ar,
        }));
        setCities(mapped);
      }
    } catch (err) {
      console.error('Fetch cities error:', err);
    } finally {
      setFetchingCities(false);
    }
  };

  useEffect(() => {
    if (visible && currentField === 'educational_system_id' && eduSystems.length === 0) {
      fetchEduSystems();
    }
    if (visible && currentField === 'governorate_id' && governorates.length === 0) {
      fetchGovernorates();
    }
    if (visible && currentField === 'city_id' && governorateId && cities.length === 0) {
      fetchCities(governorateId);
    }
  }, [visible, currentField, governorateId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSchoolModal && schoolSearch.length >= 2) {
        fetchSchoolSuggestions(schoolSearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [schoolSearch, showSchoolModal]);

  const determineNextField = (data: ProfileCompleteness): string | null => {
    if (context === 'study' || context === 'quiz') {
      if (data.needsEmail) return 'email';
    }

    if (context === 'more') {
      if (data.needsEmail) return 'email';
      if (data.needsGender) return 'gender';
      if (data.needsSchool) return 'school_name';
      if (data.needsParentMobile) return 'parent_mobile';
    }

    if (context === 'community') {
      if (data.needsGender) return 'gender';
      if (data.needsSchool) return 'school_name';
    }

    if (context === 'parental') {
      if (data.needsParentMobile) return 'parent_mobile';
    }

    if (data.needsEmail) return 'email';
    if (data.needsGender) return 'gender';
    if (data.needsSchool) return 'school_name';
    if (data.needsParentMobile) return 'parent_mobile';

    if (data.missingFields) {
      if (
        data.missingFields.includes('educational_system_id') ||
        data.missingFields.includes('educational_system')
      )
        return 'educational_system_id';
      if (
        data.missingFields.includes('governorate_id') ||
        data.missingFields.includes('governorate')
      )
        return 'governorate_id';
      if (data.missingFields.includes('city_id') || data.missingFields.includes('city'))
        return 'city_id';
    }

    return null;
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
        const mapped = result.data.searchSchools.map((s: any) => ({
          ...s,
          name: isRTL ? s.name || s.name_en : s.name_en || s.name,
        }));
        setSchoolSuggestions(mapped);
      }
    } catch (err) {
      console.error('Search schools error:', err);
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentField) return;

    let value: any = null;
    if (currentField === 'gender') value = gender;
    if (currentField === 'email') value = email;
    if (currentField === 'school_name') value = schoolName;
    if (currentField === 'parent_mobile') value = parentMobile;
    if (currentField === 'educational_system_id') value = educationalSystemId;
    if (currentField === 'governorate_id') value = governorateId;
    if (currentField === 'city_id') value = cityId;

    if (!value) return;

    try {
      setUpdating(true);
      setError(null);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `mutation UpdateProfile($input: UpdateProfileInput!) { 
          updateProfile(input: $input) { id name } 
        }`,
        { input: { [currentField]: value } },
        token,
      );

      if (result.data?.updateProfile) {
        Keyboard.dismiss();
        await refreshUser();
        setTimeout(() => {
          checkCompleteness();
        }, 150);
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      const msg = err?.message || err?.toString() || '';
      if (msg.includes('parent mobile')) {
        setError(t('auth.invalid_egyptian_mobile'));
      } else {
        setError(t('common.error_updating_profile', 'Failed to update profile'));
      }
    } finally {
      setUpdating(false);
    }
  };

  const skipField = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 150);
  };

  const goToSettings = () => {
    skipField();
    navigation.navigate('EditProfile');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={skipField}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderRadius: borderRadius.xl },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '1A' }]}>
              <Ionicons name="person-circle-outline" size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, typography('h3', 'bold'), { color: theme.colors.text }]}>
              {t('profile.complete_your_profile', 'Complete Your Profile')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                typography('caption'),
                { color: theme.colors.textSecondary },
              ]}
            >
              {t('profile.completeness_incentive', 'Help us personalize your learning experience')}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${completeness?.percentage || 0}%`,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                typography('caption'),
                { color: theme.colors.textSecondary },
              ]}
            >
              {Math.round(completeness?.percentage || 0)}%
            </Text>
          </View>

          <View style={styles.content}>
            {!currentField && (
              <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 40 }} />
            )}

            {currentField === 'gender' && (
              <View>
                <Text
                  style={[
                    styles.fieldLabel,
                    typography('body', '600'),
                    { color: theme.colors.text },
                  ]}
                >
                  {t('profile.select_gender', 'Select Gender')}
                </Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    style={[
                      styles.genderItem,
                      { borderColor: theme.colors.border },
                      gender === 'male' && {
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.primary + '0A',
                      },
                    ]}
                    onPress={() => setGender('male')}
                  >
                    <Ionicons
                      name="man-outline"
                      size={40}
                      color={gender === 'male' ? theme.colors.primary : theme.colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        gender === 'male' ? typography('body', 'bold') : typography('body'),
                        gender === 'male'
                          ? { color: theme.colors.primary }
                          : { color: theme.colors.text },
                      ]}
                    >
                      {t('profile.male', 'Male')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderItem,
                      { borderColor: theme.colors.border },
                      gender === 'female' && {
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.primary + '0A',
                      },
                    ]}
                    onPress={() => setGender('female')}
                  >
                    <Ionicons
                      name="woman-outline"
                      size={40}
                      color={gender === 'female' ? theme.colors.primary : theme.colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        gender === 'female' ? typography('body', 'bold') : typography('body'),
                        gender === 'female'
                          ? { color: theme.colors.primary }
                          : { color: theme.colors.text },
                      ]}
                    >
                      {t('profile.female', 'Female')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {currentField === 'email' && (
              <View>
                <Text
                  style={[
                    styles.fieldLabel,
                    typography('body', '600'),
                    { color: theme.colors.text },
                  ]}
                >
                  {t('profile.enter_email', 'Enter Email Address')}
                </Text>
                <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={theme.colors.textTertiary} />
                  <TextInput
                    style={[
                      styles.input,
                      typography('body'),
                      { color: theme.colors.text, textAlign: 'left' },
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="example@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {currentField === 'school_name' && (
              <View>
                <Text
                  style={[
                    styles.fieldLabel,
                    typography('body', '600'),
                    { color: theme.colors.text },
                  ]}
                >
                  {t('profile.enter_school', 'Enter School Name')}
                </Text>
                <TouchableOpacity
                  style={[styles.inputContainer, { borderColor: theme.colors.border }]}
                  onPress={() => setShowSchoolModal(true)}
                >
                  <Ionicons name="business-outline" size={20} color={theme.colors.textTertiary} />
                  <Text
                    style={[
                      styles.input,
                      typography('body'),
                      {
                        color: schoolName ? theme.colors.text : theme.colors.textTertiary,
                        textAlign: 'left',
                        paddingTop: Platform.OS === 'ios' ? 0 : 12,
                      },
                    ]}
                  >
                    {schoolName || t('profile.school_placeholder', 'Your school name')}
                  </Text>
                  {loadingSchools && (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  )}
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textTertiary} />
                </TouchableOpacity>

                <SearchablePickerModal
                  visible={showSchoolModal}
                  onClose={() => {
                    setShowSchoolModal(false);
                    setSchoolSearch('');
                  }}
                  title={t('profile.school_name')}
                  placeholder={t('profile.school_placeholder')}
                  searchValue={schoolSearch}
                  onSearchChange={setSchoolSearch}
                  selectedId={schoolName}
                  data={schoolSuggestions}
                  loading={loadingSchools}
                  onSelect={(school) => {
                    setSchoolName(school.name);
                    setShowSchoolModal(false);
                    setSchoolSearch('');
                  }}
                />
              </View>
            )}

            {currentField === 'parent_mobile' && (
              <View>
                <Text
                  style={[
                    styles.fieldLabel,
                    typography('body', '600'),
                    { color: theme.colors.text },
                  ]}
                >
                  {t('profile.enter_parent_mobile', "Enter Parent's Mobile")}
                </Text>
                <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                  <Ionicons name="call-outline" size={20} color={theme.colors.textTertiary} />
                  <TextInput
                    style={[
                      styles.input,
                      typography('body'),
                      { color: theme.colors.text, textAlign: 'left' },
                    ]}
                    value={parentMobile}
                    onChangeText={(val) => setParentMobile(val.replaceAll(/\D/g, '').slice(0, 11))}
                    placeholder="01xxxxxxxxx"
                    keyboardType="phone-pad"
                    maxLength={11}
                  />
                </View>
                {parentMobile.length > 0 && !EGYPTIAN_PHONE_REGEX.test(parentMobile) && (
                  <Text
                    style={[styles.errorText, typography('caption'), { color: theme.colors.error }]}
                  >
                    {t('auth.invalid_egyptian_mobile')}
                  </Text>
                )}
              </View>
            )}

            {currentField === 'educational_system_id' && (
              <View>
                <Text
                  style={[
                    styles.fieldLabel,
                    typography('body', '600'),
                    { color: theme.colors.text },
                  ]}
                >
                  {t('profile.select_educational_system', 'Select Educational System')}
                </Text>
                <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.optionsList}>
                    {fetchingEdu && (
                      <ActivityIndicator
                        color={theme.colors.primary}
                        style={{ marginVertical: 20 }}
                      />
                    )}
                    {eduSystems.map((system) => (
                      <TouchableOpacity
                        key={system.id}
                        style={[
                          styles.optionItem,
                          { borderColor: theme.colors.border, flexDirection: 'row' },
                          educationalSystemId === system.id && {
                            borderColor: theme.colors.primary,
                            backgroundColor: theme.colors.primary + '0A',
                          },
                        ]}
                        onPress={() => setEducationalSystemId(system.id)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            educationalSystemId === system.id
                              ? typography('body', 'bold')
                              : typography('body'),
                            { textAlign: 'left' },
                            educationalSystemId === system.id
                              ? { color: theme.colors.primary }
                              : { color: theme.colors.text },
                          ]}
                        >
                          {system.name}
                        </Text>
                        {educationalSystemId === system.id && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={theme.colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {currentField === 'governorate_id' && (
              <View>
                <Text
                  style={[
                    styles.fieldLabel,
                    typography('body', '600'),
                    { color: theme.colors.text },
                  ]}
                >
                  {t('profile.select_governorate', 'Select Governorate')}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  onPress={() => setShowGovModal(true)}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={governorateId ? theme.colors.primary : theme.colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.input,
                      typography('body'),
                      {
                        color: governorateId ? theme.colors.text : theme.colors.textTertiary,
                        textAlign: 'left',
                        paddingTop: Platform.OS === 'ios' ? 0 : 12,
                        flex: 1,
                      },
                    ]}
                  >
                    {governorates.find((g) => String(g.id) === String(governorateId))?.name ||
                      (user?.governorate
                        ? isRTL
                          ? user.governorate.name_ar
                          : user.governorate.name_en
                        : t('profile.select_governorate'))}
                  </Text>
                  {fetchingGov && <ActivityIndicator size="small" color={theme.colors.primary} />}
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textTertiary} />
                </TouchableOpacity>

                <SearchablePickerModal
                  visible={showGovModal}
                  onClose={() => setShowGovModal(false)}
                  title={t('profile.select_governorate')}
                  placeholder={t('common.search')}
                  searchValue={govSearch}
                  onSearchChange={setGovSearch}
                  selectedId={governorateId}
                  data={governorates.filter((g) =>
                    g.name.toLowerCase().includes(govSearch.toLowerCase()),
                  )}
                  onSelect={(gov) => {
                    setGovernorateId(String(gov.id));
                    setCityId('');
                    setShowGovModal(false);
                    setGovSearch('');
                    fetchCities(String(gov.id));
                  }}
                />
              </View>
            )}

            {currentField === 'city_id' && (
              <View>
                <Text
                  style={[
                    styles.fieldLabel,
                    typography('body', '600'),
                    { color: theme.colors.text },
                  ]}
                >
                  {t('profile.select_city', 'Select City')}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background,
                      opacity: !(governorateId || user?.governorate?.id) ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => (governorateId || user?.governorate?.id) && setShowCityModal(true)}
                >
                  <Ionicons
                    name="map-outline"
                    size={20}
                    color={cityId ? theme.colors.primary : theme.colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.input,
                      typography('body'),
                      {
                        color: cityId ? theme.colors.text : theme.colors.textTertiary,
                        textAlign: 'left',
                        paddingTop: Platform.OS === 'ios' ? 0 : 12,
                        flex: 1,
                      },
                    ]}
                  >
                    {cities.find((c) => String(c.id) === String(cityId))?.name ||
                      (user?.city
                        ? isRTL
                          ? user.city.name_ar
                          : user.city.name_en
                        : governorateId || user?.governorate?.id
                          ? t('profile.select_city')
                          : t('profile.select_gov_first', 'Select Governorate First'))}
                  </Text>
                  {fetchingCities && (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  )}
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textTertiary} />
                </TouchableOpacity>

                <SearchablePickerModal
                  visible={showCityModal}
                  onClose={() => setShowCityModal(false)}
                  title={t('profile.select_city')}
                  placeholder={t('common.search')}
                  searchValue={citySearch}
                  onSearchChange={setCitySearch}
                  selectedId={cityId}
                  data={cities}
                  loading={fetchingCities}
                  onSelect={(city) => {
                    setCityId(String(city.id));
                    setShowCityModal(false);
                    setCitySearch('');
                  }}
                />
              </View>
            )}

            {error && (
              <Text
                style={[
                  styles.errorText,
                  typography('caption'),
                  { color: theme.colors.error, marginTop: 12, textAlign: 'center' },
                ]}
              >
                {error}
              </Text>
            )}
          </View>

          <View style={styles.footer}>
            <AppButton
              title={t('common.save_and_continue', 'Save & Continue')}
              onPress={handleUpdate}
              loading={updating}
              disabled={
                (currentField === 'gender' && !gender) ||
                (currentField === 'email' && !email) ||
                (currentField === 'school_name' && !schoolName) ||
                (currentField === 'educational_system_id' && !educationalSystemId) ||
                (currentField === 'governorate_id' && !governorateId) ||
                (currentField === 'city_id' && !cityId) ||
                (currentField === 'parent_mobile' &&
                  (!parentMobile || !EGYPTIAN_PHONE_REGEX.test(parentMobile)))
              }
            />
            <View style={styles.secondaryActions}>
              <TouchableOpacity onPress={skipField} style={styles.skipButton}>
                <Text
                  style={[
                    styles.skipText,
                    typography('caption'),
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {t('common.skip_for_now', 'Skip for now')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goToSettings} style={styles.settingsButton}>
                <Text
                  style={[
                    styles.settingsText,
                    typography('caption', 'bold'),
                    { color: theme.colors.primary },
                  ]}
                >
                  {t('profile.complete_in_settings', 'Complete in Settings')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  errorText: {
    marginTop: 8,
    marginStart: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    minWidth: 35,
    textAlign: 'right',
  },
  content: {
    marginBottom: 24,
  },
  fieldLabel: {
    marginBottom: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 16,
  },
  genderItem: {
    flex: 1,
    height: 100,
    borderWidth: 2,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  genderText: {
    // fontSize handled by typography('body')
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    // fontSize handled by typography('body')
  },
  footer: {
    gap: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  skipButton: {
    paddingVertical: 8,
  },
  settingsButton: {
    paddingVertical: 8,
  },
  skipText: {
    textDecorationLine: 'underline',
  },
  settingsText: {
    // textDecorationLine: 'underline',
  },
  suggestionsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'absolute',
    top: 85,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionTextEn: {
    fontSize: 12,
    marginTop: 2,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    // fontSize handled by typography('body')
    flex: 1,
  },
});

export default ProfileCompletionPrompt;
