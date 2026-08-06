import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../hooks/useTypography';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { isArabicText } from '../../config/fonts';
import {
  isUnlimited,
  planDescription,
  planDisplayName,
  PlanText,
} from '../../utils/subscriptionPlans';

export interface PlanCardPlan extends PlanText {
  id: string;
  cost: number;
  currency: string;
  durationDays?: number | null;
  endsAt?: string | null;
  lessonLimit?: number | null;
  quizLimitPerDay?: number | null;
  allowedSubjectsCount?: number | null;
  requiresSubjectSelection: boolean;
}

interface PlanCardProps {
  plan: PlanCardPlan;
  selected: boolean;
  onPress: () => void;
}

/**
 * One buyable plan. `cost` is display-only — the charged amount is recomputed
 * server-side from the plan and promo code, so nothing here is ever sent back.
 */
export const PlanCard: React.FC<PlanCardProps> = ({ plan, selected, onPress }) => {
  const { theme, spacing, borderRadius } = useTheme();
  const { typography } = useTypography();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const title = planDisplayName(plan, language === 'ar' ? 'ar' : 'en');
  const description = planDescription(plan, language === 'ar' ? 'ar' : 'en');
  const titleIsArabic = isArabicText(title);

  const features: string[] = [];
  if (plan.durationDays) {
    features.push(t('payment.duration_days', { count: plan.durationDays }));
  }
  features.push(
    isUnlimited(plan.lessonLimit)
      ? t('payment.lessons_unlimited')
      : t('payment.lessons_limit', { count: plan.lessonLimit as number }),
  );
  features.push(
    isUnlimited(plan.quizLimitPerDay)
      ? t('payment.quizzes_unlimited')
      : t('payment.quizzes_limit', { count: plan.quizLimitPerDay as number }),
  );
  if (plan.requiresSubjectSelection && plan.allowedSubjectsCount) {
    features.push(t('payment.subjects_included', { count: plan.allowedSubjectsCount }));
  }

  const s = styles(theme, spacing, borderRadius);

  return (
    <TouchableOpacity
      testID={`packages-plan-${plan.id}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      activeOpacity={0.85}
      onPress={onPress}
      style={[s.card, selected && s.cardSelected]}
    >
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={[typography('h3', '700', titleIsArabic), s.title]} numberOfLines={2}>
            {title}
          </Text>
          {description ? (
            <Text
              style={[typography('caption', undefined, isArabicText(description)), s.description]}
              numberOfLines={3}
            >
              {description}
            </Text>
          ) : null}
        </View>
        <View style={[s.radio, selected && s.radioSelected]}>
          {selected ? (
            <Ionicons name="checkmark" size={14} color={theme.colors.buttonPrimaryText} />
          ) : null}
        </View>
      </View>

      <Text style={[typography('h3', '800'), s.price]}>
        {t('payment.price', { amount: plan.cost, currency: plan.currency })}
      </Text>

      {plan.endsAt ? (
        <Text style={[typography('caption'), s.endsAt]}>
          {t('payment.term_ends', { date: plan.endsAt.split(' ')[0] })}
        </Text>
      ) : null}

      <View style={s.features}>
        {features.map((feature) => (
          <View key={feature} style={s.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={[typography('caption'), s.featureText]}>{feature}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: spacing.md,
      marginBottom: spacing.ssm,
    },
    cardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary50,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: theme.colors.text,
      textAlign: 'left',
    },
    description: {
      color: theme.colors.textSecondary,
      textAlign: 'left',
      marginTop: spacing.xxs,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    price: {
      color: theme.colors.primary,
      textAlign: 'left',
      marginTop: spacing.sm,
    },
    endsAt: {
      color: theme.colors.warningText,
      textAlign: 'left',
      marginTop: spacing.xxs,
    },
    features: {
      marginTop: spacing.ssm,
      gap: spacing.xs,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    featureText: {
      color: theme.colors.textSecondary,
      textAlign: 'left',
      flex: 1,
    },
  });

export default PlanCard;
