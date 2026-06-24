import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useModal } from '../../context/ModalContext';
import { reportAnswer } from '../../services/bokiApi';
import { analytics } from '../../lib/analytics';
import { spacing, borderRadius } from '../../config/spacing';
import { layout } from '../../config/layout';
import { BokiReportReason } from '../../types/boki';

interface BokiReportSheetProps {
  visible: boolean;
  chatLogId: string | null;
  onClose: () => void;
}

const REASONS: { value: BokiReportReason; labelKey: string }[] = [
  { value: 'incorrect', labelKey: 'boki.report_reason_incorrect' },
  { value: 'irrelevant', labelKey: 'boki.report_reason_irrelevant' },
  { value: 'offensive', labelKey: 'boki.report_reason_offensive' },
  { value: 'other', labelKey: 'boki.report_reason_other' },
];

/**
 * Bottom sheet for reporting a Boki answer (BKLT-221, Phase 3).
 *
 * Reasons are a fixed client-side set (the backend has no reasons query); a
 * reason is required, notes are optional. On success the sheet closes and a
 * confirmation is shown via the global modal.
 */
const BokiReportSheet: React.FC<BokiReportSheetProps> = ({ visible, chatLogId, onClose }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();
  const { showConfirm } = useModal();

  const [reason, setReason] = useState<BokiReportReason | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setNotes('');
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = useCallback(async () => {
    if (!reason || !chatLogId || submitting) return;
    setSubmitting(true);
    try {
      const result = await reportAnswer(chatLogId, reason, notes);
      analytics.trackBokiReportSubmitted({ reason });
      onClose();
      showConfirm({
        title: t('boki.report_success_title'),
        message: result.message || t('boki.report_success'),
        showCancel: false,
        onConfirm: () => {},
      });
    } catch {
      showConfirm({
        title: t('common.error'),
        message: t('boki.report_error'),
        showCancel: false,
        onConfirm: () => {},
      });
    } finally {
      setSubmitting(false);
    }
  }, [reason, chatLogId, submitting, notes, onClose, showConfirm, t]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={[typography('h3'), styles.title, { color: theme.colors.text }]}>
                {t('boki.report_title')}
              </Text>
              <TouchableOpacity
                testID="boki-report-close"
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={spacing.icon.lg} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                typography('bodySmall'),
                styles.subtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {t('boki.report_subtitle')}
            </Text>

            {REASONS.map((item) => {
              const selected = reason === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  testID={`boki-report-reason-${item.value}`}
                  activeOpacity={0.7}
                  onPress={() => setReason(item.value)}
                  style={[
                    styles.reason,
                    { borderColor: selected ? theme.colors.primary : theme.colors.border },
                  ]}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={spacing.icon.md}
                    color={selected ? theme.colors.primary : theme.colors.textTertiary}
                  />
                  <Text
                    style={[typography('body'), styles.reasonLabel, { color: theme.colors.text }]}
                  >
                    {t(item.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TextInput
              testID="boki-report-notes"
              style={[
                typography('body'),
                styles.notes,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('boki.report_notes_placeholder')}
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              testID="boki-report-submit"
              activeOpacity={0.7}
              onPress={handleSubmit}
              disabled={!reason || submitting}
              style={[
                styles.submit,
                {
                  backgroundColor:
                    !reason || submitting ? theme.colors.buttonDisabled : theme.colors.primary,
                },
              ]}
            >
              <Text style={[typography('button'), { color: theme.colors.textOnDark }]}>
                {t('boki.report_submit')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    textAlign: 'left',
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.ssm,
    marginBottom: spacing.sm,
  },
  reasonLabel: {
    marginStart: spacing.sm,
    textAlign: 'left',
  },
  notes: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.ssm,
    marginTop: spacing.sm,
    textAlign: 'left',
  },
  submit: {
    height: 50,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
});

export default BokiReportSheet;
