import React, { useMemo, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Child } from '../hooks/useParentDashboard';
import { useParentDashboardContext } from '../context/ParentDashboardContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import { PARENT_HERO_GRADIENT, HAIRLINE_BLUE } from '../config/colors';
import UnifiedHeader from '../components/UnifiedHeader';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import ParentDashboardDoodles from '../components/ParentDashboardDoodles';
import WelcomeFamilyArt from '../components/WelcomeFamilyArt';

const ParentDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const { parentUser } = useAuth();

  const { children, loading, refreshing, handleRefresh, openAddModal } =
    useParentDashboardContext();

  const currentStyles = useMemo(
    () => styles({ theme, spacing, borderRadius, isRTL, typography, fontWeight }),
    [theme, spacing, borderRadius, isRTL, typography, fontWeight],
  );

  const renderChildRow = useCallback(
    (child: Child, isLast: boolean) => (
      <TouchableOpacity
        key={child.id}
        testID="parent-dashboard-child-card"
        style={[currentStyles.childRow, !isLast && currentStyles.childRowDivider]}
        onPress={() =>
          navigation.navigate('ChildDetailsScreen', {
            childId: child.id,
            childName: child.name,
            gradeName: child.grade?.name,
          })
        }
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
              { color: theme.colors.text, textAlign: 'left' },
            ]}
            numberOfLines={1}
          >
            {child.name}
          </Text>
          <View style={currentStyles.childMetaRow}>
            <Ionicons name="school-outline" size={13} color={theme.colors.textTertiary} />
            <Text style={[typography('caption'), currentStyles.childMetaText]} numberOfLines={1}>
              {child.grade?.name || t('profile_screen.not_specified')}
            </Text>
          </View>
          <View style={currentStyles.childMetaRow}>
            <Ionicons name="call-outline" size={13} color={theme.colors.textTertiary} />
            <Text style={[typography('caption'), currentStyles.childMetaText]}>{child.mobile}</Text>
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
    ),
    [currentStyles, navigation, theme, typography, fontWeight, isRTL, t],
  );

  const addChildButton = (
    <TouchableOpacity
      testID="parent-dashboard-add-another-child"
      style={currentStyles.addChildButton}
      onPress={openAddModal}
      activeOpacity={0.7}
    >
      <Ionicons name="add" size={18} color={theme.colors.primary} />
      <Text
        style={[
          typography('caption'),
          fontWeight('700'),
          { color: theme.colors.primary, marginStart: 6 },
        ]}
      >
        {t('parent_dashboard.add_another_child')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={currentStyles.container}>
      <ParentDashboardDoodles />
      <UnifiedHeader
        title={t('parent_dashboard.header_title')}
        showBackButton={false}
        rightContent={<NotificationBell />}
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
        <LinearGradient
          colors={PARENT_HERO_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={currentStyles.greetingCard}
        >
          <View style={currentStyles.greetingContent}>
            <Text style={currentStyles.greetingLabel}>{t('parent_dashboard.welcome_back')}</Text>
            <Text style={currentStyles.greetingName} numberOfLines={1}>
              {parentUser?.name || t('onboarding.role_parent')}
            </Text>
            <Text style={currentStyles.greetingSubtitle}>
              {t('parent_dashboard.track_subtitle')}
            </Text>
          </View>
          <View pointerEvents="none" style={currentStyles.familyArtContainer}>
            <WelcomeFamilyArt size={76} />
          </View>
        </LinearGradient>

        <View style={currentStyles.section}>
          <Text style={currentStyles.sectionTitle}>{t('parent_dashboard.my_children')}</Text>
          {loading && children.length === 0 ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
          ) : children.length === 0 ? (
            <>
              <View testID="parent-dashboard-empty" style={currentStyles.emptyState}>
                <View style={currentStyles.emptyIconBox}>
                  <Ionicons name="people-outline" size={48} color={theme.colors.textTertiary} />
                </View>
                <Text style={currentStyles.emptyText}>{t('parent_dashboard.no_children')}</Text>
              </View>
              {addChildButton}
            </>
          ) : (
            <>
              <View style={currentStyles.childListCard}>
                {children.map((child, i) => renderChildRow(child, i === children.length - 1))}
              </View>
              {addChildButton}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (config: any) => {
  const { theme, borderRadius, typography, fontWeight } = config;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 24,
    },
    greetingCard: {
      overflow: 'hidden',
      borderRadius: borderRadius.xl,
      padding: 18,
      marginBottom: 20,
      ...layout.shadow,
    },
    greetingContent: {
      paddingEnd: 84,
    },
    greetingLabel: {
      ...typography('label'),
      ...fontWeight('bold'),
      fontSize: 10.5,
      color: 'rgba(255,255,255,0.55)',
      letterSpacing: 1.2,
      textAlign: 'left',
      marginBottom: 3,
    },
    greetingName: {
      ...typography('body'),
      ...fontWeight('bold'),
      fontSize: 19,
      color: '#FFFFFF',
      textAlign: 'left',
    },
    greetingSubtitle: {
      ...typography('label'),
      fontSize: 12,
      color: 'rgba(255,255,255,0.65)',
      textAlign: 'left',
      marginTop: 4,
    },
    familyArtContainer: {
      position: 'absolute',
      end: 14,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textTertiary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 10,
      textAlign: 'left',
    },
    childListCard: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      marginBottom: 12,
      ...layout.shadow,
      shadowOpacity: 0.06,
    },
    childRow: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    childRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: HAIRLINE_BLUE,
    },
    childIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary100,
      justifyContent: 'center',
      alignItems: 'center',
      marginEnd: 12,
    },
    childInfo: {
      flex: 1,
    },
    childMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
    },
    childMetaText: {
      color: theme.colors.textTertiary,
      marginStart: 6,
      fontSize: 12.5,
    },
    viewProgressBtn: {
      marginStart: 8,
    },
    addChildButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.colors.primary + '33',
      backgroundColor: theme.colors.primary + '08',
      marginTop: 4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      marginBottom: 12,
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

export default ParentDashboardScreen;
