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

interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
  percentage: number;
  needsGender: boolean;
  needsSchool: boolean;
  needsParentMobile: boolean;
  needsEmail: boolean;
  needsEducationalSystem: boolean;
}

interface EducationalSystem {
  id: string;
  name: string;
}

interface ProfileCompletionPromptProps {
  context?: 'study' | 'quiz' | 'more' | 'community' | 'parental';
  isVisible?: boolean;
  onClose?: () => void;
}

const ProfileCompletionPrompt: React.FC<ProfileCompletionPromptProps> = ({ 
  context, 
  isVisible, 
  onClose 
}) => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { typography, fontWeight } = useTypography();

  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);

  useEffect(() => {
    if (isVisible !== undefined) {
      setVisible(isVisible);
      if (isVisible && completeness) {
        determineNextField(completeness);
      }
    }
  }, [isVisible, completeness]);

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [eduSystems, setEduSystems] = useState<EducationalSystem[]>([]);

  // Form states
  const [gender, setGender] = useState<string>('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [selectedEduSystem, setSelectedEduSystem] = useState<string>('');

  const [currentField, setCurrentField] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkCompleteness();
    }
  }, [user]);

  const checkCompleteness = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `query ProfileCompleteness { 
          profileCompleteness { 
            isComplete missingFields percentage needsGender needsSchool 
            needsParentMobile needsEmail needsEducationalSystem 
          } 
        }`,
        undefined,
        token
      );

      if (result.data?.profileCompleteness) {
        const data = result.data.profileCompleteness;
        setCompleteness(data);
        
        if (!data.isComplete) {
          // Only show automatically if not parentally triggered or if context matches
          // For 'parental' context from ProfileScreen, we rely on isVisible prop
          if (isVisible === undefined) {
             setVisible(true);
             determineNextField(data);
          } else if (isVisible) {
             determineNextField(data);
          }
        } else {
          if (isVisible === undefined) {
            setVisible(false);
          }
        }
      }
    } catch (err) {
      console.error('Check completeness error:', err);
    }
  };

  const determineNextField = (data: ProfileCompleteness) => {
    // 1. Critical: Educational System (always first if missing)
    if (data.needsEducationalSystem) {
      setCurrentField('educational_system_id');
      fetchEduSystems();
      return;
    }

    // 2. Tab-specific filtering
    if (context === 'study' || context === 'quiz' || context === 'more') {
      if (data.needsEmail) {
        setCurrentField('email');
        return;
      }
    }

    if (context === 'community') {
      if (data.needsGender) {
        setCurrentField('gender');
        return;
      }
      if (data.needsSchool) {
        setCurrentField('school_name');
        return;
      }
    }

    if (context === 'parental') {
      if (data.needsParentMobile) {
        setCurrentField('parent_mobile');
        return;
      }
    }

    // Default: if no context or no needs match context, stop
    setCurrentField(null);
  };

  const fetchEduSystems = async () => {
    try {
      setLoading(true);
      const result = await tryFetchWithFallback(`query GetEduSystems { educationalSystems { id name } }`);
      if (result.data?.educationalSystems) {
        setEduSystems(result.data.educationalSystems);
      }
    } catch (err) {
      console.error('Fetch edu systems error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentField) return;

    let value: any = null;
    if (currentField === 'educational_system_id') value = selectedEduSystem;
    if (currentField === 'gender') value = gender;
    if (currentField === 'email') value = email;
    if (currentField === 'school_name') value = schoolName;
    if (currentField === 'parent_mobile') value = parentMobile;

    if (!value) return;

    try {
      setUpdating(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `mutation UpdateProfile($input: UpdateProfileInput!) { 
          updateProfile(input: $input) { id name } 
        }`,
        { input: { [currentField]: value } },
        token
      );

      if (result.data?.updateProfile) {
        await refreshUser();
        await checkCompleteness();
      }
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const skipField = () => {
    // In a real app we might allow skipping some fields, 
    // but if Ed System is missing, Subjects query will crash, 
    // so we should probably enforce it.
    if (currentField === 'educational_system_id') return;
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible || !currentField) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius: borderRadius.xl }]}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '1A' }]}>
              <Ionicons name="person-circle-outline" size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { ...typography('h3'), ...fontWeight('bold'), color: theme.colors.text }]}>
              {t('profile.complete_your_profile', 'Complete Your Profile')}
            </Text>
            <Text style={[styles.subtitle, { ...typography('caption'), color: theme.colors.textSecondary }]}>
              {t('profile.completeness_incentive', 'Help us personalize your learning experience')}
            </Text>
          </View>

          <View style={styles.progressContainer}>
             <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View style={[styles.progressFill, { width: `${completeness?.percentage || 0}%`, backgroundColor: theme.colors.primary }]} />
             </View>
             <Text style={[styles.progressText, { ...typography('caption'), color: theme.colors.textSecondary }]}>
                {Math.round(completeness?.percentage || 0)}%
             </Text>
          </View>

          <View style={styles.content}>
            {currentField === 'educational_system_id' && (
              <View>
                <Text style={[styles.fieldLabel, typography('body'), fontWeight('600'), { color: theme.colors.text }]}>
                  {t('auth.select_edu_system', 'Select Educational System')}
                </Text>
                {loading ? (
                  <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <ScrollView style={[styles.optionsList, { maxHeight: 200 }]}>
                    {eduSystems.map((sys) => (
                      <TouchableOpacity
                        key={sys.id}
                        style={[
                          styles.optionItem,
                          { borderColor: theme.colors.border },
                          selectedEduSystem === sys.id && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '0A' }
                        ]}
                        onPress={() => setSelectedEduSystem(sys.id)}
                      >
                        <Text style={[
                          styles.optionText,
                          { color: theme.colors.text },
                          selectedEduSystem === sys.id && { color: theme.colors.primary, ...fontWeight('bold') }
                        ]}>
                          {sys.name}
                        </Text>
                        {selectedEduSystem === sys.id && (
                          <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {currentField === 'gender' && (
              <View>
                <Text style={[styles.fieldLabel, typography('body'), fontWeight('600'), { color: theme.colors.text }]}>
                  {t('profile.select_gender', 'Select Gender')}
                </Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    style={[
                      styles.genderItem,
                      { borderColor: theme.colors.border },
                      gender === 'male' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '0A' }
                    ]}
                    onPress={() => setGender('male')}
                  >
                    <Ionicons name="man-outline" size={40} color={gender === 'male' ? theme.colors.primary : theme.colors.textTertiary} />
                    <Text style={[styles.genderText, gender === 'male' ? { color: theme.colors.primary, ...fontWeight('bold') } : { color: theme.colors.text }]}>
                      {t('profile.male', 'Male')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderItem,
                      { borderColor: theme.colors.border },
                      gender === 'female' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '0A' }
                    ]}
                    onPress={() => setGender('female')}
                  >
                    <Ionicons name="woman-outline" size={40} color={gender === 'female' ? theme.colors.primary : theme.colors.textTertiary} />
                    <Text style={[styles.genderText, gender === 'female' ? { color: theme.colors.primary, ...fontWeight('bold') } : { color: theme.colors.text }]}>
                      {t('profile.female', 'Female')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {currentField === 'email' && (
               <View>
                 <Text style={[styles.fieldLabel, typography('body'), fontWeight('600'), { color: theme.colors.text }]}>
                   {t('profile.enter_email', 'Enter Email Address')}
                 </Text>
                 <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                   <Ionicons name="mail-outline" size={20} color={theme.colors.textTertiary} />
                   <TextInput
                      style={[styles.input, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}
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
                 <Text style={[styles.fieldLabel, typography('body'), fontWeight('600'), { color: theme.colors.text }]}>
                   {t('profile.enter_school', 'Enter School Name')}
                 </Text>
                 <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                   <Ionicons name="business-outline" size={20} color={theme.colors.textTertiary} />
                   <TextInput
                      style={[styles.input, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                      value={schoolName}
                      onChangeText={setSchoolName}
                      placeholder={t('profile.school_placeholder', 'Your school name')}
                   />
                 </View>
               </View>
            )}

            {currentField === 'parent_mobile' && (
               <View>
                 <Text style={[styles.fieldLabel, typography('body'), fontWeight('600'), { color: theme.colors.text }]}>
                   {t('profile.enter_parent_mobile', "Enter Parent's Mobile")}
                 </Text>
                 <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                   <Ionicons name="call-outline" size={20} color={theme.colors.textTertiary} />
                   <TextInput
                      style={[styles.input, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                      value={parentMobile}
                      onChangeText={setParentMobile}
                      placeholder="01xxxxxxxxx"
                      keyboardType="phone-pad"
                   />
                 </View>
               </View>
            )}
          </View>

          <View style={styles.footer}>
            <AppButton
              title={t('common.save_and_continue', 'Save & Continue')}
              onPress={handleUpdate}
              loading={updating}
              disabled={
                (currentField === 'educational_system_id' && !selectedEduSystem) ||
                (currentField === 'gender' && !gender) ||
                (currentField === 'email' && !email) ||
                (currentField === 'school_name' && !schoolName) ||
                (currentField === 'parent_mobile' && !parentMobile)
              }
            />
            {currentField !== 'educational_system_id' && (
               <TouchableOpacity onPress={skipField} style={styles.skipButton}>
                 <Text style={[styles.skipText, typography('caption'), { color: theme.colors.textTertiary }]}>
                   {t('common.skip_for_now', 'Skip for now')}
                 </Text>
               </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 3,
  },
  progressText: {
    width: 40,
    textAlign: 'right',
  },
  content: {
    marginBottom: 24,
  },
  fieldLabel: {
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 15,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 16,
  },
  genderItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    gap: 8,
  },
  genderText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  footer: {
    gap: 12,
  },
  skipButton: {
    alignItems: 'center',
    padding: 8,
  },
  skipText: {
    textDecorationLine: 'underline',
  },
});

export default ProfileCompletionPrompt;
