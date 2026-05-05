import { gql } from '@apollo/client';

// --- Student Operations ---

export const NOTIFICATION_PREFERENCES_QUERY = gql`
  query GetNotificationPreferences {
    notificationPreferences {
      app_notifications_enabled
      social_notifications_enabled
    }
  }
`;

export const UPDATE_NOTIFICATION_PREFERENCES_MUTATION = gql`
  mutation UpdateNotificationPreferences($input: UpdateNotificationPreferencesInput!) {
    updateNotificationPreferences(input: $input) {
      app_notifications_enabled
      social_notifications_enabled
    }
  }
`;

// --- Parent Operations ---

export const PARENT_NOTIFICATION_PREFERENCES_QUERY = gql`
  query GetParentNotificationPreferences {
    parentNotificationPreferences {
      app_notifications_enabled
      social_notifications_enabled
    }
  }
`;

export const PARENT_UPDATE_NOTIFICATION_PREFERENCES_MUTATION = gql`
  mutation ParentUpdateNotificationPreferences($input: ParentUpdateNotificationPreferencesInput!) {
    parentUpdateNotificationPreferences(input: $input) {
      app_notifications_enabled
      social_notifications_enabled
    }
  }
`;
