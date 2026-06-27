import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { analytics } from '../../lib/analytics';
import { spacing, borderRadius } from '../../config/spacing';
import { layout } from '../../config/layout';

interface BokiFloatingButtonProps {
  navigationRef: React.RefObject<NavigationContainerRef<any> | null>;
}

/**
 * Routes where the floating Boki button must stay hidden: unauthenticated and
 * one-off flows, the parent role, settings, immersive full-screen flows
 * (lesson/quiz), and the Boki chat itself.
 */
const BOKI_HIDDEN_ROUTES = new Set<string>([
  'Splash',
  'Onboarding',
  'Login',
  'Register',
  'ForgotPassword',
  'ParentLogin',
  'ParentRegister',
  'ParentForgotPassword',
  'OTPVerification',
  'RegistrationSuccess',
  'ParentDashboard',
  'ParentSettings',
  'InternalSettings',
  'StudyLesson',
  'QuizTaking',
  'QuizResults',
  'QuizReview',
  'QuizFlowSubjects',
  'QuizFlowLessons',
  'QuizFlowSettings',
  'QuizGenerating',
  'BokiChat',
  'BokiConversations',
]);

/**
 * Global floating Boki button (BKLT-221, Phase 1).
 *
 * Mounted once at the app root (outside the navigators) so it persists across
 * navigation. Visible only for authenticated students on supported screens; it
 * tracks the live route via the navigation container ref and opens the chat.
 */
const BokiFloatingButton: React.FC<BokiFloatingButtonProps> = ({ navigationRef }) => {
  const { isAuthenticated, userRole } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [routeName, setRouteName] = useState<string | undefined>(undefined);

  useEffect(() => {
    const ref = navigationRef.current;
    if (!ref) return undefined;
    const sync = () => setRouteName(ref.getCurrentRoute()?.name);
    sync();
    return ref.addListener('state', sync);
  }, [navigationRef, isAuthenticated]);

  const handlePress = useCallback(() => {
    analytics.trackBokiOpened();
    navigationRef.current?.navigate('BokiChat');
  }, [navigationRef]);

  if (!isAuthenticated || userRole !== 'student') return null;
  if (routeName && BOKI_HIDDEN_ROUTES.has(routeName)) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <TouchableOpacity
        testID="boki-fab"
        accessibilityRole="button"
        accessibilityLabel="Boki"
        activeOpacity={0.85}
        onPress={handlePress}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.shadow,
            bottom: insets.bottom + layout.tabBarContentHeight + spacing.md,
          },
        ]}
      >
        <Ionicons name="sparkles" size={spacing.icon.lg} color={theme.colors.textOnDark} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    end: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default BokiFloatingButton;
