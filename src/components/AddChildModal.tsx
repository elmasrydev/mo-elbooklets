import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import { useParentDashboardContext } from '../context/ParentDashboardContext';

/**
 * Shared add-child modal. Rendered once at the parent tab navigator level so it can
 * be opened both from the Dashboard "add another child" button and from the
 * "Add Child" bottom tab. Visibility + submit logic live in ParentDashboardContext.
 */
const AddChildModal: React.FC = () => {
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { isAddModalVisible, closeAddModal, handleAddChild, adding } = useParentDashboardContext();

  const [childMobile, setChildMobile] = useState('');
  // Synchronous guard so a fast double-tap can't fire two link requests before
  // `adding` flips on the next render.
  const submittingRef = useRef(false);

  const currentStyles = useMemo(
    () => styles({ theme, spacing, borderRadius, typography, fontWeight }),
    [theme, spacing, borderRadius, typography, fontWeight],
  );

  const handleClose = () => {
    setChildMobile('');
    closeAddModal();
  };

  const onConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const success = await handleAddChild(childMobile);
      if (success) {
        setChildMobile('');
        closeAddModal();
      }
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Modal
      visible={isAddModalVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={currentStyles.modalOverlay} onStartShouldSetResponder={() => true}>
        <View style={currentStyles.modalContent}>
          <Text style={currentStyles.modalTitle}>{t('parent_dashboard.add_child')}</Text>
          <Text style={currentStyles.modalSubtitle}>
            {t('parent_dashboard.enter_child_mobile')}
          </Text>

          <TextInput
            testID="parent-dashboard-child-mobile-input"
            style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={t('parent_dashboard.child_mobile_placeholder')}
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="phone-pad"
            value={childMobile}
            onChangeText={(val) => setChildMobile(val.replace(/\D/g, '').slice(0, 11))}
            maxLength={11}
          />

          <View style={currentStyles.modalActions}>
            <TouchableOpacity
              testID="parent-dashboard-add-child-cancel"
              style={[currentStyles.modalBtn, currentStyles.cancelBtn]}
              onPress={handleClose}
            >
              <Text style={currentStyles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="parent-dashboard-add-child-confirm"
              style={[currentStyles.modalBtn, currentStyles.confirmBtn]}
              onPress={onConfirm}
              disabled={adding || !childMobile}
            >
              {adding ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={currentStyles.confirmBtnText}>{t('parent_dashboard.add_child')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = (config: any) => {
  const { theme, borderRadius, typography, fontWeight } = config;
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl,
      padding: 24,
      ...layout.shadow,
    },
    modalTitle: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'left',
    },
    modalSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      marginBottom: 20,
      textAlign: 'left',
    },
    input: {
      backgroundColor: theme.colors.background,
      borderRadius: borderRadius.md,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      color: theme.colors.text,
      marginBottom: 24,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    modalBtn: {
      flex: 1,
      height: 48,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    confirmBtn: {
      backgroundColor: theme.colors.primary,
    },
    cancelBtnText: {
      color: theme.colors.textSecondary,
      ...fontWeight('600'),
    },
    confirmBtnText: {
      color: '#FFFFFF',
      ...fontWeight('600'),
    },
  });
};

export default AddChildModal;
