import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import UnifiedHeader from '../components/UnifiedHeader';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const common = useCommonStyles();
  const { typography } = useTypography();

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
  ];

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const currentStyles = styles(theme, spacing, borderRadius, isRTL);

  return (
    <View style={[common.container, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader
        title={t('faq.header_title')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        centerAlign={true}
      />

      <ScrollView
        style={currentStyles.content}
        contentContainerStyle={currentStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={currentStyles.introSection}>
          <Text style={[typography('body'), currentStyles.introText]}>{t('faq.intro')}</Text>
        </View>

        {faqs.map((faq, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <TouchableOpacity
              key={index}
              style={[currentStyles.faqCard, isExpanded && currentStyles.faqCardExpanded]}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.75}
            >
              <View style={currentStyles.questionRow}>
                <View style={currentStyles.dot} />
                <Text style={[typography('h3'), currentStyles.questionText]}>{faq.q}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isExpanded ? theme.colors.primary : theme.colors.textTertiary}
                  style={currentStyles.chevron}
                />
              </View>
              {isExpanded && (
                <View style={currentStyles.answerContainer}>
                  <Text style={[typography('body'), currentStyles.answerText]}>{faq.a}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = (theme: any, spacing: any, borderRadius: any, isRTL: boolean) =>
  StyleSheet.create({
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: layout.screenPadding,
      paddingBottom: spacing.xl * 2,
    },
    introSection: {
      marginBottom: spacing.md,
    },
    introText: {
      marginTop: spacing.md,
      color: theme.colors.textSecondary,
      textAlign: 'left',
      lineHeight: 24,
    },
    faqCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl || 16,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.03,
          shadowRadius: 10,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    faqCardExpanded: {
      borderColor: theme.colors.primary,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chevron: {
      paddingStart: spacing.xs,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
      marginHorizontal: spacing.xs,
    },
    questionText: {
      flex: 1,
      color: theme.colors.text,
      textAlign: 'left',
    },
    answerContainer: {
      paddingStart: spacing.lg,
      paddingEnd: spacing.lg,
      marginTop: spacing.md,
    },
    answerText: {
      color: theme.colors.textSecondary,
      textAlign: 'left',
      lineHeight: 22,
    },
  });

export default FAQScreen;
