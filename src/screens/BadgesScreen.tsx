import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTypography } from '../hooks/useTypography';
import UnifiedHeader from '../components/UnifiedHeader';
import { useGetAllBadgesQuery, Badge } from '../generated/graphql';

const BadgesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { typography, fontWeight } = useTypography();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [modalImageError, setModalImageError] = useState(false);

  // Reset modal error when badge changes
  useEffect(() => {
    setModalImageError(false);
  }, [selectedBadge]);

  // Helper to validate if an icon name is likely a valid MaterialIcon
  const getValidIcon = (iconName: string | null | undefined): any => {
    if (!iconName) return 'stars';
    
    // Curated list of design-approved icons from code.html and common ones
    const DESIGN_ICONS = [
      'rocket_launch', 'edit_note', 'calendar_month', 'star', 'trending_up', 
      'menu_book', 'workspace_premium', 'stars', 'ribbon', 'school', 'psychology', 
      'quiz', 'emoji_events', 'military_tech', 'diamond', 'local_fire_department', 
      'wb_sunny', 'event_available', 'shield', 'lightbulb', 'speed', 'volunteer_activism', 
      'show_chart', 'bolt', 'calculate', 'functions', 'science', 'biotech', 'public'
    ];

    // If it's in our design list, use it
    if (DESIGN_ICONS.includes(iconName)) return iconName;
    
    // Basic format check: no spaces, lowercase (Material icon style)
    const isValidFormat = /^[a-z_0-9]+$/.test(iconName);
    if (isValidFormat) return iconName;

    return 'stars';
  };

  const { data, loading, error, refetch } = useGetAllBadgesQuery();

  const badges = data?.allBadges || [];
  const earnedBadgesCount = badges.filter((b: Badge) => !!b.awardedAt).length;
  const progress = badges.length > 0 ? (earnedBadgesCount / badges.length) * 100 : 0;

  // Group badges by category DYNAMICALLY from fetched data
  const groupedBadges = badges.reduce((acc: Record<string, { category: any; badges: Badge[] }>, badge) => {
    if (!badge || !badge.category) return acc;

    const catId = badge.category.id;

    if (!acc[catId]) {
      acc[catId] = {
        category: badge.category,
        badges: []
      };
    }
    acc[catId].badges.push(badge);
    return acc;
  }, {});

  const finalCategories = Object.values(groupedBadges).sort((a: any, b: any) => {
    return (a.category.name || '').localeCompare(b.category.name || '');
  });

  if (loading) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: theme.colors.background }]}>
        <UnifiedHeader title={t('badges_screen.header_title', 'Badges')} showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[typography('body'), { color: theme.colors.textSecondary, marginTop: 12 }]}>
            {t('badges_screen.loading', 'Loading badges...')}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: theme.colors.background }]}>
        <UnifiedHeader title={t('badges_screen.header_title', 'Badges')} showBackButton />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={[typography('body'), { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center', paddingHorizontal: 32 }]}>
            {t('badges_screen.error_loading', 'Could not load badges. Please check your connection.')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[typography('button'), { color: '#fff' }]}>{t('common.error_boundary_retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.background }]}>
      <UnifiedHeader title={t('badges_screen.header_title', 'Badges')} showBackButton />


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Total Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: theme.colors.surface, borderRadius: borderRadius.xl }]}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleContainer}>
              <View style={[styles.progressIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="ribbon" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[typography('h3'), fontWeight('700'), { color: theme.colors.primary }]}>
                {t('badges_screen.total_progress', 'Total Progress')}
              </Text>
            </View>
            <Text style={[typography('caption'), fontWeight('700'), { color: theme.colors.textSecondary }]}>
              {earnedBadgesCount}/{badges.length} {t('badges_screen.badges_short', 'Badges')}
            </Text>
          </View>

          <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border + '50' }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${progress}%`
                }
              ]}
            />
          </View>
        </View>

        {/* Categories Sections */}
        {finalCategories.map((group: any) => {
          const catEarned = group.badges.filter((b: any) => !!b.awardedAt).length;
          const catTotal = group.badges.length;
          const catPercentage = (catEarned / catTotal) * 100;
          const catColor = group.category.color || theme.colors.primary;

          return (
            <View
              key={group.category.id}
              style={[styles.categorySection, { backgroundColor: theme.colors.surface, borderRadius: borderRadius.lg }]}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <MaterialIcons name={getValidIcon(group.category.icon)} size={18} color={catColor} />
                  <Text style={[typography('body'), fontWeight('700'), { color: catColor, marginLeft: 8 }]}>
                    {group.category.name}
                  </Text>
                </View>

                <View style={styles.categoryProgressRow}>
                  <View style={[styles.catProgressBarBg, { backgroundColor: theme.colors.border + '50' }]}>
                    <View style={[styles.catProgressBarFill, { backgroundColor: catColor, width: `${catPercentage}%` }]} />
                  </View>
                  <Text style={[typography('caption'), fontWeight('700'), { color: theme.colors.textSecondary, marginLeft: 8, width: 30, textAlign: 'right' }]}>
                    {catEarned}/{catTotal}
                  </Text>
                </View>
              </View>

              <View style={styles.badgeGrid}>
                {group.badges.map((badge: Badge) => (
                  <TouchableOpacity
                    key={badge.id}
                    style={styles.badgeWrapper}
                    onPress={() => setSelectedBadge(badge as Badge)}
                  >
                    <View
                      style={[
                        styles.badgeIconOuter,
                        { backgroundColor: theme.colors.background + '80' }
                      ]}
                    >
                      <View style={[
                        styles.badgeIconInner,
                        {
                          backgroundColor: badge.awardedAt ? catColor + '15' : theme.colors.border + '30',
                          borderColor: badge.awardedAt ? catColor : 'transparent',
                          borderWidth: badge.awardedAt ? 1.5 : 0
                        }
                      ]}>
                        {badge.logoUrl ? (
                          <Image
                            source={{
                              uri: badge.logoUrl.startsWith('/')
                                ? `https://prs.elbooklets.com${badge.logoUrl}`
                                : badge.logoUrl
                            }}
                            style={[
                              styles.badgeImage,
                              !badge.awardedAt && styles.grayscaleImage
                            ]}
                          />
                        ) : (
                          <MaterialIcons 
                            name={getValidIcon(group.category.icon)} 
                            size={24} 
                            color={badge.awardedAt ? catColor : theme.colors.textTertiary} 
                            style={!badge.awardedAt && { opacity: 0.3 }}
                          />
                        )}
                        {!badge.awardedAt && (
                          <View style={styles.lockOverlay}>
                            <Ionicons name="lock-closed" size={14} color={theme.colors.textSecondary} opacity={0.5} />
                          </View>
                        )}
                      </View>
                    </View>
                    <Text
                      style={[
                        typography('caption'),
                        fontWeight(badge.awardedAt ? '600' : 'normal'),
                        styles.badgeName,
                        { color: badge.awardedAt ? theme.colors.text : theme.colors.textSecondary }
                      ]}
                      numberOfLines={2}
                    >
                      {badge.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {badges.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="medal-outline" size={64} color={theme.colors.border} />
            <Text style={[typography('body'), { color: theme.colors.textSecondary, marginTop: 16 }]}>
              {t('badges_screen.no_badges', 'No badges available yet.')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Badge Details Modal */}
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBadge(null)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: borderRadius.xl }]}>
            {selectedBadge && (
              <>
                <View style={[styles.modalHeader, { backgroundColor: (selectedBadge.category?.color || theme.colors.primary) + '10' }]}>
                  <View style={[styles.modalImageContainer, {
                    backgroundColor: theme.colors.surface,
                    borderRadius: borderRadius.lg,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 5
                  }]}>
                    {selectedBadge.logoUrl && !modalImageError ? (
                      <Image
                        source={{
                          uri: selectedBadge.logoUrl.startsWith('/')
                            ? `https://prs.elbooklets.com${selectedBadge.logoUrl}`
                            : selectedBadge.logoUrl
                        }}
                        style={styles.modalBadgeImage}
                        onError={() => setModalImageError(true)}
                      />
                    ) : (
                      <MaterialIcons 
                        name={getValidIcon(selectedBadge.category?.icon)} 
                        size={60} 
                        color={selectedBadge.awardedAt ? (selectedBadge.category?.color || theme.colors.primary) : theme.colors.textTertiary} 
                      />
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedBadge(null)}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={[typography('h2'), fontWeight('700'), { color: theme.colors.text, marginBottom: 8, textAlign: 'center' }]}>
                    {selectedBadge.name}
                  </Text>

                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: selectedBadge.awardedAt ? theme.colors.success + '15' : theme.colors.border + '40' }
                  ]}>
                    <Ionicons
                      name={selectedBadge.awardedAt ? "checkmark-circle" : "lock-closed"}
                      size={14}
                      color={selectedBadge.awardedAt ? theme.colors.success : theme.colors.textSecondary}
                    />
                    <Text style={[
                      typography('caption'),
                      fontWeight('700'),
                      {
                        color: selectedBadge.awardedAt ? theme.colors.success : theme.colors.textSecondary,
                        marginLeft: 4
                      }
                    ]}>
                      {selectedBadge.awardedAt ? t('badges_screen.earned', 'Earned') : t('badges_screen.locked', 'Locked')}
                    </Text>
                  </View>

                  <Text style={[typography('body'), { color: theme.colors.textSecondary, marginVertical: spacing.md, textAlign: 'center' }]}>
                    {selectedBadge.description || t('badges_screen.no_description', 'Complete challenges to earn this badge!')}
                  </Text>

                  <View style={[styles.criteriaBox, { backgroundColor: theme.colors.background, borderRadius: borderRadius.md, padding: spacing.md }]}>
                    <Text style={[typography('caption'), fontWeight('700'), { color: theme.colors.textTertiary, marginBottom: 8, textTransform: 'uppercase', textAlign: isRTL ? 'right' : 'left' }]}>
                      {t('badges_screen.requirement', 'REQUIREMENT')}
                    </Text>
                    <Text style={[typography('body'), { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                      {selectedBadge.rulesPreview}
                    </Text>
                  </View>

                  {selectedBadge.awardedAt && (
                    <Text style={[typography('caption'), { color: theme.colors.textTertiary, marginTop: spacing.md, textAlign: 'center' }]}>
                      {t('badges_screen.awarded_at', 'Awarded on {{date}}', { date: new Date(selectedBadge.awardedAt).toLocaleDateString() })}
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  progressCard: {
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  progressBarBg: {
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  categorySection: {
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  categoryHeader: {
    marginBottom: 16,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catProgressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  catProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  badgeWrapper: {
    width: '25%', // 4 columns
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  badgeIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeIconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  grayscaleImage: {
    opacity: 0.3,
    tintColor: '#9CA3AF',
  },
  lockOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    padding: 2,
  },
  badgeName: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 12,
    height: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 20,
  },
  modalImageContainer: {
    marginBottom: -40,
  },
  modalBadgeImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalBody: {
    padding: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  criteriaBox: {
    width: '100%',
  },
});

export default BadgesScreen;
