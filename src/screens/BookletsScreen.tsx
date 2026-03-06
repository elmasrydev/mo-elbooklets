import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../config/layout';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';
import { useTranslation } from 'react-i18next';

const BookletsScreen: React.FC = () => {
  const common = useCommonStyles();
  const { theme } = useTheme();
  const { typography, fontWeight } = useTypography();
  const styles = createBookletStyles(fontWeight);
  const { t } = useTranslation();

  return (
    <View style={common.container}>
      {/* Standardized Header */}
      <UnifiedHeader
        title={t('booklets_screen.header_title')}
        subtitle={t('booklets_screen.header_subtitle')}
        showBackButton
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: layout.screenPadding,
          paddingBottom: Math.max(common.insets.bottom, 20),
        }}
      >
        <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
          <Text style={styles.emptyStateIcon}>📚</Text>
          <Text style={[typography('h3'), styles.emptyStateTitle, { color: theme.colors.text }]}>
            {t('booklets_screen.no_booklets')}
          </Text>
          <Text
            style={[
              typography('body'),
              styles.emptyStateSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {t('booklets_screen.no_booklets_subtitle')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createBookletStyles = (fontWeight: any) =>
  StyleSheet.create({
    emptyState: {
      padding: 40,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 10, // matching sectionGap
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    emptyStateIcon: {
      fontSize: 64,
      marginBottom: 20,
    },
    emptyStateTitle: {
      ...fontWeight('600'),
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      textAlign: 'center',
    },
  });

export default BookletsScreen;
