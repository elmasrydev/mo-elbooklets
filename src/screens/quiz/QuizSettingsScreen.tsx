import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { tryFetchWithFallback } from '../../config/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import QuizFlowHeader from '../../components/QuizFlowHeader';
import AppButton from '../../components/AppButton';
import { layout } from '../../config/layout';
import { useModal } from '../../context/ModalContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import SubjectIcon from '../../components/SubjectIcon';
import { useSubscriptionGate } from '../../hooks/useSubscriptionGate';
import { useSubjectTextAlign } from '../../hooks/useSubjectTextAlign';

interface QuizType {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
  isDefault: boolean;
}

interface SelectedLesson {
  id: string;
  name: string;
}

interface SelectedUnit {
  id: string;
  name: string;
  lessons: SelectedLesson[];
}

const QuizSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    subject,
    quizTypes: passedQuizTypes,
    selectedUnits = [],
    selectedLessonIds = [],
  } = route.params || {};

  const [quizTypes, setQuizTypes] = useState<QuizType[]>(passedQuizTypes || []);
  const [loadingTypes, setLoadingTypes] = useState(
    !passedQuizTypes || passedQuizTypes.length === 0,
  );

  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const insets = useSafeAreaInsets();
  const { checkSubscription } = useSubscriptionGate();

  // Settings State
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [timerEnabled, setTimerEnabled] = useState(false);

  const [showSubModal, setShowSubModal] = useState(false);

  const fetchQuizTypes = useCallback(async () => {
    try {
      setLoadingTypes(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      const result = await tryFetchWithFallback(
        `query QuizTypes { quizTypes { id name slug question_count is_default } }`,
        undefined,
        token,
      );
      if (result.data?.quizTypes) {
        setQuizTypes(
          result.data.quizTypes.map((qt: any) => ({
            id: qt.id,
            name: qt.name,
            slug: qt.slug,
            questionCount: qt.question_count,
            isDefault: qt.is_default,
          })),
        );
      }
    } catch (err) {
      console.error('Fetch quiz types error:', err);
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    if (!passedQuizTypes || passedQuizTypes.length === 0) {
      fetchQuizTypes();
    }
  }, [passedQuizTypes, fetchQuizTypes]);

  useEffect(() => {
    if (!selectedTypeId && quizTypes.length > 0) {
      const defaultType = quizTypes.find((qt: QuizType) => qt.isDefault) || quizTypes[0];
      setSelectedTypeId(defaultType.id);
    }
  }, [quizTypes, selectedTypeId]);

  useEffect(() => {
    if (!subject) {
      navigation.navigate('QuizFlowSubjects');
    }
  }, [subject]);

  const sortedQuizTypes = useMemo(() => {
    return [...quizTypes].sort((a, b) => a.questionCount - b.questionCount);
  }, [quizTypes]);

  const currentQuizType = useMemo(() => {
    return quizTypes.find((qt) => qt.id === selectedTypeId);
  }, [quizTypes, selectedTypeId]);

  const handleStartQuiz = () => {
    if (!checkSubscription({ skipModal: true })) {
      setShowSubModal(true);
      return;
    }
    if (!selectedTypeId || !subject) return;

    // Navigate to Generating animation screen
    navigation.navigate('QuizGenerating', {
      subject,
      selectedLessonIds,
      selectedTypeId,
      timedMode: timerEnabled,
      timeLimit: timerEnabled ? 30 : null,
      difficulty: 'medium',
      shuffleQuestions: true,
      instantFeedback: false,
      soundEffects: true,
      questionCount: currentQuizType?.questionCount || 10,
    });
  };

  const { contentAlign, contentFlexAlign, contentRowDirection, isContentRTL } = useSubjectTextAlign(
    subject?.language,
  );

  const currentStyles = styles(
    theme,
    common,
    typography,
    fontWeight,
    fontSizes,
    spacing,
    borderRadius,
    insets,
    contentAlign,
    contentFlexAlign,
    contentRowDirection,
    !!isContentRTL,
  );

  return (
    <View style={currentStyles.container}>
      <QuizFlowHeader currentStep={3} />

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing.lg,
          paddingBottom: Math.max(insets.bottom + 100, spacing.xl),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.titleSection}>
          <Text style={currentStyles.pageTitle}>{t('quiz_flow.quiz_setup')}</Text>
          <Text style={currentStyles.pageSubtitle}>{t('quiz_flow.quiz_setup_subtitle')}</Text>
        </View>

        {/* Scope Summary Card */}
        {subject && (
          <View style={currentStyles.card}>
            <View style={currentStyles.scopeHeader}>
              <View style={currentStyles.scopeTitleRow}>
                <SubjectIcon
                  subjectName={subject.name}
                  size={24}
                  style={{ marginRight: isContentRTL ? 0 : 8, marginLeft: isContentRTL ? 8 : 0 }}
                />
                <Text style={currentStyles.scopeTitle}>{subject.name}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Text style={currentStyles.editBtnText}>{t('quiz_flow.edit')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={currentStyles.scopeDetail}>
              {t('quiz_flow.x_selected', { count: selectedUnits.length })}
            </Text>
            <View style={currentStyles.unitList}>
              {selectedUnits.slice(0, 3).map((unit: SelectedUnit, i: number) => (
                <Text key={unit.id} style={currentStyles.unitItem} numberOfLines={1}>
                  • {unit.name}
                </Text>
              ))}
              {selectedUnits.length > 3 && (
                <Text style={currentStyles.unitItemMore}>+ {selectedUnits.length - 3} more</Text>
              )}
            </View>
          </View>
        )}

        {/* Question Count Pill Picker */}
        <View style={currentStyles.card}>
          <View style={currentStyles.settingHeader}>
            <View>
              <Text style={currentStyles.cardLabel}>{t('quiz_flow.question_count')}</Text>
              <Text style={currentStyles.cardSublabel}>{t('quiz_flow.question_count_desc')}</Text>
            </View>
          </View>

          <View style={currentStyles.pillContainer}>
            {sortedQuizTypes.map((type: QuizType) => {
              const isSelected = selectedTypeId === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[currentStyles.pillButton, isSelected && currentStyles.pillButtonSelected]}
                  onPress={() => setSelectedTypeId(type.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[currentStyles.pillText, isSelected && currentStyles.pillTextSelected]}
                  >
                    {type.questionCount}
                  </Text>
                  {type.isDefault && (
                    <Text
                      style={[
                        currentStyles.pillBadgeText,
                        isSelected && currentStyles.pillBadgeTextSelected,
                      ]}
                    >
                      {t('quiz_flow.default')}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Timer Card */}
        <View style={currentStyles.card}>
          <View style={currentStyles.rowSpace}>
            <View style={currentStyles.rowIconText}>
              <View style={[currentStyles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="timer" size={20} color="#16A34A" />
              </View>
              <View>
                <Text style={currentStyles.cardLabel}>{t('quiz_flow.duration')}</Text>
                <Text style={currentStyles.cardSublabel}>{t('quiz_flow.duration_desc')}</Text>
              </View>
            </View>
            <Switch
              value={timerEnabled}
              onValueChange={setTimerEnabled}
              trackColor={{ false: '#cbd5e1', true: '#004A9A' }}
              thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer CTA */}
      <View style={currentStyles.footer}>
        <AppButton
          title={t('quiz_flow.start_quiz')}
          onPress={handleStartQuiz}
          disabled={!selectedTypeId}
          style={currentStyles.startBtn}
          textStyle={currentStyles.startBtnText}
          icon={<Ionicons name="play" size={18} color="#ffffff" />}
          iconPosition="left"
        />
      </View>

      <ConfirmModal
        visible={showSubModal}
        icon={<Ionicons name="lock-closed" size={50} color={theme.colors.primary} />}
        title={t('subscription.required_title')}
        message={t('subscription.required_message')}
        confirmLabel={t('common.ok')}
        onConfirm={() => {
          setShowSubModal(false);
          navigation.navigate('MainTabs', { screen: 'SettingsTab' });
        }}
        showCancel={true}
        onCancel={() => setShowSubModal(false)}
      />
    </View>
  );
};

const styles = (
  theme: any,
  common: any,
  typography: any,
  fontWeight: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  insets: any,
  contentAlign: 'left' | 'right',
  contentFlexAlign: 'flex-start' | 'flex-end',
  contentRowDirection: 'row' | 'row-reverse',
  isContentRTL: boolean,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
    titleSection: {
      marginBottom: spacing.md,
      alignItems: common.alignStart,
    },
    pageTitle: {
      fontSize: 24,
      ...fontWeight('900'),
      color: theme.colors.text || '#0F172A',
      marginBottom: spacing.xs,
      textAlign: common.textAlign,
    },
    pageSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary || '#475569',
      textAlign: common.textAlign,
    },
    card: {
      backgroundColor: theme.colors.card || '#FFFFFF',
      borderRadius: 20,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...layout.shadow,
    },
    scopeHeader: {
      flexDirection: contentRowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    scopeTitleRow: {
      flexDirection: contentRowDirection,
      alignItems: 'center',
      alignSelf: contentFlexAlign,
    },
    scopeTitle: {
      ...typography('bodyLarge'),
      ...fontWeight('900'),
      color: theme.colors.text || '#0F172A',
      textAlign: contentAlign,
    },
    editBtnText: {
      fontSize: 12,
      ...fontWeight('800'),
      color: '#004A9A',
    },
    scopeDetail: {
      fontSize: 12,
      ...fontWeight('700'),
      color: '#94A3B8',
      marginBottom: spacing.sm,
      textAlign: common.textAlign,
    },
    unitList: {
      marginTop: 2,
    },
    unitItem: {
      fontSize: 12,
      ...fontWeight('600'),
      color: '#475569',
      marginBottom: 3,
      textAlign: contentAlign,
    },
    unitItemMore: {
      fontSize: 11,
      ...fontWeight('700'),
      color: '#94A3B8',
      marginTop: 2,
      textAlign: common.textAlign,
    },
    settingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    cardLabel: {
      fontSize: 14,
      ...fontWeight('900'),
      color: theme.colors.text || '#0F172A',
      textAlign: common.textAlign,
    },
    cardSublabel: {
      fontSize: 11,
      ...fontWeight('600'),
      color: '#94A3B8',
      marginTop: 1,
      textAlign: common.textAlign,
    },
    availableBadge: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 99,
    },
    availableBadgeText: {
      fontSize: 10,
      ...fontWeight('850'),
      color: '#004A9A',
    },
    pillContainer: {
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'space-between',
    },
    pillButton: {
      flex: 1,
      height: 48,
      backgroundColor: '#F1F5F9',
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    pillButtonSelected: {
      backgroundColor: '#EFF6FF',
      borderColor: '#004A9A',
    },
    pillText: {
      fontSize: 14,
      ...fontWeight('900'),
      color: '#475569',
    },
    pillTextSelected: {
      color: '#004A9A',
    },
    pillBadgeText: {
      fontSize: 8,
      ...fontWeight('800'),
      color: '#94A3B8',
      marginTop: 1,
    },
    pillBadgeTextSelected: {
      color: '#004A9A',
    },
    rowSpace: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowIconText: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginEnd: 10,
    },
    timerOptionsRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
    },
    timerChoiceButton: {
      flex: 1,
      paddingVertical: 10,
      backgroundColor: '#F1F5F9',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    timerChoiceButtonSelected: {
      backgroundColor: '#EFF6FF',
      borderColor: '#004A9A',
    },
    timerChoiceText: {
      fontSize: 11,
      ...fontWeight('800'),
      color: '#475569',
    },
    timerChoiceTextSelected: {
      color: '#004A9A',
    },
    segmentedContainer: {
      flexDirection: 'row',
      backgroundColor: '#E2E8F0',
      borderRadius: 12,
      padding: 3,
    },
    segmentedButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 9,
    },
    segmentedButtonActive: {
      backgroundColor: '#FFFFFF',
      ...layout.shadow,
    },
    segmentedText: {
      fontSize: 12,
      ...fontWeight('700'),
      color: '#64748B',
    },
    segmentedTextActive: {
      color: '#004A9A',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: spacing.xs,
    },
    toggleRowText: {
      fontSize: 13,
      ...fontWeight('800'),
      color: theme.colors.text || '#0F172A',
    },
    divider: {
      height: 1,
      backgroundColor: '#F1F5F9',
    },
    previewSummaryCard: {
      backgroundColor: '#EFF6FF',
      borderColor: 'rgba(0, 74, 154, 0.15)',
      borderWidth: 1.5,
      borderRadius: 20,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    previewText: {
      fontSize: 12,
      ...fontWeight('900'),
      color: '#1E3063',
      textAlign: common.textAlign,
    },
    previewSubtext: {
      fontSize: 10,
      ...fontWeight('700'),
      color: '#94A3B8',
      marginTop: 2,
      textAlign: common.textAlign,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      start: 0,
      end: 0,
      padding: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      backgroundColor: theme.colors.card || '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 74, 154, 0.06)',
      ...layout.shadow,
    },
    startBtn: {
      height: 52,
      borderRadius: 18,
      backgroundColor: '#004A9A',
      shadowColor: '#004A9A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 6,
    },
    startBtnText: {
      fontSize: 16,
      ...fontWeight('900'),
      marginStart: 6,
    },
  });

export default QuizSettingsScreen;
