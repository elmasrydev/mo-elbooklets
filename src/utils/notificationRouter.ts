import { NavigationProp } from '@react-navigation/native';
import { extractUserIdFromActionUrl } from './actionUrl';

/**
 * Routes a notification tap to the correct in-app screen.
 *
 * Called from two places:
 *  1. NotificationsScreen — when user taps an in-app notification cell
 *  2. NotificationHandler — when user taps a push notification banner (foreground, background, killed)
 *
 * Routing is determined by event_slug + userRole:
 *  - The same slug (e.g. link_request_accepted) goes to different screens
 *    depending on whether the recipient is a 'student' or 'parent'.
 *
 * @returns true if navigation was handled, false if slug was unknown/missing
 */
export const handleNotificationRoute = (
  navigation: NavigationProp<any>,
  event_slug?: string | null,
  action_url?: string | null,
  userRole?: string | null,
): boolean => {
  if (!event_slug) return false;

  switch (event_slug) {
    // ------------------------------------------------------------------
    // Parent-link flow
    // ------------------------------------------------------------------

    case 'link_request_received':
      if (userRole === 'student') {
        // A student received a link request from a parent.
        navigation.navigate('ParentLinking');
      } else {
        // A parent received a new link request from a student → Requests tab.
        navigation.navigate('ParentMain', {
          screen: 'ParentMainTabs',
          params: { screen: 'ParentRequests' },
        });
      }
      return true;

    case 'link_request_accepted':
      if (userRole === 'student') {
        // Parent accepted the student's request → student opens the ParentLinking screen
        // to see the linked parent and manage the connection.
        navigation.navigate('ParentLinking');
      } else {
        // Student accepted the parent's request → parent opens dashboard to see the new child.
        navigation.navigate('ParentMain', {
          screen: 'ParentMainTabs',
          params: { screen: 'ParentDashboard' },
        });
      }
      return true;

    case 'link_request_declined':
      if (userRole === 'student') {
        // Parent declined the student's request → student opens ParentLinking to retry/review.
        navigation.navigate('ParentLinking');
      } else {
        // Student declined the parent's request → parent opens dashboard.
        navigation.navigate('ParentMain', {
          screen: 'ParentMainTabs',
          params: { screen: 'ParentDashboard' },
        });
      }
      return true;

    // ------------------------------------------------------------------
    // Social / Community activity (student only)
    // ------------------------------------------------------------------

    case 'new_follower': {
      // Open the new follower's profile when the payload carries their id;
      // otherwise fall back to the Community tab. (BKLT-252)
      const followerId = extractUserIdFromActionUrl(action_url);
      if (followerId) {
        navigation.navigate('StudentProfile', { userId: followerId });
      } else {
        navigation.navigate('MainTabs', { screen: 'Community' });
      }
      return true;
    }

    case 'post_liked':
      // A like on the student's post → focus Community tab.
      navigation.navigate('MainTabs', { screen: 'Community' });
      return true;

    // ------------------------------------------------------------------
    // Fallback
    // ------------------------------------------------------------------

    default:
      return false;
  }
};
