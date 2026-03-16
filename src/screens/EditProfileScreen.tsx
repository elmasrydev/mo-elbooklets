import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
import { layout } from '../config/layout';

interface EducationalSystem {
  id: string;
  name: string;
}

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { typography, fontWeight } = useTypography();

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

  useEffect(() => {
    fetchEduSystems();
  }, []);

  const fetchEduSystems = async () => {
    try {
      setFetchingEdu(true);
      const result = await tryFetchWithFallback(`query GetEduSystems { educationalSystems { id name } }`);
      if (result.data?.educationalSystems) {
        setEduSystems(result.data.educationalSystems);
      }
    } catch (err) {
      console.error('Fetch edu systems error:', err);
    } finally {
      setFetchingEdu(false);
    }
  };

  const handleSave = async () => {
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
        token
      );

      if (result.data?.updateProfile) {
        await refreshUser();
        Alert.alert(t('common.success'), t('profile.update_success', 'Profile updated successfully'));
        navigation.goBack();
      } else {
        const errorMsg = result.errors?.[0]?.message || t('common.error');
        Alert.alert(t('common.error'), errorMsg);
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      Alert.alert(t('common.error'), err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const renderLabel = (label: string) => (
    <Text style={[styles.label, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
      {label}
    </Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader showBackButton title={t('profile_screen.edit_profile')} />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name (Readonly) */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('auth.name'))}
          <View style={[styles.inputBox, { backgroundColor: theme.colors.border + '33', borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textTertiary }}>{user?.name}</Text>
          </View>
          <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
            {t('profile.name_not_editable', 'Name cannot be changed manually')}
          </Text>
        </View>

        {/* Mobile (Readonly) */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('auth.mobile'))}
          <View style={[styles.inputBox, { backgroundColor: theme.colors.border + '33', borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textTertiary }}>{user?.country_code} {user?.mobile}</Text>
          </View>
        </View>

        {/* Email */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('auth.email', 'Email Address'))}
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, textAlign: isRTL ? 'right' : 'left' }]}
            value={formData.email}
            onChangeText={(v) => setFormData(p => ({ ...p, email: v }))}
            placeholder="example@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* School Name */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('profile.school_name', 'School Name'))}
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, textAlign: isRTL ? 'right' : 'left' }]}
            value={formData.school_name}
            onChangeText={(v) => setFormData(p => ({ ...p, school_name: v }))}
            placeholder={t('profile.school_placeholder')}
          />
        </View>

        {/* Gender */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('profile.gender', 'Gender'))}
          <View style={styles.genderRow}>
            <TouchableOpacity 
              style={[
                styles.genderTab, 
                { borderColor: theme.colors.border },
                formData.gender === 'male' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '1A' }
              ]}
              onPress={() => setFormData(p => ({ ...p, gender: 'male' }))}
            >
              <Ionicons name="man-outline" size={20} color={formData.gender === 'male' ? theme.colors.primary : theme.colors.textTertiary} />
              <Text style={{ marginLeft: 8, color: formData.gender === 'male' ? theme.colors.primary : theme.colors.text }}>
                {t('profile.male')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.genderTab, 
                { borderColor: theme.colors.border },
                formData.gender === 'female' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '1A' }
              ]}
              onPress={() => setFormData(p => ({ ...p, gender: 'female' }))}
            >
              <Ionicons name="woman-outline" size={20} color={formData.gender === 'female' ? theme.colors.primary : theme.colors.textTertiary} />
              <Text style={{ marginLeft: 8, color: formData.gender === 'female' ? theme.colors.primary : theme.colors.text }}>
                {t('profile.female')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Educational System */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('auth.educational_system'))}
          {fetchingEdu ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <View style={styles.eduSystemsList}>
              {eduSystems.map(sys => (
                <TouchableOpacity 
                  key={sys.id}
                  style={[
                    styles.eduItem,
                    { borderColor: theme.colors.border },
                    formData.educational_system_id === sys.id && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '1A' }
                  ]}
                  onPress={() => setFormData(p => ({ ...p, educational_system_id: sys.id }))}
                >
                  <Text style={{ color: formData.educational_system_id === sys.id ? theme.colors.primary : theme.colors.text }}>
                    {sys.name}
                  </Text>
                  {formData.educational_system_id === sys.id && (
                    <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Parent Mobile */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('profile_screen.parental_linking'))}
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, textAlign: isRTL ? 'right' : 'left' }]}
            value={formData.parent_mobile}
            onChangeText={(v) => setFormData(p => ({ ...p, parent_mobile: v }))}
            placeholder="01xxxxxxxxx"
            keyboardType="phone-pad"
          />
        </View>

        <AppButton 
          title={t('common.save')}
          onPress={handleSave}
          loading={loading}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputBox: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderTab: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eduSystemsList: {
    gap: 8,
  },
  eduItem: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default EditProfileScreen;
