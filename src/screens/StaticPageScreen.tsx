import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { useSubjectTextAlign } from '../hooks/useSubjectTextAlign';
import UnifiedHeader from '../components/UnifiedHeader';
import RetryView from '../components/RetryView';
import { StaticPageDocument } from '../generated/graphql';
import { STATIC_PAGES } from '../config/staticPages';
import { isArabicText } from '../config/fonts';
import { layout } from '../config/layout';
import { loadFailureMessage } from '../utils/queryError';
import { parseStaticPage, pickLocalizedBody, StaticPageBlock } from '../utils/staticPage';

type ThemeTokens = Pick<ReturnType<typeof useTheme>, 'theme' | 'spacing' | 'borderRadius'>;
type StaticPageRoute = RouteProp<{ StaticPage: { slug: string } }, 'StaticPage'>;

/**
 * One CMS page — About Us or a legal page (BKLT-300) — chosen by the `slug`
 * route param, which must be one of STATIC_PAGES.
 *
 * The header uses the bundled label, so it shows before the body arrives. The
 * body is plain text parsed into headings, paragraphs, bullets and numbered
 * steps (src/utils/staticPage.ts). A page the environment does not hold, or an
 * unpublished one, gets an "unavailable" state rather than an error.
 */
const StaticPageScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<StaticPageRoute>();
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { typography } = useTypography();

  const entry = STATIC_PAGES.find((page) => page.slug === route.params.slug);
  const title = entry ? t(entry.labelKey) : '';

  const { data, error, refetch } = useQuery(StaticPageDocument, {
    variables: { slug: entry?.slug ?? '' },
    skip: !entry,
  });

  const page = data?.page;
  const body = page?.is_active
    ? pickLocalizedBody(language, { en: page.content_en, ar: page.content_ar })
    : null;
  const bodyText = body?.text;
  const blocks = useMemo(
    () => (bodyText ? parseStaticPage(bodyText, title) : []),
    [bodyText, title],
  );
  // Align by the language actually shown: a page missing its Arabic body falls
  // back to English, which must not sit on the Arabic UI's edge.
  const { contentAlign, contentRowDirection } = useSubjectTextAlign(body?.language, bodyText);
  const failure = loadFailureMessage(data, error, t('static_pages.load_error'));

  const s = useMemo(() => styles({ theme, spacing, borderRadius }), [theme, spacing, borderRadius]);

  const renderBlock = (block: StaticPageBlock, index: number) => {
    const textStyle = { textAlign: contentAlign };
    const rowStyle = [s.listRow, { flexDirection: contentRowDirection }];
    const bodyType = typography('body', undefined, isArabicText(block.text));

    switch (block.kind) {
      case 'heading':
        return (
          <Text
            key={index}
            selectable
            style={[
              typography('h3', 'bold', isArabicText(block.text)),
              s.heading,
              index === 0 && s.firstHeading,
              textStyle,
            ]}
          >
            {block.text}
          </Text>
        );
      case 'paragraph':
        return (
          <Text key={index} selectable style={[bodyType, s.paragraph, textStyle]}>
            {block.text}
          </Text>
        );
      case 'bullet':
        return (
          <View key={index} style={rowStyle}>
            <View style={s.bulletDot} />
            <Text selectable style={[bodyType, s.listText, textStyle]}>
              {block.text}
            </Text>
          </View>
        );
      case 'step':
        return (
          <View key={index} style={rowStyle}>
            <View style={s.stepBadge}>
              <Text style={[typography('caption', 'bold'), s.stepMarker]}>{block.marker}</Text>
            </View>
            <Text selectable style={[bodyType, s.listText, textStyle]}>
              {block.text}
            </Text>
          </View>
        );
    }
  };

  const renderBody = () => {
    if (failure) return <RetryView onRetry={() => refetch()} message={failure} />;
    if (entry && !data) {
      return (
        <View style={s.centered} testID="static-page-loading">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    if (blocks.length === 0) {
      return (
        <View style={s.centered} testID="static-page-unavailable">
          <Ionicons name="document-text-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={[typography('body'), s.unavailableText]}>
            {t('static_pages.unavailable')}
          </Text>
        </View>
      );
    }
    return (
      <ScrollView
        testID="static-page-content"
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>{blocks.map(renderBlock)}</View>
      </ScrollView>
    );
  };

  return (
    <View style={s.container}>
      <UnifiedHeader
        title={title}
        showBackButton
        onBackPress={() => navigation.goBack()}
        centerAlign
      />
      {renderBody()}
    </View>
  );
};

const styles = ({ theme, spacing, borderRadius }: ThemeTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: layout.screenPadding,
      paddingBottom: spacing.xl * 2,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.lg,
    },
    heading: {
      color: theme.colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    firstHeading: {
      marginTop: 0,
    },
    paragraph: {
      color: theme.colors.textSecondary,
      marginBottom: spacing.sm,
    },
    listRow: {
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    listText: {
      flex: 1,
      color: theme.colors.textSecondary,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
      // Roughly centres the dot on the first line of body text.
      marginTop: spacing.sm,
    },
    stepBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepMarker: {
      color: theme.colors.primary,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    unavailableText: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

export default StaticPageScreen;
