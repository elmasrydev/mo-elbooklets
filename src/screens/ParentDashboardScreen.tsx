import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useParentDashboard, LinkRequest, Child } from '../hooks/useParentDashboard';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import UnifiedHeader from '../components/UnifiedHeader';
import { useAuth } from '../context/AuthContext';

const ParentDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { parentUser } = useAuth();

  const {
    children,
    incomingRequests,
    loading,
    refreshing,
    handleRefresh,
    handleRespondToLink,
    handleCancelRequest,
    handleAddChild,
    respondingId,
  } = useParentDashboard();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [childMobile, setChildMobile] = useState('');

  const currentStyles = styles({
    theme,
    spacing,
    borderRadius,
    isRTL,
    typography,
    fontWeight,
  });

  const onAddChild = async () => {
    const success = await handleAddChild(childMobile);
    if (success) {
      setIsAddModalVisible(false);
      setChildMobile('');
    }
  };

  const renderChildCard = (child: Child) => (
    <TouchableOpacity
      key={child.id}
      style={currentStyles.childCard}
      onPress={() => navigation.navigate('ChildDetailsScreen', { childId: child.id })}
      activeOpacity={0.7}
    >
      <View style={currentStyles.childIconContainer}>
        <Ionicons name="person" size={24} color={theme.colors.primary} />
      </View>
      <View style={currentStyles.childInfo}>
        <Text
          style={[
            typography('body'),
            fontWeight('700'),
            { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
          ]}
        >
          {child.name}
        </Text>
        <View style={currentStyles.childSubInfo}>
          <Ionicons name="call-outline" size={12} color={theme.colors.textTertiary} />
          <Text
            style={[
              typography('caption'),
              { color: theme.colors.textTertiary, marginHorizontal: 4 },
            ]}
          >
            {child.mobile}
          </Text>
          <View style={currentStyles.infoSeparator} />
          <Ionicons name="school-outline" size={12} color={theme.colors.textTertiary} />
          <Text
            style={[
              typography('caption'),
              { color: theme.colors.textTertiary, marginHorizontal: 4 },
            ]}
            numberOfLines={1}
          >
            {child.grade?.name || t('profile_screen.not_specified')}
          </Text>
        </View>
      </View>
      <View style={currentStyles.viewProgressBtn}>
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={24}
          color={theme.colors.textTertiary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderIncomingRequest = (req: LinkRequest) => {
    const isStudentInitiated = req.initiated_by === 'student';
    const isResponding = respondingId === req.id;

    return (
      <View key={req.id} style={currentStyles.incomingCard}>
        {/* Card header: child info */}
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
                { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {req.child.name}
            </Text>
            <Text
              style={[
                typography('caption'),
                { color: theme.colors.textTertiary, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {req.child.school_name || t('onboarding.role_student')}
            </Text>
          </View>

          {/* Pending badge for parent-initiated requests */}
          {!isStudentInitiated && (
            <View style={currentStyles.pendingBadge}>
              <Text style={[typography('caption'), fontWeight('600'), { color: theme.colors.primary }]}>
                {t('parent_dashboard.status_pending')}
              </Text>
            </View>
          )}
        </View>

        {/* Actions: branch on who initiated */}
        <View style={currentStyles.incomingActions}>
          {isStudentInitiated ? (
            // Student sent invite → parent can Accept or Decline
            <>
              <TouchableOpacity
                style={[currentStyles.actionBtn, currentStyles.declineBtn]}
                onPress={() => handleRespondToLink(req.id, 'DECLINED')}
                disabled={isResponding}
              >
                <Text style={[typography('caption'), fontWeight('600'), { color: theme.colors.error }]}>
                  {t('common.decline')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
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
            // Parent sent invite → waiting for student; can cancel
            <TouchableOpacity
              style={[currentStyles.actionBtn, currentStyles.declineBtn, { flex: 1 }]}
              onPress={() => handleCancelRequest(req.id)}
              disabled={isResponding}
            >
              {isResponding ? (
                <ActivityIndicator color={theme.colors.error} size="small" />
              ) : (
                <Text style={[typography('caption'), fontWeight('600'), { color: theme.colors.error }]}>
                  {t('parent_dashboard.cancel_request')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={currentStyles.container}>
      <UnifiedHeader
        title={t('parent_dashboard.header_title')}
        hideBackButton
        rightContent={
          <TouchableOpacity
            style={currentStyles.settingsBtn}
            onPress={() => navigation.navigate('ParentSettings')}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

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
        {/* Greeting Card */}
        <View style={currentStyles.greetingCard}>
          <View style={currentStyles.greetingContent}>
            <Text
              style={[
                typography('h2'),
                fontWeight('bold'),
                { color: '#FFFFFF', textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('parent_dashboard.greeting', {
                name: parentUser?.name || t('onboarding.role_parent'),
              })}
            </Text>
          </View>
          <View style={currentStyles.shieldContainer}>
            <Ionicons name="shield-checkmark" size={60} color="rgba(255,255,255,0.2)" />
          </View>
        </View>

        {/* Incoming Requests Section - Only visible if there are requests */}
        {incomingRequests && incomingRequests.length > 0 && (
          <View style={currentStyles.section}>
            <Text style={currentStyles.sectionTitle}>{t('parent_dashboard.invitations')}</Text>
            {incomingRequests.map(renderIncomingRequest)}
          </View>
        )}

        {/* Children List */}
        <View style={currentStyles.section}>
          <Text style={currentStyles.sectionTitle}>{t('parent_dashboard.my_children')}</Text>
          {loading && children.length === 0 ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
          ) : children.length === 0 ? (
            <View style={currentStyles.emptyState}>
              <View style={currentStyles.emptyIconBox}>
                <Ionicons name="people-outline" size={48} color={theme.colors.textTertiary} />
              </View>
              <Text style={currentStyles.emptyText}>{t('parent_dashboard.no_children')}</Text>
            </View>
          ) : (
            children.map(renderChildCard)
          )}
        </View>
      </ScrollView>

      {/* Floating Add Child Button */}
      <TouchableOpacity
        style={[currentStyles.fab, isRTL ? { left: 24 } : { right: 24 }]}
        onPress={() => setIsAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="person-add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Child Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={currentStyles.modalOverlay}>
          <View style={currentStyles.modalContent}>
            <Text style={currentStyles.modalTitle}>{t('parent_dashboard.add_child')}</Text>
            <Text style={currentStyles.modalSubtitle}>
              {t('parent_dashboard.enter_child_mobile')}
            </Text>

            <TextInput
              style={[currentStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={t('parent_dashboard.child_mobile_placeholder')}
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="phone-pad"
              value={childMobile}
              onChangeText={setChildMobile}
            />

            <View style={currentStyles.modalActions}>
              <TouchableOpacity
                style={[currentStyles.modalBtn, currentStyles.cancelBtn]}
                onPress={() => setIsAddModalVisible(false)}
              >
                <Text style={currentStyles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[currentStyles.modalBtn, currentStyles.confirmBtn]}
                onPress={onAddChild}
                disabled={loading || !childMobile}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={currentStyles.confirmBtnText}>
                    {t('parent_dashboard.add_child')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = (config: any) => {
  const { theme, spacing, borderRadius, isRTL, typography, fontWeight } = config;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    settingsBtn: {
      padding: 4,
    },
    greetingCard: {
      overflow: 'hidden',
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.xl,
      padding: 24,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
      ...layout.shadow,
    },
    greetingContent: {
      flex: 1,
    },
    shieldContainer: {
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: isRTL ? 'right' : 'left',
    },
    childCard: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      padding: 16,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 12,
      ...layout.shadow,
      shadowOpacity: 0.05,
    },
    childIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary100,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: isRTL ? 12 : 0,
      marginRight: isRTL ? 0 : 12,
    },
    childInfo: {
      flex: 1,
    },
    childSubInfo: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    infoSeparator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.textTertiary,
      marginHorizontal: 8,
      opacity: 0.3,
    },
    viewProgressBtn: {
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
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
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
      marginLeft: isRTL ? 12 : 0,
      marginRight: isRTL ? 0 : 12,
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
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
    fab: {
      position: 'absolute',
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...layout.shadow,
      elevation: 5,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl,
      padding: 24,
      ...layout.shadow,
    },
    modalTitle: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
    },
    modalSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      marginBottom: 20,
      textAlign: isRTL ? 'right' : 'left',
    },
    input: {
      backgroundColor: theme.colors.background,
      borderRadius: borderRadius.md,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      color: theme.colors.text,
      marginBottom: 24,
    },
    modalActions: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 12,
    },
    modalBtn: {
      flex: 1,
      height: 48,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    confirmBtn: {
      backgroundColor: theme.colors.primary,
    },
    cancelBtnText: {
      color: theme.colors.textSecondary,
      ...fontWeight('600'),
    },
    confirmBtnText: {
      color: '#FFFFFF',
      ...fontWeight('600'),
    },
  });
};

export default ParentDashboardScreen;
