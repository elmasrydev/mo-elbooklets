import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { tryFetchWithFallback } from '../config/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [pickerModalVisible, setPickerModalVisible] = useState<'grade' | 'system' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const insets = useSafeAreaInsets();

  const [gradesData, setGradesData] = useState<{ grades: any[] } | null>(null);
  const [systemsData, setSystemsData] = useState<{ educationalSystems: any[] } | null>(null);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [systemsLoading, setSystemsLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
    fetchSystems();
  }, []);

  const fetchGrades = async () => {
    try {
      setGradesLoading(true);
      const result = await tryFetchWithFallback(`query GetGrades { grades { id name } }`);
      if (result.data) setGradesData(result.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setGradesLoading(false);
    }
  };

  const fetchSystems = async () => {
    try {
      setSystemsLoading(true);
      const result = await tryFetchWithFallback(
        `query GetSystems { educationalSystems { id name } }`,
      );
      if (result.data) setSystemsData(result.data);
    } catch (error) {
      console.error('Error fetching systems:', error);
    } finally {
      setSystemsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !mobile.trim() ||
      !password.trim() ||
      !selectedGrade ||
      !selectedSystem
    ) {
      Alert.alert(t('common.error'), t('auth.fill_all_fields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwords_not_match'));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.password_too_short'));
      return;
    }
    setIsLoading(true);
    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        grade_id: selectedGrade,
        educational_system_id: selectedSystem,
      });
      if (!result.success)
        Alert.alert(t('auth.registration_failed'), result.error || t('auth.registration_error'));
    } catch (error) {
      Alert.alert(t('common.error'), t('common.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius);

  return (
    <KeyboardAvoidingView
      style={[
        currentStyles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 15 },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Floating Close Button */}
      <TouchableOpacity
        style={[
          currentStyles.closeButton,
          { top: insets.top + spacing.sm },
          common.start(spacing.lg),
        ]}
        onPress={onNavigateToLogin}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={28} color={theme.colors.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={currentStyles.scrollContainer}>
        <View style={currentStyles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={currentStyles.logo}
            resizeMode="contain"
          />
          <Text style={currentStyles.title}> {t('auth.register')} </Text>
          <Text style={currentStyles.subtitle}> {t('auth.sign_up_subtitle')} </Text>
        </View>

        <View style={currentStyles.form}>
          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}> {t('auth.name')} </Text>
            <TextInput
              style={currentStyles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('auth.name_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              editable={!isLoading}
              textAlign={common.textAlign as any}
            />
          </View>
          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}> {t('auth.email')} </Text>
            <TextInput
              style={currentStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign as any}
            />
          </View>
          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}> {t('auth.mobile_number')} </Text>
            <TextInput
              style={currentStyles.input}
              value={mobile}
              onChangeText={setMobile}
              placeholder={t('auth.mobile_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign as any}
            />
          </View>

          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}> {t('more_screen.grade')} </Text>
            {gradesLoading ? (
              <View style={currentStyles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={currentStyles.loadingText}>
                  {' '}
                  {t('home_screen.loading_activities')}{' '}
                </Text>
              </View>
            ) : Platform.OS === 'ios' ? (
              <TouchableOpacity
                style={currentStyles.input}
                onPress={() => setPickerModalVisible('grade')}
              >
                <Text
                  style={{
                    color: selectedGrade ? theme.colors.text : theme.colors.textSecondary,
                    textAlign: common.textAlign,
                    width: '100%',
                  }}
                >
                  {selectedGrade
                    ? gradesData?.grades?.find((g: any) => g.id === selectedGrade)?.name
                    : t('auth.select_grade')}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={currentStyles.pickerContainer}>
                <Picker
                  selectedValue={selectedGrade}
                  onValueChange={setSelectedGrade}
                  enabled={!isLoading}
                  style={currentStyles.picker}
                  dropdownIconColor={theme.colors.text}
                  mode="dropdown"
                >
                  <Picker.Item label={t('auth.select_grade')} value="" />
                  {gradesData?.grades?.map((grade: any) => (
                    <Picker.Item key={grade.id} label={grade.name} value={grade.id} />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}> {t('auth.educational_system')} </Text>
            {systemsLoading ? (
              <View style={currentStyles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={currentStyles.loadingText}>
                  {' '}
                  {t('home_screen.loading_activities')}{' '}
                </Text>
              </View>
            ) : Platform.OS === 'ios' ? (
              <TouchableOpacity
                style={currentStyles.input}
                onPress={() => setPickerModalVisible('system')}
              >
                <Text
                  style={{
                    color: selectedSystem ? theme.colors.text : theme.colors.textSecondary,
                    textAlign: common.textAlign,
                    width: '100%',
                  }}
                >
                  {selectedSystem
                    ? systemsData?.educationalSystems?.find((s: any) => s.id === selectedSystem)
                        ?.name
                    : t('auth.select_educational_system')}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={currentStyles.pickerContainer}>
                <Picker
                  selectedValue={selectedSystem}
                  onValueChange={setSelectedSystem}
                  enabled={!isLoading}
                  style={currentStyles.picker}
                  dropdownIconColor={theme.colors.text}
                  mode="dropdown"
                >
                  <Picker.Item label={t('auth.select_educational_system')} value="" />
                  {systemsData?.educationalSystems?.map((system: any) => (
                    <Picker.Item key={system.id} label={system.name} value={system.id} />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}> {t('auth.password')} </Text>
            <TextInput
              style={currentStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign as any}
            />
          </View>
          <View style={currentStyles.inputContainer}>
            <Text style={currentStyles.label}> {t('auth.confirm_password')} </Text>
            <TextInput
              style={currentStyles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('auth.confirm_password_placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
              textAlign={common.textAlign as any}
            />
          </View>

          <TouchableOpacity
            style={[currentStyles.registerButton, isLoading && currentStyles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={currentStyles.registerButtonText}> {t('auth.sign_up')} </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={currentStyles.footer}>
          <Text style={currentStyles.footerText}> {t('auth.already_have_account')} </Text>
          <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
            <Text style={currentStyles.linkText}> {t('auth.sign_in')} </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* iOS Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={pickerModalVisible !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setPickerModalVisible(null)}
        >
          <View style={currentStyles.modalContainer}>
            <View style={currentStyles.modalContent}>
              <View style={currentStyles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setPickerModalVisible(null)}
                  style={currentStyles.modalDoneButton}
                >
                  <Text style={currentStyles.modalDoneText}> {t('common.done')} </Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={pickerModalVisible === 'grade' ? selectedGrade : selectedSystem}
                onValueChange={(itemValue) =>
                  pickerModalVisible === 'grade'
                    ? setSelectedGrade(itemValue)
                    : setSelectedSystem(itemValue)
                }
              >
                <Picker.Item
                  label={
                    pickerModalVisible === 'grade'
                      ? t('auth.select_grade')
                      : t('auth.select_educational_system')
                  }
                  value=""
                />
                {pickerModalVisible === 'grade'
                  ? gradesData?.grades?.map((grade: any) => (
                      <Picker.Item key={grade.id} label={grade.name} value={grade.id} />
                    ))
                  : systemsData?.educationalSystems?.map((system: any) => (
                      <Picker.Item key={system.id} label={system.name} value={system.id} />
                    ))}
              </Picker>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = (theme: any, common: any, fontSizes: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
    header: { alignItems: 'center', marginBottom: 30 },
    logo: { width: 80, height: 80, marginBottom: 15 },
    title: {
      fontSize: fontSizes['3xl'],
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: { fontSize: fontSizes.base, color: theme.colors.textSecondary },
    form: { marginBottom: 20 },
    inputContainer: { marginBottom: 15 },
    label: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: common.textAlign,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.md,
      padding: 15,
      fontSize: fontSizes.base,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    picker: { height: 50, color: theme.colors.text, backgroundColor: theme.colors.surface },
    loadingContainer: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loadingText: { ...common.marginStart(10), color: theme.colors.textSecondary },
    registerButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.md,
      padding: 12, // Reduced from 15
      alignItems: 'center',
      marginTop: 10,
    },
    disabledButton: { backgroundColor: theme.colors.buttonDisabled },
    registerButtonText: {
      color: '#fff',
      fontSize: fontSizes.sm, // Changed from lg to sm
      fontWeight: '600', // Changed from bold (if it was) to 600
    },
    footer: { flexDirection: common.rowDirection, justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: fontSizes.base, color: theme.colors.textSecondary },
    linkText: { fontSize: fontSizes.base, color: theme.colors.primary, fontWeight: '600' },
    closeButton: {
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
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface, // Ensure header has background
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
    },
    modalDoneButton: {
      paddingHorizontal: 16,
    },
    modalDoneText: {
      color: theme.colors.primary,
      fontSize: fontSizes.lg,
      fontWeight: '600',
    },
  });

export default RegisterScreen;
