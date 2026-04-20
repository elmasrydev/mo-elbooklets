import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../config/api';
import AppButton from './AppButton';
import { spacing as spacingConst } from '../config/spacing';

const { width } = Dimensions.get('window');
const logo = require('../../assets/logo-transparent.png');

interface ReportType {
  id: string;
  name: string;
}

interface ReportQuestionModalProps {
  visible: boolean;
  questionId: string;
  onClose: () => void;
}

const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
  visible,
  questionId,
  onClose,
}) => {
  const { theme, borderRadius } = useTheme();
  const { typography, fontWeight } = useTypography();
  const { t } = useTranslation();

  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportTypes = useCallback(async () => {
    try {
      setLoadingTypes(true);
      setError(null);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `query {
          questionReportTypes {
            id
            name
          }
        }`,
        {},
        token,
      );

      if (result.data?.questionReportTypes) {
        setReportTypes(result.data.questionReportTypes);
      }
    } catch (err) {
      console.error('Fetch report types error:', err);
      setError(t('report_question.error_loading_types'));
    } finally {
      setLoadingTypes(false);
    }
  }, [t]);

  useEffect(() => {
    if (visible && reportTypes.length === 0) {
      fetchReportTypes();
    }
  }, [visible, fetchReportTypes, reportTypes.length]);

  // Reset state when modal closes so it's fresh next time
  const handleClose = () => {
    setSelectedTypeId(null);
    setComment('');
    setError(null);
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedTypeId) return;

    try {
      setSubmitting(true);
      setError(null);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `mutation ReportQuestion($questionId: ID!, $reportTypeId: ID!, $comment: String) {
          reportQuestion(questionId: $questionId, reportTypeId: $reportTypeId, comment: $comment) {
            success
            message
          }
        }`,
        {
          questionId,
          reportTypeId: selectedTypeId,
          comment: comment.trim() || null,
        },
        token,
      );

      const payload = result.data?.reportQuestion;
      if (payload?.success) {
        setSubmitted(true);
      } else {
        setError(payload?.message || t('report_question.submit_error'));
      }
    } catch (err: any) {
      console.error('Report question error:', err);
      setError(err.message || t('report_question.submit_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const s = styles(theme, borderRadius, typography, fontWeight);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableOpacity activeOpacity={1} style={s.overlay} onPress={handleClose}>
        <View
          style={[s.container, { backgroundColor: theme.colors.card }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Close button */}
          <TouchableOpacity
            style={[s.closeBtn, { backgroundColor: theme.colors.bgGray }]}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} />
            </View>
            <Text style={[s.title, { color: theme.colors.text }]}>
              {t('report_question.title')}
            </Text>
            <Text style={[s.subtitle, { color: theme.colors.textSecondary }]}>
              {t('report_question.subtitle')}
            </Text>
          </View>

          {submitted ? (
            /* ── Success state ── */
            <View style={s.successContainer}>
              <View style={[s.successIcon, { backgroundColor: theme.colors.success + '1A' }]}>
                <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
              </View>
              <Text style={[s.successTitle, { color: theme.colors.text }]}>
                {t('report_question.success_title')}
              </Text>
              <Text style={[s.successMsg, { color: theme.colors.textSecondary }]}>
                {t('report_question.success_message')}
              </Text>
              <AppButton
                title={t('common.done')}
                onPress={handleClose}
                variant="primary"
                fullWidth
              />
            </View>
          ) : (
            /* ── Form state ── */
            <>
              {loadingTypes ? (
                <ActivityIndicator
                  color={theme.colors.primary}
                  size="small"
                  style={{ marginVertical: spacingConst.lg }}
                />
              ) : error && reportTypes.length === 0 ? (
                <View style={s.errorBox}>
                  <Text style={[s.errorText, { color: theme.colors.error }]}>{error}</Text>
                  <TouchableOpacity onPress={fetchReportTypes} style={s.retryBtn}>
                    <Text style={[s.retryText, { color: theme.colors.primary }]}>
                      {t('common.try_again', 'Try again')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  style={s.scroll}
                  contentContainerStyle={s.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Report type chips (single select) */}
                  <Text style={[s.sectionLabel, { color: theme.colors.textSecondary }]}>
                    {t('report_question.select_reason')}
                  </Text>
                  {reportTypes.map((rt) => {
                    const isSelected = selectedTypeId === rt.id;
                    return (
                      <TouchableOpacity
                        key={rt.id}
                        style={[
                          s.typeRow,
                          {
                            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                            backgroundColor: isSelected
                              ? theme.colors.primary + '0D'
                              : theme.colors.background,
                          },
                        ]}
                        onPress={() => setSelectedTypeId(isSelected ? null : rt.id)}
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            s.radioCircle,
                            {
                              borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                            },
                          ]}
                        >
                          {isSelected && (
                            <View style={[s.radioDot, { backgroundColor: theme.colors.primary }]} />
                          )}
                        </View>
                        <Text
                          style={[
                            s.typeLabel,
                            {
                              color: isSelected ? theme.colors.primary : theme.colors.text,
                            },
                          ]}
                        >
                          {rt.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Comment field */}
                  <Text
                    style={[
                      s.sectionLabel,
                      { color: theme.colors.textSecondary, marginTop: spacingConst.md },
                    ]}
                  >
                    {t('report_question.comment_label')}
                  </Text>
                  <TextInput
                    style={[
                      s.commentInput,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                    placeholder={t('report_question.comment_placeholder')}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />
                  <Text style={[s.charCount, { color: theme.colors.textSecondary }]}>
                    {comment.length}/500
                  </Text>

                  {/* Submission error */}
                  {error && (
                    <Text style={[s.errorText, { color: theme.colors.error, marginBottom: 8 }]}>
                      {error}
                    </Text>
                  )}

                  {/* Submit */}
                  <AppButton
                    title={t('report_question.submit')}
                    onPress={handleSubmit}
                    variant="primary"
                    fullWidth
                    disabled={!selectedTypeId || submitting}
                    loading={submitting}
                  />
                </ScrollView>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = (theme: any, borderRadius: any, typography: any, fontWeight: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacingConst.mdd,
    },
    container: {
      width: '100%',
      borderRadius: borderRadius.xl,
      paddingTop: 40,
      paddingHorizontal: spacingConst.mdd,
      paddingBottom: spacingConst.mdd,
      position: 'relative',
      maxHeight: '85%',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 15,
        },
        android: { elevation: 10 },
      }),
    },
    closeBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacingConst.md,
    },
    logoWrap: {
      width: 64,
      height: 64,
      marginBottom: spacingConst.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logo: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    title: {
      ...typography('h2'),
      ...fontWeight('700'),
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitle: {
      ...typography('caption'),
      textAlign: 'center',
      lineHeight: 18,
    },
    scroll: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingBottom: spacingConst.sm,
    },
    sectionLabel: {
      ...typography('label'),
      ...fontWeight('600'),
      marginBottom: spacingConst.sm,
      textAlign: 'left',
    },
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: borderRadius.md,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: spacingConst.sm,
      gap: spacingConst.sm,
    },
    radioCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    typeLabel: {
      ...typography('body'),
      flex: 1,
      textAlign: 'left',
    },
    commentInput: {
      borderWidth: 1.5,
      borderRadius: borderRadius.md,
      padding: 12,
      minHeight: 90,
      ...typography('body'),
      lineHeight: 22,
      textAlign: 'left',
    },
    charCount: {
      ...typography('caption'),
      textAlign: 'right',
      marginTop: 4,
      marginBottom: spacingConst.md,
    },
    errorBox: {
      alignItems: 'center',
      paddingVertical: spacingConst.lg,
    },
    errorText: {
      ...typography('caption'),
      textAlign: 'center',
      marginBottom: spacingConst.sm,
    },
    retryBtn: { paddingVertical: 8 },
    retryText: {
      ...typography('body'),
      ...fontWeight('600'),
    },
    successContainer: {
      alignItems: 'center',
      paddingVertical: spacingConst.lg,
      gap: spacingConst.md,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    successTitle: {
      ...typography('h2'),
      ...fontWeight('700'),
      textAlign: 'center',
    },
    successMsg: {
      ...typography('body'),
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacingConst.sm,
    },
  });

export default ReportQuestionModal;
