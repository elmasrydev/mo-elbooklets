import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import UnifiedHeader from '../components/UnifiedHeader';
import { LinkRequest } from '../hooks/useParentDashboard';
import { useParentDashboardContext } from '../context/ParentDashboardContext';

/**
 * Requests tab — incoming/outgoing parent-child link requests.
 * Previously rendered inline on the dashboard; moved to its own bottom tab.
 */
const ParentRequestsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { typography, fontWeight } = useTypography();
  const {
    incomingRequests,
    loading,
    refreshing,
    respondingId,
    handleRefresh,
    handleRespondToLink,
    handleCancelRequest,
  } = useParentDashboardContext();

  const currentStyles = useMemo(
    () => styles({ theme, spacing, borderRadius, typography, fontWeight }),
    [theme, spacing, borderRadius, typography, fontWeight],
  );

  const renderIncomingRequest = useCallback(
    (req: LinkRequest) => {
      const isStudentInitiated = req.initiated_by === 'student';
      const isResponding = respondingId === req.id;

      return (
        <View key={req.id} style={currentStyles.incomingCard}>
          <View style={currentStyles.incomingHeader}>
            <View style={currentStyles.incomingIconBox}>
              <Ionicons
                name={isStudentInitiated ? 'person-add' : 'time-outline'}
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={currentStyles.incomingHeaderText}>
              <Text
                style={[
                  typography('body'),
                  fontWeight('700'),
                  { color: theme.colors.text, textAlign: 'left' },
                ]}
              >
                {req.child.name}
              </Text>
              <Text
                style={[
                  typography('caption'),
                  { color: theme.colors.textTertiary, textAlign: 'left' },
                ]}
              >
                {req.child.school_name || t('onboarding.role_student')}
              </Text>
            </View>

            {!isStudentInitiated && (
              <View style={currentStyles.pendingBadge}>
                <Text
                  style={[
                    typography('caption'),
                    fontWeight('600'),
                    { color: theme.colors.primary },
                  ]}
                >
                  {t('parent_dashboard.status_pending')}
                </Text>
              </View>
            )}
          </View>

          <View style={currentStyles.incomingActions}>
            {isStudentInitiated ? (
              <>
                <TouchableOpacity
                  testID="parent-dashboard-request-decline"
                  style={[currentStyles.actionBtn, currentStyles.declineBtn]}
                  onPress={() => handleRespondToLink(req.id, 'DECLINED')}
                  disabled={isResponding}
                >
                  <Text
                    style={[
                      typography('caption'),
                      fontWeight('600'),
                      { color: theme.colors.error },
                    ]}
                  >
                    {t('common.decline')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="parent-dashboard-request-accept"
                  style={[currentStyles.actionBtn, currentStyles.acceptBtn]}
                  onPress={() => handleRespondToLink(req.id, 'ACCEPTED')}
                  disabled={isResponding}
                >
                  {isResponding ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[typography('caption'), fontWeight('600'), { color: '#FFFFFF' }]}>
                      {t('common.accept')}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                testID="parent-dashboard-request-cancel"
                style={[currentStyles.actionBtn, currentStyles.declineBtn, { flex: 1 }]}
                onPress={() => handleCancelRequest(req.id)}
                disabled={isResponding}
              >
                {isResponding ? (
                  <ActivityIndicator color={theme.colors.error} size="small" />
                ) : (
                  <Text
                    style={[
                      typography('caption'),
                      fontWeight('600'),
                      { color: theme.colors.error },
                    ]}
                  >
                    {t('parent_dashboard.cancel_request')}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [
      currentStyles,
      theme,
      typography,
      fontWeight,
      respondingId,
      handleRespondToLink,
      handleCancelRequest,
      t,
    ],
  );

  return (
    <View style={currentStyles.container}>
      <UnifiedHeader title={t('parent_dashboard.invitations')} showBackButton={false} />

      <ScrollView
        contentContainerStyle={currentStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && incomingRequests.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.primary} />
        ) : incomingRequests.length === 0 ? (
          <View testID="parent-requests-empty" style={currentStyles.emptyState}>
            <View style={currentStyles.emptyIconBox}>
              <Ionicons name="mail-open-outline" size={48} color={theme.colors.textTertiary} />
            </View>
            <Text style={currentStyles.emptyText}>{t('parent_dashboard.empty_invitations')}</Text>
          </View>
        ) : (
          incomingRequests.map(renderIncomingRequest)
        )}
      </ScrollView>
    </View>
  );
};

const styles = (config: any) => {
  const { theme, borderRadius, typography } = config;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 24,
    },
    incomingCard: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary + '20',
      ...layout.shadow,
    },
    incomingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    incomingIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary100,
      justifyContent: 'center',
      alignItems: 'center',
      marginEnd: 12,
    },
    incomingHeaderText: {
      flex: 1,
    },
    pendingBadge: {
      backgroundColor: theme.colors.primary + '15',
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
      borderRadius: borderRadius.sm,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    incomingActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      height: 36,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    declineBtn: {
      backgroundColor: theme.colors.error + '10',
      borderWidth: 1,
      borderColor: theme.colors.error + '20',
    },
    acceptBtn: {
      backgroundColor: theme.colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      marginTop: 24,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
    },
    emptyIconBox: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyText: {
      ...typography('body'),
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },
  });
};

export default ParentRequestsScreen;
