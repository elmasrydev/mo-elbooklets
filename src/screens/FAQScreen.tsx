import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import UnifiedHeader from '../components/UnifiedHeader';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';

const FAQScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const common = useCommonStyles();
  const { typography } = useTypography();

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
  ];

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

        {faqs.map((faq, index) => (
          <View key={index} style={currentStyles.faqCard}>
            <View style={currentStyles.questionRow}>
              <View style={currentStyles.dot} />
              <Text style={[typography('h3'), currentStyles.questionText]}>{faq.q}</Text>
            </View>
            <View style={currentStyles.answerContainer}>
              <Text style={[typography('body'), currentStyles.answerText]}>{faq.a}</Text>
            </View>
          </View>
        ))}
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
      marginBottom: spacing.xl,
    },
    introText: {
      marginTop: spacing.xl,
      color: theme.colors.textSecondary,
      textAlign: 'left',
      lineHeight: 24,
    },
    faqCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...layout.shadow,
      borderWidth: 1,
      borderColor: theme.colors.border + '50',
    },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
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
      paddingLeft: spacing.lg,
      paddingRight: spacing.lg,
      marginTop: spacing.xs,
    },
    answerText: {
      color: theme.colors.textSecondary,
      textAlign: 'left',
      lineHeight: 22,
    },
  });

export default FAQScreen;
