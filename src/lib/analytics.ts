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
 */
export const analytics = {
  /**
   * Identify a user and set their traits
   */
  identify: (userId: string, traits?: Record<string, any>) => {
    segmentClient.identify(userId, traits);
  },

  /**
   * Track a general event
   */
  track: (event: string, properties?: Record<string, any>) => {
    segmentClient.track(event, properties);
  },

  /**
   * Track a screen view
   */
  screen: (name: string, properties?: Record<string, any>) => {
    segmentClient.screen(name, properties);
  },

  /**
   * Reset analytics state (usually called on logout)
   */
  reset: () => {
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
    segmentClient.setContext({
      locale: language
    });
  },

  trackSubjectStarted: (subjectId: string, subjectName: string) => {
    analytics.track('Subject Started', { subject_id: subjectId, subject_name: subjectName });
  },
};
