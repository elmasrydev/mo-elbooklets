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
import { useIsFocused } from '@react-navigation/native';

interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
  percentage: number;
  needsGender: boolean;
  needsSchool: boolean;
  needsParentMobile: boolean;
  needsEmail: boolean;
}



interface School {
  id: string;
  name: string;
  name_en?: string;
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
  const isFocused = useIsFocused();

  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);

  useEffect(() => {
    if (isVisible !== undefined) {
      setVisible(isVisible);
      if (isVisible && completeness) {
        const nextField = determineNextField(completeness);
        setCurrentField(nextField);
      }
    }
  }, [isVisible, completeness]);

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);


  // Form states
  const [gender, setGender] = useState<string>('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [parentMobile, setParentMobile] = useState('');

  
  const [schoolSuggestions, setSchoolSuggestions] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [currentField, setCurrentField] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && isFocused) {
      // Delay slightly to ensure screen transitions are complete before showing modal
      const timer = setTimeout(() => {
        checkCompleteness();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user?.id, isFocused]);

  const checkCompleteness = async () => {
    if (!isFocused && isVisible === undefined) return;
    
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
          const nextField = determineNextField(data);
          
          if (nextField) {
            setCurrentField(nextField);
            // Only show automatically if not parentally triggered or if context matches
            if (isVisible === undefined) {
               setVisible(true);
            } else if (isVisible) {
               setVisible(true);
            }
          } else {
            // No field matches current context, or all handled fields are complete.
            // Hide the modal and notify parent.
            if (isVisible === undefined) {
              setVisible(false);
            }
            if (onClose) onClose();
          }
        } else {
          // Profile is completely done on the backend
          if (isVisible === undefined) {
            setVisible(false);
          }
          if (onClose) onClose();
        }
      }
    } catch (err) {
      console.error('Check completeness error:', err);
    }
  };

  const determineNextField = (data: ProfileCompleteness): string | null => {


    // 2. Tab-specific filtering
    if (context === 'study' || context === 'quiz') {
      if (data.needsEmail) {
        return 'email';
      }
    }

    if (context === 'more') {
      if (data.needsEmail) return 'email';
      if (data.needsGender) return 'gender';
      if (data.needsSchool) return 'school_name';
      if (data.needsParentMobile) return 'parent_mobile';
    }

    if (context === 'community') {
      if (data.needsGender) {
        return 'gender';
      }
      if (data.needsSchool) {
        return 'school_name';
      }
    }

    if (context === 'parental') {
      if (data.needsParentMobile) {
        return 'parent_mobile';
      }
    }

    // Default: if no context or no needs match context, stop
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
        token || undefined
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

  const handleUpdate = async () => {
    if (!currentField) return;

    let value: any = null;

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
        Keyboard.dismiss();
        await refreshUser();
        
        // Add a small delay to allow keyboard to dismiss before checking completeness
        // which might close the modal. This prevents the modal unmount freeze bug.
        setTimeout(() => {
          checkCompleteness();
        }, 150);
      }
    } catch (err) {
      console.error('Update profile error:', err);
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
          style={[styles.card, { backgroundColor: theme.colors.card, borderRadius: borderRadius.xl }]}
          onStartShouldSetResponder={() => true}
        >
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
            {!currentField && (
               <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 40 }} />
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
                      onChangeText={(val) => {
                        setSchoolName(val);
                        fetchSchoolSuggestions(val);
                      }}
                      onFocus={() => schoolName.length >= 2 && setShowSuggestions(true)}
                      placeholder={t('profile.school_placeholder', 'Your school name')}
                   />
                   {loadingSchools && <ActivityIndicator size="small" color={theme.colors.primary} />}
                 </View>
                 
                 {showSuggestions && schoolSuggestions.length > 0 && (
                   <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                     <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                       {schoolSuggestions.map((school) => (
                         <TouchableOpacity
                           key={school.id}
                           style={[styles.suggestionItem, { borderBottomColor: theme.colors.border }]}
                           onPress={() => {
                             setSchoolName(isRTL ? school.name : (school.name_en || school.name));
                             setShowSuggestions(false);
                           }}
                         >
                           <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                             {school.name}
                           </Text>
                           {school.name_en && (
                             <Text style={[styles.suggestionTextEn, { color: theme.colors.textTertiary }]}>
                               {school.name_en}
                             </Text>
                           )}
                         </TouchableOpacity>
                       ))}
                     </ScrollView>
                   </View>
                 )}
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
                (currentField === 'gender' && !gender) ||
                (currentField === 'email' && !email) ||
                (currentField === 'school_name' && !schoolName) ||
                (currentField === 'parent_mobile' && !parentMobile)
              }
            />
               <TouchableOpacity onPress={skipField} style={styles.skipButton}>
                 <Text style={[styles.skipText, typography('caption'), { color: theme.colors.textTertiary }]}>
                   {t('common.skip_for_now', 'Skip for now')}
                 </Text>
               </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  suggestionsContainer: {
    position: 'absolute',
    top: 85,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderWidth: 1,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  suggestionItem: {
    padding: 12,
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
});

export default ProfileCompletionPrompt;
