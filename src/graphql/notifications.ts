import { gql } from '@apollo/client';

// --- Student Operations ---

export const USER_NOTIFICATIONS_QUERY = gql`
  query UserNotifications($page: Int, $per_page: Int) {
    userNotifications(page: $page, per_page: $per_page) {
      data {
        id
        title
        body
        channel
        event_slug
        action_url
        is_read
        read_at
        created_at
      }
      total
      unread_count
      has_more
    }
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      read_at
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

// --- Parent Operations ---

export const PARENT_NOTIFICATIONS_QUERY = gql`
  query ParentNotifications($page: Int, $per_page: Int) {
    parentNotifications(page: $page, per_page: $per_page) {
      data {
        id
        title
        body
        channel
        event_slug
        action_url
        is_read
        read_at
        created_at
      }
      total
      unread_count
      has_more
    }
  }
`;

export const PARENT_MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation ParentMarkNotificationRead($id: ID!) {
    parentMarkNotificationRead(id: $id) {
      read_at
    }
  }
`;

export const PARENT_MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation ParentMarkAllNotificationsRead {
    parentMarkAllNotificationsRead
  }
`;
