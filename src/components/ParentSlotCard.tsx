import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import AppButton from './AppButton';
import { ParentSlot } from '../types/parenting';

interface ParentSlotCardProps {
  slotNumber: 1 | 2;
  slot: ParentSlot;
  onSendInvite: (mobile: string) => Promise<void>;
  onRespond: (requestId: string, action: 'accept' | 'decline') => Promise<void>;
  onCancel: (requestId: string) => Promise<void>;
  isSending?: boolean;
  isResponding?: boolean;
  isCancelling?: boolean;
}

const ParentSlotCard: React.FC<ParentSlotCardProps> = ({
  slotNumber,
  slot,
  onRespond,
  onCancel,
  onSendInvite,
  isSending,
  isResponding,
  isCancelling,
}) => {
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();

  const [mobileInput, setMobileInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSendInvite = async () => {
    // Egyptian mobile validation: 11 digits starting with 010, 011, 012, or 015
    const isValid = /^01[0125][0-9]{8}$/.test(mobileInput);
    if (!isValid) {
      setInputError(t('parent_linking.invalid_mobile'));
      return;
    }
    setInputError(null);
    try {
      await onSendInvite(mobileInput);
      setMobileInput(''); // Clear input on success
    } catch (e: any) {
      setInputError(e.message || t('parent_linking.send_error'));
    }
  };

  const handleRespond = async (action: 'accept' | 'decline') => {
    if (!slot.request) return;
    try {
      await onRespond(slot.request.id, action);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCancel = async () => {
    if (!slot.request) return;
    try {
      await onCancel(slot.request.id);
    } catch (e: any) {
      console.error(e);
    }
  };

  const currentStyles = styles(theme, spacing, borderRadius, isRTL, typography, fontWeight);

  const renderBadge = () => {
    switch (slot.state) {
      case 'pending_outgoing':
        return (
          <View style={[currentStyles.badge, { backgroundColor: theme.colors.warning + '1A' }]}>
            <Text style={[currentStyles.badgeText, { color: theme.colors.warning }]}>
              {t('parent_linking.badge_pending_outgoing')}
            </Text>
          </View>
        );
      case 'pending_incoming':
        return (
          <View style={[currentStyles.badge, { backgroundColor: theme.colors.info + '1A' }]}>
            <Text style={[currentStyles.badgeText, { color: theme.colors.info }]}>
              {t('parent_linking.badge_pending_incoming')}
            </Text>
          </View>
        );
      case 'accepted':
        return (
          <View style={[currentStyles.badge, { backgroundColor: '#10B981' + '1A' }]}>
            <Text style={[currentStyles.badgeText, { color: '#10B981' }]}>
              {t('parent_linking.badge_accepted')}
            </Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[currentStyles.badge, { backgroundColor: theme.colors.error + '1A' }]}>
            <Text style={[currentStyles.badgeText, { color: theme.colors.error }]}>
              {t('parent_linking.badge_rejected')}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderEmptyState = () => (
    <View>
      <Text style={currentStyles.label}>{t('parent_linking.slot_title', { number: slotNumber })}</Text>
      <View style={[currentStyles.inputContainer, inputError && currentStyles.inputError]}>
        <Ionicons name="call-outline" size={20} color={theme.colors.textTertiary} />
        <TextInput
          style={currentStyles.input}
          placeholder={t('parent_linking.enter_mobile_placeholder')}
          placeholderTextColor={theme.colors.textTertiary}
          keyboardType="phone-pad"
          value={mobileInput}
          onChangeText={(val) => {
            setMobileInput(val);
            if (inputError) setInputError(null);
          }}
        />
      </View>
      {inputError && <Text style={currentStyles.errorText}>{inputError}</Text>}
      <View style={currentStyles.actionContainer}>
        <AppButton
          title={isSending ? t('parent_linking.sending') : t('parent_linking.send_invite')}
          onPress={handleSendInvite}
          loading={isSending}
          disabled={!mobileInput || isSending}
        />
      </View>
    </View>
  );

  const renderPendingOutgoing = () => (
    <View>
      <View style={currentStyles.headerRow}>
        <View style={currentStyles.titleInfo}>
          <Text style={currentStyles.parentName}>{slot.request?.parent.name || 'Parent'}</Text>
          <Text style={currentStyles.parentMobile}>{slot.request?.parent.mobile}</Text>
        </View>
        {renderBadge()}
      </View>
      <Text style={currentStyles.descText}>{t('parent_linking.pending_outgoing_desc')}</Text>
      <View style={currentStyles.actionContainer}>
        <AppButton
          title={isCancelling ? t('parent_linking.cancelling') : t('parent_linking.cancel_invitation')}
          onPress={handleCancel}
          loading={isCancelling}
          variant="danger"
          disabled={isCancelling}
        />
      </View>
    </View>
  );

  const renderPendingIncoming = () => (
    <View>
      <View style={currentStyles.headerRow}>
        <View style={currentStyles.titleInfo}>
          <Text style={currentStyles.parentName}>{slot.request?.parent.name || 'Parent'}</Text>
          <Text style={currentStyles.parentMobile}>{slot.request?.parent.mobile}</Text>
        </View>
        {renderBadge()}
      </View>
      <Text style={currentStyles.descText}>{t('parent_linking.pending_incoming_desc')}</Text>
      <View style={currentStyles.buttonRow}>
        <View style={currentStyles.flexButton}>
          <AppButton
            title={t('parent_linking.decline')}
            onPress={() => handleRespond('decline')}
            variant="outline"
            disabled={isResponding}
          />
        </View>
        <View style={{ width: spacing.md }} />
        <View style={currentStyles.flexButton}>
          <AppButton
            title={t('parent_linking.accept')}
            onPress={() => handleRespond('accept')}
            loading={isResponding}
            disabled={isResponding}
          />
        </View>
      </View>
    </View>
  );

  const renderAccepted = () => (
    <View>
      <View style={currentStyles.headerRow}>
        <View style={currentStyles.titleInfo}>
          <Text style={currentStyles.parentName}>{slot.request?.parent.name || 'Parent'}</Text>
          <Text style={currentStyles.parentMobile}>{slot.request?.parent.mobile}</Text>
        </View>
        {renderBadge()}
      </View>
      <Text style={currentStyles.descText}>{t('parent_linking.accepted_desc')}</Text>
    </View>
  );

  const renderRejected = () => (
    <View>
      <View style={currentStyles.headerRow}>
        <View style={currentStyles.titleInfo}>
          <Text style={currentStyles.parentName}>{slot.request?.parent.name || 'Parent'}</Text>
          <Text style={currentStyles.parentMobile}>{slot.request?.parent.mobile}</Text>
        </View>
        {renderBadge()}
      </View>
      <Text style={currentStyles.descText}>{t('parent_linking.rejected_desc')}</Text>
      
      <View style={currentStyles.divider} />
      
      <Text style={currentStyles.label}>{t('parent_linking.send_to_new_number')}</Text>
      <View style={[currentStyles.inputContainer, inputError && currentStyles.inputError]}>
        <Ionicons name="call-outline" size={20} color={theme.colors.textTertiary} />
        <TextInput
          style={currentStyles.input}
          placeholder={t('parent_linking.enter_mobile_placeholder')}
          placeholderTextColor={theme.colors.textTertiary}
          keyboardType="phone-pad"
          value={mobileInput}
          onChangeText={(val) => {
            setMobileInput(val);
            if (inputError) setInputError(null);
          }}
        />
      </View>
      {inputError && <Text style={currentStyles.errorText}>{inputError}</Text>}
      <View style={currentStyles.actionContainer}>
        <AppButton
          title={isSending ? t('parent_linking.sending') : t('parent_linking.send_invite')}
          onPress={handleSendInvite}
          loading={isSending}
          disabled={!mobileInput || isSending}
        />
      </View>
    </View>
  );

  return (
    <View style={currentStyles.card}>
      {slot.state === 'empty' && renderEmptyState()}
      {slot.state === 'pending_outgoing' && renderPendingOutgoing()}
      {slot.state === 'pending_incoming' && renderPendingIncoming()}
      {slot.state === 'accepted' && renderAccepted()}
      {slot.state === 'rejected' && renderRejected()}
    </View>
  );
};

const styles = (
  theme: any,
  spacing: any,
  borderRadius: any,
  isRTL: boolean,
  typography: any,
  fontWeight: any
) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    label: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: spacing.sm,
      textAlign: 'left',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      height: 50,
      backgroundColor: theme.colors.background,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    input: {
      flex: 1,
      fontSize: 16,
      height: '100%',
      color: theme.colors.text,
      textAlign: 'left',
      marginHorizontal: spacing.sm,
    },
    errorText: {
      ...typography('caption'),
      color: theme.colors.error,
      marginTop: spacing.xs,
      textAlign: 'left',
    },
    actionContainer: {
      marginTop: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    titleInfo: {
      flex: 1,
      alignItems: 'flex-start',
    },
    parentName: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: 'left',
    },
    parentMobile: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: 'left',
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      marginStart: spacing.sm,
    },
    badgeText: {
      ...typography('caption'),
      ...fontWeight('600'),
    },
    descText: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'left',
      marginTop: spacing.xs,
    },
    buttonRow: {
      flexDirection: 'row',
      marginTop: spacing.md,
    },
    flexButton: {
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: spacing.md,
    },
  });

export default React.memo(ParentSlotCard);
