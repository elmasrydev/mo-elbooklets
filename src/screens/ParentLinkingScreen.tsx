import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import UnifiedHeader from '../components/UnifiedHeader';
import ParentSlotCard from '../components/ParentSlotCard';
import { useParentLinking } from '../hooks/useParentLinking';

const ParentLinkingScreen: React.FC = () => {
  const { theme, spacing } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();

  const {
    slots,
    loading,
    error,
    refetch,
    sendLinkRequest,
    respondToLink,
    cancelLinkRequest,
    isSending,
    isResponding,
    isCancelling,
  } = useParentLinking();

  const currentStyles = styles(theme, spacing, isRTL, typography, fontWeight);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={currentStyles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={currentStyles.centerContainer}>
          <Text style={currentStyles.errorText}>{t('parent_linking.load_error')}</Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={() => refetch()}>
            <Text style={currentStyles.retryText}>{t('parent_linking.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <Text style={currentStyles.description}>{t('parent_linking.description')}</Text>
        <ParentSlotCard
          slotNumber={1}
          slot={slots[0]}
          onSendInvite={sendLinkRequest}
          onRespond={respondToLink}
          onCancel={cancelLinkRequest}
          isSending={isSending}
          isResponding={isResponding}
          isCancelling={isCancelling}
        />
        <ParentSlotCard
          slotNumber={2}
          slot={slots[1]}
          onSendInvite={sendLinkRequest}
          onRespond={respondToLink}
          onCancel={cancelLinkRequest}
          isSending={isSending}
          isResponding={isResponding}
          isCancelling={isCancelling}
        />
      </View>
    );
  };

  return (
    <View style={currentStyles.container}>
      <UnifiedHeader title={t('parent_linking.header_title')} showBackButton={true} />
      <ScrollView contentContainerStyle={currentStyles.scrollContent}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = (theme: any, spacing: any, isRTL: boolean, typography: any, fontWeight: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: layout.screenPadding,
      paddingBottom: layout.screenPadding * 2,
    },
    description: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: 'left',
      marginBottom: spacing.lg,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    errorText: {
      ...typography('body'),
      color: theme.colors.error,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    retryText: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: 'white',
    },
  });

export default ParentLinkingScreen;
