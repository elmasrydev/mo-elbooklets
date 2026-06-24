import { segmentClient } from './segmentClient';

/**
 * Interface for Lesson Started/Completed event parameters
 */
export interface LessonAnalyticsParams {
  lesson_id: string;
  lesson_title?: string;
  chapter_id?: string;
  chapter_title?: string;
  subject_id?: string;
  subject_title?: string;
}

/**
 * Interface for Quiz Started/Completed event parameters
 */
export interface QuizAnalyticsParams {
  quiz_id: string;
  quiz_title?: string;
  subject_id?: string;
  lesson_count?: number;
  score?: number;
  total_questions?: number;
  passed?: boolean;
}

/**
 * Centralized Analytics Service
 * All analytics tracking should go through this service to maintain
 * a clean separation between the UI and the analytics provider.
 *
 * NOTE: This service currently uses Segment SDK as a local router
 * to send events natively to Firebase and other local plugins.
 */
export const analytics = {
  /**
   * Identify a user and set their traits
   */
  identify: (userId: string, traits?: Record<string, any>) => {
    if (__DEV__) console.log('👤 [Analytics] Identify:', userId, traits);
    segmentClient.identify(userId, traits);
  },

  /**
   * Track a general event
   */
  track: (event: string, properties?: Record<string, any>) => {
    if (__DEV__) console.log(`📊 [Analytics] Track: ${event}`, properties);
    segmentClient.track(event, properties);
  },

  /**
   * Track a screen view
   */
  screen: (name: string, properties?: Record<string, any>) => {
    if (__DEV__) console.log(`📱 [Analytics] Screen: ${name}`, properties);
    segmentClient.screen(name, properties);
  },

  /**
   * Reset analytics state (usually called on logout)
   */
  reset: () => {
    if (__DEV__) console.log('🔄 [Analytics] Reset');
    segmentClient.reset();
  },

  // --- Specialized Event Trackers ---

  trackLogin: (method: string = 'phone') => {
    analytics.track('Login', { method });
  },

  trackSignUp: (method: string = 'phone') => {
    analytics.track('Sign Up', { method });
  },

  trackLogout: () => {
    analytics.track('Logout');
    analytics.reset();
  },

  trackOnboardingCompleted: () => {
    analytics.track('Onboarding Completed');
  },

  trackSubjectStarted: (subjectId: string, subjectName: string) => {
    analytics.track('Subject Started', { subject_id: subjectId, subject_name: subjectName });
  },

  trackLessonStarted: (params: LessonAnalyticsParams) => {
    analytics.track('Lesson Started', params);
  },

  trackLessonCompleted: (params: LessonAnalyticsParams) => {
    analytics.track('Lesson Completed', params);
  },

  trackQuizStarted: (params: QuizAnalyticsParams) => {
    analytics.track('Quiz Started', params);
  },

  trackQuizCompleted: (params: QuizAnalyticsParams) => {
    analytics.track('Quiz Completed', params);
  },

  trackLeaderboardViewed: () => {
    analytics.track('Leaderboard Viewed');
  },

  trackContactSupport: (subject?: string) => {
    analytics.track('Contact Support', { subject });
  },

  trackLanguageChanged: (language: 'ar' | 'en') => {
    analytics.track('Language Changed', { language });
    // Update local context for all subsequent events
    segmentClient.context.set({
      locale: language,
    });
  },

  // --- Boki AI Assistant (BKLT-221) ---

  trackBokiOpened: () => {
    analytics.track('Boki Opened');
  },

  trackBokiMessageSent: (properties?: Record<string, any>) => {
    analytics.track('Message Sent', { feature: 'boki', ...properties });
  },

  trackBokiResponseReceived: (properties?: Record<string, any>) => {
    analytics.track('Response Received', { feature: 'boki', ...properties });
  },

  trackBokiReferenceLinkClicked: (properties?: Record<string, any>) => {
    analytics.track('Reference Link Clicked', { feature: 'boki', ...properties });
  },

  trackBokiConversationOpened: (properties?: Record<string, any>) => {
    analytics.track('Conversation Opened', { feature: 'boki', ...properties });
  },

  trackBokiNewConversation: () => {
    analytics.track('New Conversation Started', { feature: 'boki' });
  },

  trackBokiBackendError: (properties?: Record<string, any>) => {
    analytics.track('Backend Error Displayed', { feature: 'boki', ...properties });
  },

  trackBokiConnectionError: (properties?: Record<string, any>) => {
    analytics.track('Connection Error Displayed', { feature: 'boki', ...properties });
  },

  trackBokiReportButtonClicked: (properties?: Record<string, any>) => {
    analytics.track('Report Button Clicked', { feature: 'boki', ...properties });
  },

  trackBokiReportSubmitted: (properties?: Record<string, any>) => {
    analytics.track('Report Submitted', { feature: 'boki', ...properties });
  },
};
