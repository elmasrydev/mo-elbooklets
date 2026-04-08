import analytics from '@react-native-firebase/analytics';

/**
 * Centralized Analytics Service
 * 
 * This service provides a type-safe wrapper over Firebase Analytics.
 * All screen tracking and event logging should go through this service
 * instead of importing Firebase directly in components.
 */

export interface TrackParams {
  [key: string]: any;
}

export const analyticsService = {
  /**
   * Identify a user and set their traits.
   * Call this on login, register, or app start if the user is already logged in.
   */
  async identify(userId: string, traits: TrackParams = {}) {
    try {
      await analytics().setUserId(userId);
      if (Object.keys(traits).length > 0) {
        await analytics().setUserProperties(traits);
      }
    } catch (error) {
      console.error('[Analytics] Identify error:', error);
    }
  },

  /**
   * Reset the user identification. Call this on logout.
   */
  async reset() {
    try {
      await analytics().setUserId(null);
    } catch (error) {
      console.error('[Analytics] Reset error:', error);
    }
  },

  /**
   * Track a screen view.
   */
  async screen(screenName: string, screenClass?: string) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error('[Analytics] Screen view tracking error:', error);
    }
  },

  /**
   * Track User Authentication events
   */
  async trackLogin(method: string = 'phone') {
    await analytics().logLogin({ method });
  },

  async trackSignUp(method: string = 'phone') {
    await analytics().logSignUp({ method });
  },

  async trackLogout() {
    await analytics().logEvent('logout');
  },

  /**
   * Track Onboarding Workflow
   */
  async trackOnboardingCompleted() {
    await analytics().logEvent('onboarding_completed');
  },

  /**
   * Track Educational Engagement
   */
  async trackLessonStarted(params: TrackParams) {
    await analytics().logEvent('lesson_started', params);
  },

  async trackLessonCompleted(params: TrackParams) {
    await analytics().logEvent('lesson_completed', params);
  },

  async trackQuizStarted(params: TrackParams) {
    await analytics().logEvent('quiz_started', params);
  },

  async trackQuizCompleted(params: TrackParams) {
    await analytics().logEvent('quiz_completed', params);
  },

  /**
   * Track Community & Support
   */
  async trackLeaderboardViewed() {
    await analytics().logEvent('leaderboard_viewed');
  },

  async trackContactSupport(subject?: string) {
    await analytics().logEvent('contact_support', { subject });
  },

  /**
   * Track Localization Preferences
   */
  async trackLanguageChanged(language: 'ar' | 'en') {
    await analytics().logEvent('language_changed', { language });
  },
};

export default analyticsService;
